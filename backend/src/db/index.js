import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { config } from '../config.js'

/*
  One small interface over two drivers:
  - DATABASE_URL set: a real PostgreSQL server through `pg` (production, PostGIS later).
  - DATABASE_URL empty: PGlite, the same Postgres engine compiled to WASM, stored in backend/.data.
  Both speak the same SQL, so migrations and queries are written once.

  db.query(text, params) -> { rows }
  db.tx(async (q) => ...) runs the callback in a transaction, q has the same shape as db.query
*/

let db

export async function getDb() {
  if (db) return db
  db = config.databaseUrl ? await connectPg(config.databaseUrl) : await connectPglite(config.pgliteDir)
  return db
}

export async function closeDb() {
  if (db) await db.close()
  db = undefined
}

/*
  Hosted Postgres (Neon) connection strings carry sslmode and channel_binding in the URL.
  Those are turned into proper pg options here: TLS with certificate checks, and SCRAM channel
  binding when asked for, so nothing unknown is passed on to the server.
*/
function pgOptions(url) {
  const u = new URL(url)
  const sslmode = u.searchParams.get('sslmode')
  const binding = u.searchParams.get('channel_binding')
  u.searchParams.delete('sslmode')
  u.searchParams.delete('channel_binding')
  const local = ['localhost', '127.0.0.1', '::1'].includes(u.hostname)
  return {
    connectionString: u.toString(),
    ssl: sslmode === 'disable' || (local && !sslmode) ? false : { rejectUnauthorized: true },
    enableChannelBinding: binding === 'require',
  }
}

async function connectPg(url) {
  const { default: pg } = await import('pg')
  const pool = new pg.Pool({ ...pgOptions(url), max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 })
  // Hosted databases close idle connections now and then. Without this handler that error would
  // crash the server; the pool simply opens a new connection on the next query.
  pool.on('error', (e) => console.warn(`[db] idle connection dropped: ${e.message}`))
  return {
    driver: 'pg',
    query: (text, params) => pool.query(text, params),
    exec: (sql) => pool.query(sql),
    async tx(fn) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const out = await fn((t, p) => client.query(t, p))
        await client.query('COMMIT')
        return out
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    },
    close: () => pool.end(),
  }
}

/*
  PGlite is a single process database: if two servers open the same folder at once, its files get
  damaged. A lock file next to the folder records which process owns it; a second server refuses to start.
*/
function claimFolder(dir) {
  const lock = `${dir}.lock`
  if (existsSync(lock)) {
    const pid = Number(readFileSync(lock, 'utf8'))
    let alive = false
    try {
      process.kill(pid, 0) // signal 0 only checks that the process exists
      alive = pid !== process.pid
    } catch {
      alive = false
    }
    if (alive) {
      throw new Error(`The database folder ${dir} is already in use by process ${pid}. Stop that server first.`)
    }
  }
  writeFileSync(lock, String(process.pid))
  const release = () => {
    try {
      if (Number(readFileSync(lock, 'utf8')) === process.pid) unlinkSync(lock)
    } catch {
      /* already gone */
    }
  }
  process.on('exit', release)
  return release
}

async function connectPglite(dir) {
  const { PGlite } = await import('@electric-sql/pglite')
  let release = () => {}
  if (!dir.startsWith('memory://')) {
    mkdirSync(dir, { recursive: true })
    release = claimFolder(dir)
  }
  const lite = new PGlite(dir)
  await lite.waitReady
  // PGlite's query() takes one statement; without params fall back to exec() so migrations
  // with several statements work the same as on `pg`.
  const run = (target) => (text, params) =>
    params ? target.query(text, params) : target.exec(text).then((r) => r.at(-1) ?? { rows: [] })
  return {
    driver: 'pglite',
    query: run(lite),
    exec: (sql) => lite.exec(sql),
    tx: (fn) => lite.transaction((t) => fn(run(t))),
    close: () => lite.close().finally(release),
  }
}
