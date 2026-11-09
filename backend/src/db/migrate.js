import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getDb, closeDb } from './index.js'

const schema = readFileSync(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8')

// Creates any table in schema.sql that does not exist yet. Safe to run on every start.
export async function migrate() {
  const db = await getDb()
  await db.query(schema)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(closeDb)
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
