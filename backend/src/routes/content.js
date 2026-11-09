import { Router } from 'express'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import { ApiError, handle } from '../lib/errors.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

/*
  Journal content: past drives and awareness articles (SRS 4.13).
  Public routes only ever return published items. Staff routes (admin, coordinator) see drafts too
  and can create, edit and delete.
*/

export const publicContent = Router()
export const adminContent = Router()
adminContent.use(requireAuth, requireRole('admin', 'coordinator'))

const notFound = () => new ApiError(404, 'Not found.', { code: 'not_found' })

/* ---------- shared rules ---------- */

// Photos come from the field library (/field/...) or from the upload route (/uploads/...).
const photoSrc = z
  .string()
  .regex(/^\/(field\/[\w.-]+\.webp|uploads\/[\w-]+\.(jpg|jpeg|png|webp))$/, 'Pick a photo from the library or upload one.')

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time like 07:30.')
  .or(z.literal(''))
  .optional()

const driveBody = z.object({
  title: z.string().trim().min(3, 'Give the drive a title.').max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick the date of the drive.'),
  startTime: time,
  endTime: time,
  site: z.string().trim().min(2, 'Where did the drive go?').max(80),
  departedFrom: z.string().trim().max(80).default('Rehri Goth'),
  people: z.coerce.number().int().min(0).max(5000).nullable().optional(),
  saplings: z.coerce.number().int().min(0).max(1_000_000).nullable().optional(),
  summary: z.string().trim().max(2000).default(''),
  photos: z
    .array(z.object({ src: photoSrc, caption: z.string().trim().max(200).default(''), time: z.string().trim().max(10).default('') }))
    .max(24, 'Up to 24 photos per drive.')
    .default([]),
  published: z.boolean().default(false),
})

const articleBody = z.object({
  title: z.string().trim().min(3, 'Give the article a title.').max(140),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase words joined by dashes.')
    .max(80)
    .or(z.literal(''))
    .optional(),
  kind: z.enum(['article', 'awareness']).default('article'),
  summary: z.string().trim().max(400).default(''),
  body: z.string().trim().min(20, 'Write at least a few sentences.').max(40_000),
  cover: photoSrc.or(z.literal('')).optional(),
  published: z.boolean().default(false),
})

const idParam = z.coerce.number().int().positive()

/* ---------- shaping rows for the API ---------- */

const driveOut = (r) => ({
  id: r.id,
  title: r.title,
  date: r.drive_date instanceof Date ? r.drive_date.toISOString().slice(0, 10) : String(r.drive_date).slice(0, 10),
  startTime: r.start_time ?? '',
  endTime: r.end_time ?? '',
  site: r.site,
  departedFrom: r.departed_from,
  people: r.people,
  saplings: r.saplings,
  summary: r.summary,
  photos: r.photos,
  published: r.published,
})

const minutesToRead = (text) => Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200))

const articleOut = (r, withBody = true) => ({
  id: r.id,
  slug: r.slug,
  kind: r.kind,
  title: r.title,
  summary: r.summary,
  ...(withBody ? { body: r.body } : {}),
  cover: r.cover,
  minutes: minutesToRead(r.body),
  published: r.published,
  publishedAt: r.published_at,
})

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'article'

// makes the slug unique by adding -2, -3 ... ; `except` is the article being edited
async function uniqueSlug(q, base, except = null) {
  let slug = base
  for (let n = 2; ; n++) {
    const { rows } = await q('SELECT id FROM articles WHERE lower(slug) = lower($1) AND ($2::int IS NULL OR id <> $2)', [slug, except])
    if (!rows.length) return slug
    slug = `${base}-${n}`
  }
}

/* ---------- public ---------- */

publicContent.get(
  '/drives',
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query('SELECT * FROM drives WHERE published ORDER BY drive_date DESC, created_at DESC')
    res.json({ drives: rows.map(driveOut) })
  }),
)

publicContent.get(
  '/drives/:id',
  handle(async (req, res) => {
    const id = idParam.safeParse(req.params.id)
    if (!id.success) throw notFound()
    const db = await getDb()
    const { rows } = await db.query('SELECT * FROM drives WHERE id = $1 AND published', [id.data])
    if (!rows[0]) throw notFound()
    res.json({ drive: driveOut(rows[0]) })
  }),
)

publicContent.get(
  '/articles',
  handle(async (req, res) => {
    const kind = z.enum(['article', 'awareness']).optional().parse(req.query.kind || undefined)
    const db = await getDb()
    const { rows } = await db.query(
      `SELECT * FROM articles WHERE published AND ($1::text IS NULL OR kind = $1) ORDER BY published_at DESC NULLS LAST, created_at DESC`,
      [kind ?? null],
    )
    res.json({ articles: rows.map((r) => articleOut(r, false)) })
  }),
)

