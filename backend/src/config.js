// All settings come from environment variables (see .env.example).
const env = process.env

const isProd = env.NODE_ENV === 'production'

if (isProd && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to at least 32 characters in production')
}

export const config = {
  isProd,
  isTest: env.NODE_ENV === 'test',
  port: Number(env.PORT) || 4000,
  clientOrigin: env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: env.JWT_SECRET || 'dev-only-secret-change-me-dev-only-secret',

  databaseUrl: env.DATABASE_URL || '',
  pgliteDir: env.PGLITE_DIR || './.data/pglite',

  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT) || 587,
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
  },
  mailFrom: env.MAIL_FROM || 'Timar <no-reply@timar.test>',

  // Without a mail server, codes are returned in API responses so the client dev inbox can show them.
  // Never on in production.
  exposeDevCodes: !isProd && !env.SMTP_HOST,

  // Seeded demo logins (see db/seed.js). No email is ever sent to these addresses.
  demoEmails: ['sponsor@timar.com', 'volunteer@timar.com', 'company@timar.com', 'admin@timar.com', 'zainab@timar.com', 'hamza@timar.com', 'areeba@timar.com'],

  session: {
    cookieName: 'timar_session',
    ttlDays: 7, // how long a sign in lasts before signing in again
  },

  otp: {
    ttlSec: 5 * 60,
    maxAttempts: 5,
    resendCooldownSec: 30,
  },

  login: {
    maxFailures: 5, // SI: delay after five consecutive failures from the same source
    lockSec: 30,
  },
}
