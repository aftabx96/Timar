import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { getDb, closeDb } from './index.js'

const dir = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

// Applies every .sql file in migrations/ that has not run yet, in name order.
export async function migrate({ log = console.log } = {}) {
  const db = await getDb()
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`)
  const { rows } = await db.query('SELECT name FROM schema_migrations')
  const done = new Set(rows.map((r) => r.name))

  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(file)) continue
    const sql = readFileSync(join(dir, file), 'utf8')
    await db.tx(async (q) => {
      await q(sql)
      await q('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
    })
    log(`migrated ${file}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(closeDb)
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
