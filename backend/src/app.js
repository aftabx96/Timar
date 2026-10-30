import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { ZodError } from 'zod'
import { config } from './config.js'
import { ApiError } from './lib/errors.js'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import { adminContent, publicContent } from './routes/content.js'
import uploadRoutes, { UPLOAD_DIR } from './routes/uploads.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 'loopback') // the Vite dev proxy and a production reverse proxy sit on loopback
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(express.json({ limit: '3mb' }))
  app.use(cookieParser())

  // The client calls /api through its own origin (Vite proxy in dev), so cookies stay first party.
  // This header check stops other sites from posting to the API with the user's cookie.
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next()
    const origin = req.get('origin')
    const devOrigin = !config.isProd && origin?.startsWith('http://localhost:')
    if (origin && origin !== config.clientOrigin && !devOrigin) {
      return next(new ApiError(403, 'Request blocked.', { code: 'bad_origin' }))
    }
    next()
  })

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.isTest ? 10_000 : 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { message: 'Too many requests. Please slow down and try again shortly.', code: 'rate_limited' } },
  })

  app.get('/api/health', (req, res) => res.json({ ok: true }))
  app.use('/api/auth', authLimiter, authRoutes)
  app.use('/api/me', profileRoutes)
  app.use('/api', publicContent)
  app.use('/api/admin', adminContent)
  app.use('/api/uploads', uploadRoutes)
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', fallthrough: false }))

  app.use('/api', (req, res) => res.status(404).json({ error: { message: 'Not found.', code: 'not_found' } }))

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ZodError) {
      const first = err.issues[0]
      return res.status(400).json({
        error: {
          message: first.message,
          code: 'invalid_input',
          field: first.path.at(-1),
          fields: Object.fromEntries(err.issues.map((i) => [i.path.at(-1), i.message])),
        },
      })
    }
    if (err instanceof ApiError) {
      if (err.details?.retryAfter) res.set('Retry-After', String(err.details.retryAfter))
      return res.status(err.status).json({ error: { message: err.message, code: err.code, field: err.field, ...err.details } })
    }
    if (err.status === 404 || err.statusCode === 404) {
      return res.status(404).json({ error: { message: 'Not found.', code: 'not_found' } })
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: { message: 'That upload is too large.', code: 'too_large' } })
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { message: 'Malformed request.', code: 'bad_json' } })
    }
    // Database or mail failures: log, keep the message vague (SU: ask the user to try again shortly).
    console.error(err)
    res.status(500).json({ error: { message: 'Something went wrong on our side. Please try again shortly.', code: 'server_error' } })
  })

  return app
}
