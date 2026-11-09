import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { getDb, closeDb } from './index.js'
import { migrate } from './migrate.js'

/*
  Demo accounts and their data, so every dashboard has something to show. Test values only;
  never run in production. All demo accounts sign in with DEMO_PASSWORD and never receive email.
  Each row is added only if it is not there yet, so running this again changes nothing.
  `joined` back dates the demo accounts so the sign ups chart has history.
*/
export const DEMO_PASSWORD = 'Timar2026'

const PRICE = 300 // rupees per mangrove

const DEMO = [
  {
    name: 'Ayesha Siddiqui',
    email: 'sponsor@timar.com',
    joined: '2026-04-08',
    phone: '+92 300 1112233',
    role: 'visitor',
    city: 'Karachi',
    interests: ['Adopting mangroves', 'Trips'],
    adoptions: [
      { quantity: 25, plot: 'KD-014', status: 'paid', on: '2026-04-10' },
      { quantity: 15, plot: 'KD-021', status: 'paid', on: '2026-08-22' },
      { quantity: 10, plot: null, status: 'pending', on: '2026-11-01' },
    ],
  },
  {
    name: 'Bilal Hussain',
    email: 'volunteer@timar.com',
    joined: '2026-06-30',
    phone: '+92 321 4445566',
    role: 'volunteer',
    volunteer: { status: 'approved', area: 'Ibrahim Hyderi', days: ['Sat', 'Sun'], boat: 'Yes', on: '2026-07-02' },
  },
  {
    name: 'Sana Rehman',
    email: 'company@timar.com',
    joined: '2026-01-12',
    phone: '+92 333 7778899',
    role: 'company',
    company: { name: 'Indus Textiles Ltd', designation: 'CSR manager', industry: 'Manufacturing', size: '500+' },
    adoptions: [
      { quantity: 4000, plot: 'BU-003', status: 'paid', on: '2026-01-15' },
      { quantity: 800, plot: 'KD-021', status: 'paid', on: '2026-03-08' },
      { quantity: 1200, plot: 'KD-014', status: 'paid', on: '2026-04-10' },
      { quantity: 1000, plot: 'KD-027', status: 'paid', on: '2026-10-05' },
    ],
  },
  {
    name: 'Rafay Ahmed',
    email: 'admin@timar.com',
    joined: '2026-01-05',
    phone: '+92 345 0001122',
    role: 'admin',
  },
  // people waiting for the admin to answer their volunteer request
  {
    name: 'Zainab Qureshi',
    email: 'zainab@timar.com',
    joined: '2026-10-27',
    phone: '+92 300 2223344',
    role: 'visitor',
    city: 'Karachi',
    volunteer: { status: 'pending', area: 'Ibrahim Hyderi', days: ['Sat', 'Sun'], boat: 'Yes', on: '2026-10-28' },
  },
  {
    name: 'Hamza Baig',
    email: 'hamza@timar.com',
    joined: '2026-10-30',
    phone: '+92 312 5556677',
    role: 'visitor',
    city: 'Karachi',
    volunteer: { status: 'pending', area: 'Kaderu Island', days: ['Fri', 'Sat'], boat: 'A few times', on: '2026-10-30' },
  },
  {
    name: 'Areeba Noor',
    email: 'areeba@timar.com',
    joined: '2026-11-02',
    phone: '+92 333 8889900',
    role: 'visitor',
    city: 'Karachi',
    volunteer: { status: 'pending', area: 'Buddo Island', days: ['Sun'], boat: 'No', on: '2026-11-02' },
  },
]

export async function seedDemoUsers() {
  const db = await getDb()
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10)
  for (const u of DEMO) {
    await db.tx(async (q) => {
      await q(
        `INSERT INTO users (full_name, email, phone, password_hash, role, email_verified, profile_complete,
           city, interests, company_name, designation, industry, company_size, created_at)
         VALUES ($1, $2, $3, $4, $5, true, true, $6, $7, $8, $9, $10, $11, $12::date)
         ON CONFLICT (email) DO UPDATE SET created_at = EXCLUDED.created_at WHERE users.created_at > EXCLUDED.created_at`,
        [u.name, u.email, u.phone, hash, u.role, u.city ?? null, u.interests ?? [], u.company?.name ?? null, u.company?.designation ?? null, u.company?.industry ?? null, u.company?.size ?? null, u.joined],
      )
      const id = (await q('SELECT id FROM users WHERE email = $1', [u.email])).rows[0].id

      const v = u.volunteer
      if (v) {
        await q(
          `INSERT INTO volunteer_applications (user_id, status, area, days, boat, created_at)
           SELECT $1, $2, $3, $4, $5, $6::date WHERE NOT EXISTS (SELECT 1 FROM volunteer_applications WHERE user_id = $1)`,
          [id, v.status, v.area, v.days, v.boat, v.on],
        )
      }

      for (const a of u.adoptions ?? []) {
        await q(
          `INSERT INTO adoptions (user_id, quantity, amount_pkr, plot_code, status, created_at)
           SELECT $1, $2, $3, $4, $5, $6::date
           WHERE NOT EXISTS (SELECT 1 FROM adoptions WHERE user_id = $1 AND quantity = $2 AND created_at::date = $6::date)`,
          [id, a.quantity, a.quantity * PRICE, a.plot, a.status, a.on],
        )
      }
    })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(seedDemoUsers)
    .then(closeDb)
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
