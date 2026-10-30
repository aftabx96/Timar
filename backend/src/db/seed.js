import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { getDb, closeDb } from './index.js'
import { migrate } from './migrate.js'

// One verified account per dashboard, for demos. Test values only; never run in production.
export const DEMO_PASSWORD = 'Timar2026'

const DEMO = [
  {
    name: 'Ayesha Siddiqui',
    email: 'sponsor@timar.com',
    phone: '+92 300 1112233',
    role: 'visitor',
    adopted: 25,
    details: { city: 'Karachi', interests: ['Adopting mangroves', 'Trips'] },
  },
  {
    name: 'Bilal Hussain',
    email: 'volunteer@timar.com',
    phone: '+92 321 4445566',
    role: 'volunteer',
    details: { area: 'Ibrahim Hyderi', days: ['Sat', 'Sun'], boat: 'Yes' },
  },
  {
    name: 'Sana Rehman',
    email: 'company@timar.com',
    phone: '+92 333 7778899',
    role: 'company',
    details: { company: 'Indus Textiles Ltd', industry: 'Manufacturing', size: '500+', designation: 'CSR manager' },
  },
  {
    name: 'Rafay Ahmed',
    email: 'admin@timar.com',
    phone: '+92 345 0001122',
    role: 'admin',
    details: { org: 'Saltwater Marina' },
  },
]

export async function seedDemoUsers() {
  const db = await getDb()
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10)
  for (const u of DEMO) {
    // demo logins moved from @timar.test to @timar.com; carry existing rows across instead of duplicating them
    const old = u.email.replace('@timar.com', '@timar.test')
    await db.query(
      `UPDATE users SET email = $1, updated_at = now()
       WHERE lower(email) = lower($2) AND NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = lower($1))`,
      [u.email, old],
    )
    // if both existed, the old demo address goes so it can no longer sign in
    await db.query('DELETE FROM users WHERE lower(email) = lower($1)', [old])
    await db.tx(async (q) => {
      const { rows } = await q(
        `INSERT INTO users (full_name, email, phone, password_hash, role, email_verified_at, profile_complete)
         VALUES ($1, $2, $3, $4, $5, now(), true)
         ON CONFLICT ((lower(email))) DO NOTHING RETURNING id`,
        [u.name, u.email, u.phone, hash, u.role],
      )
      if (rows[0]) {
        await q('INSERT INTO profiles (user_id, details) VALUES ($1, $2)', [rows[0].id, JSON.stringify(u.details)])
      }
      // the demo adopter has paid for 25 mangroves (Rs. 300 each) planted in KD-014; added once
      if (u.adopted) {
        await q(
          `INSERT INTO adoptions (user_id, quantity, amount_pkr, plot_code, status)
           SELECT id, $2, $3, 'KD-014', 'paid' FROM users
           WHERE lower(email) = lower($1) AND NOT EXISTS (SELECT 1 FROM adoptions a WHERE a.user_id = users.id)`,
          [u.email, u.adopted, u.adopted * 300],
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
