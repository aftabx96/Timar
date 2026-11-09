import { Router } from 'express'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import { ApiError, badRequest, forbidden, handle } from '../lib/errors.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

/*
  Admin dashboard data: overview numbers, volunteer requests, adoptions and users.
  Admins and coordinators can use all of it; only admins can change someone's role.
*/

const router = Router()
router.use(requireAuth, requireRole('admin', 'coordinator'))

const ROLES = ['visitor', 'volunteer', 'company', 'coordinator', 'admin']
const notFound = (message = 'Not found.') => new ApiError(404, message, { code: 'not_found' })
const idParam = z.coerce.number().int().positive()

function readId(req) {
  const id = idParam.safeParse(req.params.id)
  if (!id.success) throw notFound()
  return id.data
}

/* ---------- overview ---------- */

router.get(
  '/overview',
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query(
      `SELECT
         (SELECT count(*) FROM users WHERE role = 'volunteer') AS volunteers,
         (SELECT count(*) FROM volunteer_applications WHERE status = 'pending') AS pending_volunteers,
         (SELECT count(*) FROM drives) AS drives,
         (SELECT COALESCE(sum(saplings), 0) FROM drives) AS saplings,
         (SELECT COALESCE(sum(quantity), 0) FROM adoptions WHERE status = 'paid') AS adopted,
         (SELECT COALESCE(sum(amount_pkr), 0) FROM adoptions WHERE status = 'paid') AS raised,
         (SELECT count(*) FROM adoptions WHERE status = 'pending') AS pending_payments,
         (SELECT count(*) FROM adoptions WHERE status = 'paid' AND plot_code IS NULL) AS needs_plot,
         (SELECT count(*) FROM users) AS users,
         (SELECT count(*) FROM users WHERE created_at >= date_trunc('month', now())) AS new_users,
         (SELECT count(*) FROM drives WHERE NOT published) + (SELECT count(*) FROM articles WHERE NOT published) AS drafts`,
    )
    // saplings planted and sign ups per month this year
    const saplings = await db.query(
      `SELECT extract(month FROM drive_date) AS month, sum(saplings) AS n FROM drives
       WHERE extract(year FROM drive_date) = extract(year FROM now()) GROUP BY 1`,
    )
    const signups = await db.query(
      `SELECT extract(month FROM created_at) AS month, count(*) AS n FROM users
       WHERE extract(year FROM created_at) = extract(year FROM now()) GROUP BY 1`,
    )
    const perMonth = (r) => r.rows.map((x) => ({ month: Number(x.month), value: Number(x.n ?? 0) }))
    const n = Object.fromEntries(Object.entries(rows[0]).map(([k, v]) => [k, Number(v)]))
    res.json({
      volunteers: n.volunteers,
      pendingVolunteers: n.pending_volunteers,
      drives: n.drives,
      saplings: n.saplings,
      adopted: n.adopted,
      raised: n.raised,
      pendingPayments: n.pending_payments,
      needsPlot: n.needs_plot,
      users: n.users,
      newUsers: n.new_users,
      drafts: n.drafts,
      saplingsByMonth: perMonth(saplings),
      signupsByMonth: perMonth(signups),
    })
  }),
)

/* ---------- volunteer requests (SRS VLM) ---------- */

router.get(
  '/volunteer-applications',
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query(
      `SELECT v.id, v.area, v.days, v.boat, v.created_at, u.full_name, u.email, u.phone
       FROM volunteer_applications v JOIN users u ON u.id = v.user_id
       WHERE v.status = 'pending'
       ORDER BY v.created_at`,
    )
    res.json({
      applications: rows.map((r) => ({
        id: r.id,
        name: r.full_name,
        email: r.email,
        phone: r.phone,
        area: r.area,
        days: r.days,
        boat: r.boat,
        createdAt: r.created_at,
      })),
    })
  }),
)

// Approve or decline a request. Approving makes the person a volunteer.
router.post(
  '/volunteer-applications/:id/:decision',
  handle(async (req, res) => {
    const id = readId(req)
    const decision = z.enum(['approve', 'decline']).safeParse(req.params.decision)
    if (!decision.success) throw notFound()

    const db = await getDb()
    await db.tx(async (q) => {
      const status = decision.data === 'approve' ? 'approved' : 'declined'
      const { rows } = await q(`UPDATE volunteer_applications SET status = $2 WHERE id = $1 AND status = 'pending' RETURNING user_id`, [id, status])
      if (!rows[0]) throw notFound('That request was already handled or does not exist.')
      // staff and company accounts keep their role; a visitor becomes a volunteer
      if (status === 'approved') await q(`UPDATE users SET role = 'volunteer' WHERE id = $1 AND role = 'visitor'`, [rows[0].user_id])
    })
    res.status(204).end()
  }),
)

/* ---------- adoptions (SRS 4.9) ---------- */

const adoptionOut = (r) => ({
  id: r.id,
  quantity: r.quantity,
  amount: r.amount_pkr,
  plot: r.plot_code,
  status: r.status,
  createdAt: r.created_at,
  user: { id: r.user_id, name: r.full_name, email: r.email, role: r.role },
})

router.get(
  '/adoptions',
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query(
      `SELECT a.*, u.full_name, u.email, u.role FROM adoptions a JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC`,
    )
    res.json({ adoptions: rows.map(adoptionOut) })
  }),
)

// Records that a pending adoption has been paid.
router.post(
  '/adoptions/:id/paid',
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query(`UPDATE adoptions SET status = 'paid' WHERE id = $1 AND status = 'pending' RETURNING id`, [readId(req)])
    if (!rows[0]) throw notFound('That adoption is not waiting for payment.')
    res.status(204).end()
  }),
)

// Sets the plot a paid adoption was planted in, for example KD-014.
router.put(
  '/adoptions/:id/plot',
  handle(async (req, res) => {
    const id = readId(req)
    const { plot } = z
      .object({ plot: z.string().trim().toUpperCase().regex(/^[A-Z]{2}-\d{3}$/, 'Use a plot code like KD-014.') })
      .parse(req.body)
    const db = await getDb()
    const { rows } = await db.query(`UPDATE adoptions SET plot_code = $2 WHERE id = $1 AND status = 'paid' RETURNING id`, [id, plot])
    if (!rows[0]) throw badRequest('Only paid adoptions can be given a plot.', { field: 'plot' })
    res.status(204).end()
  }),
)

/* ---------- users and roles (SRS ADM) ---------- */

router.get(
  '/users',
  handle(async (req, res) => {
    const db = await getDb()
    const { rows } = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.email_verified, u.company_name, u.created_at,
         (SELECT COALESCE(sum(quantity), 0) FROM adoptions a WHERE a.user_id = u.id AND a.status = 'paid') AS adopted
       FROM users u ORDER BY u.created_at DESC`,
    )
    res.json({
      users: rows.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        verified: u.email_verified,
        company: u.company_name,
        adopted: Number(u.adopted),
        createdAt: u.created_at,
      })),
    })
  }),
)

router.put(
  '/users/:id/role',
  handle(async (req, res) => {
    if (req.user.role !== 'admin') throw forbidden('Only an admin can change roles.')
    const id = readId(req)
    const { role } = z.object({ role: z.enum(ROLES) }).parse(req.body)
    if (id === req.user.id) throw badRequest('You cannot change your own role.', { field: 'role' })
    const db = await getDb()
    const { rows } = await db.query('UPDATE users SET role = $2 WHERE id = $1 RETURNING id', [id, role])
    if (!rows[0]) throw notFound()
    res.status(204).end()
  }),
)

export default router