publicContent.get(
  '/articles/:slug',
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query('SELECT * FROM articles WHERE lower(slug) = lower($1) AND published', [req.params.slug])
    if (!rows[0]) throw notFound()
    res.json({ article: articleOut(rows[0]) })
  }),
)

/* ---------- staff: drives ---------- */

adminContent.get(
  '/drives',
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query('SELECT * FROM drives ORDER BY drive_date DESC, created_at DESC')
    res.json({ drives: rows.map(driveOut) })
  }),
)

const driveParams = (d) => [
  d.title,
  d.date,
  d.startTime || null,
  d.endTime || null,
  d.site,
  d.departedFrom,
  d.people ?? null,
  d.saplings ?? null,
  d.summary,
  JSON.stringify(d.photos),
  d.published,
]

adminContent.post(
  '/drives',
  handle(async (req, res) => {
    const d = driveBody.parse(req.body)
    const db = await getDb()
    const drive = await db.tx(async (q) => {
      const { rows } = await q(
        `INSERT INTO drives (title, drive_date, start_time, end_time, site, departed_from, people, saplings, summary, photos, published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        driveParams(d),
      )
      return rows[0]
    })
    res.status(201).json({ drive: driveOut(drive) })
  }),
)

adminContent.put(
  '/drives/:id',
  handle(async (req, res) => {
    const id = idParam.safeParse(req.params.id)
    if (!id.success) throw notFound()
    const d = driveBody.parse(req.body)
    const db = await getDb()
    const drive = await db.tx(async (q) => {
      const { rows } = await q(
        `UPDATE drives SET title = $1, drive_date = $2, start_time = $3, end_time = $4, site = $5, departed_from = $6,
           people = $7, saplings = $8, summary = $9, photos = $10, published = $11
         WHERE id = $12 RETURNING *`,
        [...driveParams(d), id.data],
      )
      if (!rows[0]) throw notFound()
      return rows[0]
    })
    res.json({ drive: driveOut(drive) })
  }),
)

adminContent.delete(
  '/drives/:id',
  handle(async (req, res) => {
    const id = idParam.safeParse(req.params.id)
    if (!id.success) throw notFound()
    const db = await getDb()
    await db.tx(async (q) => {
      const { rows } = await q('DELETE FROM drives WHERE id = $1 RETURNING id', [id.data])
      if (!rows[0]) throw notFound()
    })
    res.status(204).end()
  }),
)

/* ---------- staff: articles ---------- */

adminContent.get(
  '/articles',
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query('SELECT * FROM articles ORDER BY created_at DESC')
    res.json({ articles: rows.map((r) => articleOut(r)) })
  }),
)

adminContent.post(
  '/articles',
  handle(async (req, res) => {
    const a = articleBody.parse(req.body)
    const db = await getDb()
    const article = await db.tx(async (q) => {
      const slug = await uniqueSlug(q, a.slug || slugify(a.title))
      const { rows } = await q(
        `INSERT INTO articles (slug, kind, title, summary, body, cover, published, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 THEN now() END) RETURNING *`,
        [slug, a.kind, a.title, a.summary, a.body, a.cover || null, a.published],
      )
      return rows[0]
    })
    res.status(201).json({ article: articleOut(article) })
  }),
)

adminContent.put(
  '/articles/:id',
  handle(async (req, res) => {
    const id = idParam.safeParse(req.params.id)
    if (!id.success) throw notFound()
    const a = articleBody.parse(req.body)
    const db = await getDb()
    const article = await db.tx(async (q) => {
      const current = (await q('SELECT slug FROM articles WHERE id = $1', [id.data])).rows[0]
      if (!current) throw notFound()
      const slug = a.slug ? await uniqueSlug(q, a.slug, id.data) : current.slug
      const { rows } = await q(
        `UPDATE articles SET slug = $1, kind = $2, title = $3, summary = $4, body = $5, cover = $6, published = $7,
           published_at = CASE WHEN $7 THEN COALESCE(published_at, now()) ELSE NULL END
         WHERE id = $8 RETURNING *`,
        [slug, a.kind, a.title, a.summary, a.body, a.cover || null, a.published, id.data],
      )
      return rows[0]
    })
    res.json({ article: articleOut(article) })
  }),
)

adminContent.delete(
  '/articles/:id',
  handle(async (req, res) => {
    const id = idParam.safeParse(req.params.id)
    if (!id.success) throw notFound()
    const db = await getDb()
    await db.tx(async (q) => {
      const { rows } = await q('DELETE FROM articles WHERE id = $1 RETURNING id', [id.data])
      if (!rows[0]) throw notFound()
    })
    res.status(204).end()
  }),
)
