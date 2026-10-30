import { Router } from 'express'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import { audit } from '../lib/audit.js'
import { handle } from '../lib/errors.js'
import { loadUser } from '../lib/users.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

export const AREAS = ['Rehri Goth', 'Kaderu Island', 'Buddo Island', 'Kairi Creek', 'Ibrahim Hyderi', 'Keti Bandar']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Profile photo arrives as a data URL from the setup screen. Capped near 2 MB of image data.
// TODO: move to file storage once uploads exist for survey photos.
const photo = z
  .string()
  .regex(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/, 'Use a PNG, JPG, WebP or GIF image.')
  .max(2_800_000, 'Please use an image under 2 MB.')
  .or(z.literal(''))
  .optional()

const common = {
  bio: z.string().trim().max(160).default(''),
  photo,
  notify: z.object({ surveys: z.boolean(), trips: z.boolean(), news: z.boolean() }).partial().default({}),
}

const body = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('visitor'),
    ...common,
    details: z.object({
      city: z.string().trim().min(1, 'Enter your city.').max(80),
      interests: z.array(z.string().max(40)).max(10).default([]),
    }),
  }),
  z.object({
    role: z.literal('volunteer'),
    ...common,
    details: z.object({
      area: z.enum(AREAS, { message: 'Pick the area closest to you.' }),
      days: z.array(z.enum(DAYS)).min(1, 'Pick at least one day.'),
      boat: z.enum(['Yes', 'No', 'A few times']).optional(),
      emergency: z
        .string()
        .trim()
        .refine((v) => v.replace(/\D/g, '').length >= 10, 'Enter a phone number for emergencies.'),
    }),
  }),
  z.object({
    role: z.literal('company'),
    ...common,
    details: z.object({
      company: z.string().trim().min(2, 'Enter the company name.').max(120),
      designation: z.string().trim().max(80).default(''),
      industry: z.string().trim().min(1, 'Choose an industry.').max(60),
      size: z.enum(['1 to 50', '51 to 200', '201 to 500', '500+'], { message: 'Choose a size.' }),
    }),
  }),
])

/*
  Saves the profile setup answers.
  - visitor: stays a visitor (sponsoring and booking need no approval).
  - volunteer: stays a visitor and files a volunteer application. The role changes on approval (VLM).
  - company: becomes a company account.
  Staff roles (coordinator, admin) keep their role whatever is chosen here.
*/
router.put(
  '/profile',
  requireAuth,
  handle(async (req, res) => {
    const input = body.parse(req.body)
    const db = await getDb()
    const staff = ['coordinator', 'admin'].includes(req.user.role)

    const user = await db.tx(async (q) => {
      const { emergency, ...details } = input.details

      await q(
        `INSERT INTO profiles (user_id, bio, photo, details, notify, updated_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (user_id) DO UPDATE SET bio = $2, photo = $3, details = $4, notify = profiles.notify || $5, updated_at = now()`,
        [req.user.id, input.bio, input.photo || null, JSON.stringify(details), JSON.stringify(input.notify)],
      )

      let role = req.user.role
      if (!staff) {
        if (input.role === 'company') role = 'company'
        else if (req.user.role !== 'volunteer') role = 'visitor'
      }
      await q('UPDATE users SET role = $2, profile_complete = true, updated_at = now() WHERE id = $1', [req.user.id, role])

      if (input.role === 'volunteer' && role !== 'volunteer') {
        const { rows } = await q(`SELECT id FROM volunteer_applications WHERE user_id = $1 AND status = 'pending'`, [req.user.id])
        if (rows.length) {
          await q(`UPDATE volunteer_applications SET area = $2, days = $3, boat = $4, emergency_phone = $5 WHERE id = $1`, [
            rows[0].id,
            details.area,
            details.days,
            details.boat ?? null,
            emergency,
          ])
        } else {
          await q(`INSERT INTO volunteer_applications (user_id, area, days, boat, emergency_phone) VALUES ($1, $2, $3, $4, $5)`, [
            req.user.id,
            details.area,
            details.days,
            details.boat ?? null,
            emergency,
          ])
          await audit(q, { userId: req.user.id, action: 'volunteer.applied', meta: { area: details.area }, ip: req.ip })
        }
      }

      await audit(q, { userId: req.user.id, action: 'profile.updated', meta: { chose: input.role }, ip: req.ip })
      return loadUser(q, req.user.id)
    })

    res.json({ user })
  }),
)

export default router
