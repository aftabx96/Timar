// npm run db:check
// Connects with the settings in .env, prints what it found, runs migrations and seeds, and counts rows.
import { config } from '../src/config.js'
import { getDb, closeDb } from '../src/db/index.js'
import { migrate } from '../src/db/migrate.js'
import { seedDemoUsers } from '../src/db/seed.js'
import { seedContent } from '../src/db/seedContent.js'

const where = config.databaseUrl ? new URL(config.databaseUrl).hostname : `PGlite in ${config.pgliteDir}`

try {
  const db = await getDb()
  const { rows } = await db.query('SELECT version() AS v')
  console.log(`Connected to ${where} (${db.driver})`)
  console.log(rows[0].v.split(',')[0])

  if (db.driver === 'pg') {
    const ext = await db.query("SELECT 1 FROM pg_available_extensions WHERE name = 'postgis'")
    console.log(ext.rows.length ? 'PostGIS is available (needed later for plot boundaries)' : 'PostGIS is not available on this server')
  }

  await migrate()
  if (!config.isProd) await seedDemoUsers()
  await seedContent()

  for (const table of ['users', 'adoptions', 'drives', 'articles']) {
    const r = await db.query(`SELECT count(*)::int AS n FROM ${table}`)
    console.log(`  ${table.padEnd(10)} ${r.rows[0].n}`)
  }
  console.log('Database is ready.')
} catch (e) {
  console.error(`Could not use the database at ${where}:\n  ${e.message}`)
  if (/password authentication/i.test(e.message)) console.error('  Check the user and password in DATABASE_URL.')
  if (/ENOTFOUND|getaddrinfo/i.test(e.message)) console.error('  The host name in DATABASE_URL could not be found. Check the connection string and your internet.')
  process.exitCode = 1
} finally {
  await closeDb()
}
