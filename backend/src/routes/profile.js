import { Router } from 'express'
import { z } from 'zod'
import { getDb } from '../db/index.js'
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
  - visitor: stays a visitor (adopting and booking need no approval).
  - volunteer: stays a visitor and files a volunteer application. The role changes on approval (VLM).
  - company: becomes a company account.
  Staff roles (coordinator, admin) keep their role whatever is chosen here.
*/
router.put(
  '/profile',
  requireAuth,
  handle(async (req, res) => {
    const input = body.parse(req.body)
    const d = input.details
    const db = await getDb()
    const staff = ['coordinator', 'admin'].includes(req.user.role)

    let role = req.user.role
    if (!staff) {
      if (input.role === 'company') role = 'company'
      else if (req.user.role !== 'volunteer') role = 'visitor'
    }
    const notify = { ...req.user.profile.notify, ...input.notify }

    const user = await db.tx(async (q) => {
      await q(
        `UPDATE users SET role = $2, profile_complete = true, bio = $3, photo = $4,
           city = $5, interests = $6, company_name = $7, designation = $8, industry = $9, company_size = $10,
           notify_surveys = $11, notify_trips = $12, notify_news = $13
         WHERE id = $1`,
        [
          req.user.id,
          role,
          input.bio,
          input.photo || null,
          d.city ?? null,
          d.interests ?? [],
          d.company ?? null,
          d.designation ?? null,
          d.industry ?? null,
          d.size ?? null,
          notify.surveys,
          notify.trips,
          notify.news,
        ],
      )

      // a volunteer application: update the pending one, or file a new one
      if (input.role === 'volunteer' && role !== 'volunteer') {
        const fields = [d.area, d.days, d.boat ?? null, d.emergency]
        const updated = await q(
          `UPDATE volunteer_applications SET area = $2, days = $3, boat = $4, emergency_phone = $5
           WHERE user_id = $1 AND status = 'pending' RETURNING id`,
          [req.user.id, ...fields],
        )
        if (!updated.rows.length) {
          await q('INSERT INTO volunteer_applications (user_id, area, days, boat, emergency_phone) VALUES ($1, $2, $3, $4, $5)', [req.user.id, ...fields])
        }
      }

      return loadUser(q, req.user.id)
    })

    res.json({ user })
  }),
)

// The signed in user's adoptions, newest first (SRS 4.9 track adopted plot).
router.get(
  '/adoptions',
  requireAuth,
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query('SELECT * FROM adoptions WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id])
    res.json({
      adoptions: rows.map((a) => ({
        id: a.id,
        quantity: a.quantity,
        amount: a.amount_pkr,
        plot: a.plot_code,
        status: a.status,
        createdAt: a.created_at,
      })),
    })
  }),
)

export default router
