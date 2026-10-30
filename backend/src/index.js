import { config } from './config.js'
import { getDb, closeDb } from './db/index.js'
import { migrate } from './db/migrate.js'
import { seedDemoUsers } from './db/seed.js'
import { seedContent } from './db/seedContent.js'
import { createApp } from './app.js'

const db = await getDb()
await migrate()
if (!config.isProd) await seedDemoUsers()
await seedContent()

const server = createApp().listen(config.port, () => {
  console.log(`Timar API on http://localhost:${config.port} (${db.driver}${config.exposeDevCodes ? ', codes printed here' : ''})`)
})

const shutdown = () => server.close(() => closeDb().then(() => process.exit(0)))
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
