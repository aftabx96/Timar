import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { z } from 'zod'
import { audit } from '../lib/audit.js'
import { getDb } from '../db/index.js'
import { badRequest, handle } from '../lib/errors.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

/*
  Staff photo uploads for drives and articles. The browser sends a data URL; the file is checked
  by its first bytes (not just the claimed type), saved under backend/uploads and served at /uploads.
  TODO: move to object storage and resize on upload before going live.
*/

export const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || 'uploads')
mkdirSync(UPLOAD_DIR, { recursive: true })

const MAX_BYTES = 2 * 1024 * 1024

const signatures = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
]

const body = z.object({
  data: z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, 'Use a JPG, PNG or WebP image.'),
})

const router = Router()

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'coordinator'),
  handle(async (req, res) => {
    const { data } = body.parse(req.body)
    const bytes = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64')
    if (bytes.length > MAX_BYTES) throw badRequest('Please use an image under 2 MB.', { field: 'data' })
    const kind = signatures.find((s) => s.test(bytes))
    if (!kind) throw badRequest('That file is not a JPG, PNG or WebP image.', { field: 'data' })

    const name = `${randomUUID()}.${kind.ext}`
    writeFileSync(join(UPLOAD_DIR, name), bytes)
    const db = await getDb()
    await audit(db.query, { userId: req.user.id, action: 'upload.created', meta: { name, bytes: bytes.length }, ip: req.ip })
    res.status(201).json({ url: `/uploads/${name}` })
  }),
)

export default router
