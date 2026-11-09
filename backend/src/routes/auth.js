import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import { config } from '../config.js'
import { badRequest, conflict, handle, tooMany, unauthorized, ApiError } from '../lib/errors.js'
import { consumeCode, issueCode } from '../lib/otp.js'
import { clearSessionCookie, startSession } from '../lib/session.js'
import { findByEmail, loadUser } from '../lib/users.js'
import { loginThrottle, requireAuth } from '../middleware/auth.js'

const router = Router()
const throttle = loginThrottle(config.login.maxFailures, config.login.lockSec)
const BCRYPT_ROUNDS = 12

/* ---------- input rules (SU-2) ---------- */

const email = z.string().trim().toLowerCase().email('Enter an email address like name@example.com.').max(254)
const password = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(128, 'Use 128 characters or fewer.')
  .regex(/[a-zA-Z]/, 'Mix letters and numbers.')
  .regex(/\d/, 'Mix letters and numbers.')
const code = z.string().trim().regex(/^\d{6}$/, 'Enter the 6 digit code.')
const phone = z
  .string()
  .trim()
  .refine((v) => {
    const d = v.replace(/\D/g, '')
    return d.length >= 10 && d.length <= 13
  }, 'Enter a phone number like 0300 1234567.')

const signupBody = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(120),
  email,
  phone,
  password,
})

/* ---------- helpers ---------- */

let dummy
const dummyHash = async () => (dummy ??= await bcrypt.hash('no-account-here', BCRYPT_ROUNDS))

// Responses that must look the same whether or not the account exists (SI-4).
async function sendCodeQuietly(q, user, purpose) {
  if (!user) return { resendIn: config.otp.resendCooldownSec }
  try {
    return await issueCode(q, user, purpose)
  } catch (e) {
    if (e.code === 'rate_limited') return { resendIn: e.details.retryAfter }
    throw e
  }
}

/**
 * Runs onValid inside a transaction once the emailed code checks out.
 * A wrong code still commits its attempt count, then the error is thrown after the transaction.
 */
async function withCode(body, purpose, onValid) {
  const db = await getDb()
  const out = await db.tx(async (q) => {
    const row = await findByEmail(q, body.email)
    if (!row) return { error: badRequest('That code is not right.', { code: 'code_wrong', field: 'code' }) }
    const error = await consumeCode(q, row.id, purpose, body.code)
    if (error) return { error }
    return { value: await onValid(q, row) }
  })
  if (out.error) throw out.error
  return out.value
}

async function signIn(q, res, row) {
  startSession(res, row)
  return loadUser(q, row.id)
}

/* ---------- sign up ---------- */

router.post(
  '/signup',
  handle(async (req, res) => {
    const body = signupBody.parse(req.body)
    const db = await getDb()

    const out = await db.tx(async (q) => {
      const existing = await findByEmail(q, body.email)
      if (existing?.email_verified) {
        throw conflict('This email already has an account.', { code: 'email_taken', field: 'email' })
      }
      const hash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)
      let user
      if (existing) {
        // Started sign up before but never verified: take the new details and send a new code.
        const { rows } = await q(
          `UPDATE users SET full_name = $2, phone = $3, password_hash = $4 WHERE id = $1 RETURNING *`,
          [existing.id, body.name, body.phone, hash],
        )
        user = rows[0]
      } else {
        const { rows } = await q(
          `INSERT INTO users (full_name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING *`,
          [body.name, body.email, body.phone, hash],
        )
        user = rows[0]
      }
      return issueCode(q, user, 'verify', { enforceCooldown: false })
    })

    res.status(201).json({ email: body.email, ...out })
  }),
)

router.post(
  '/verify',
  handle(async (req, res) => {
    const body = z.object({ email, code }).parse(req.body)
    const user = await withCode(body, 'verify', async (q, row) => {
      await q('UPDATE users SET email_verified = true WHERE id = $1', [row.id])
      return signIn(q, res, row)
    })
    res.json({ user })
  }),
)

/* ---------- sign in with an emailed code ---------- */

router.post(
  '/login/code',
  handle(async (req, res) => {
    const body = z.object({ email }).parse(req.body)
    const db = await getDb()
    const out = await db.tx(async (q) => sendCodeQuietly(q, await findByEmail(q, body.email), 'login'))
    res.json(out)
  }),
)

router.post(
  '/login/code/verify',
  handle(async (req, res) => {
    const body = z.object({ email, code }).parse(req.body)
    const user = await withCode(body, 'login', async (q, row) => {
      // Receiving the code proves the inbox, so an unverified account becomes verified here.
      if (!row.email_verified) await q('UPDATE users SET email_verified = true WHERE id = $1', [row.id])
      return signIn(q, res, row)
    })
    res.json({ user })
  }),
)

/* ---------- sign in with a password ---------- */

router.post(
  '/login/password',
  handle(async (req, res) => {
    const wait = throttle.check(req)
    if (wait) throw tooMany(`Too many failed attempts. Try again in ${wait} seconds.`, { details: { retryAfter: wait } })

    const body = z.object({ email, password: z.string().min(1, 'Enter your password.').max(128) }).parse(req.body)
    const db = await getDb()

    const result = await db.tx(async (q) => {
      const row = await findByEmail(q, body.email)
      // Compare against a dummy hash when the account is missing so timing does not reveal it.
      const ok = await bcrypt.compare(body.password, row?.password_hash ?? (await dummyHash()))
      if (!row || !ok) return { failed: true }
      if (!row.email_verified) {
        const sent = await sendCodeQuietly(q, row, 'verify')
        return { unverified: sent }
      }
      return { user: await signIn(q, res, row) }
    })

    if (result.failed) {
      throttle.fail(req)
      throw unauthorized('The email or password is incorrect.', { code: 'bad_credentials' })
    }
    throttle.reset(req)
    if (result.unverified) {
      throw new ApiError(403, 'This account is not verified yet. We sent you a new code.', { code: 'unverified', details: result.unverified })
    }
    res.json({ user: result.user })
  }),
)

/* ---------- codes, password reset, session ---------- */

router.post(
  '/resend',
  handle(async (req, res) => {
    const body = z.object({ email, purpose: z.enum(['verify', 'login', 'reset']) }).parse(req.body)
    const db = await getDb()
    const out = await db.tx(async (q) => {
      const row = await findByEmail(q, body.email)
      if (body.purpose === 'verify' && row && !row.email_verified) return issueCode(q, row, 'verify')
      return sendCodeQuietly(q, row, body.purpose)
    })
    res.json(out)
  }),
)

router.post(
  '/password/forgot',
  handle(async (req, res) => {
    const body = z.object({ email }).parse(req.body)
    const db = await getDb()
    const out = await db.tx(async (q) => sendCodeQuietly(q, await findByEmail(q, body.email), 'reset'))
    res.json(out)
  }),
)

router.post(
  '/password/reset',
  handle(async (req, res) => {
    const body = z.object({ email, code, password }).parse(req.body)
    const user = await withCode(body, 'reset', async (q, row) => {
      const hash = await bcrypt.hash(body.password, BCRYPT_ROUNDS)
      await q('UPDATE users SET password_hash = $2, email_verified = true WHERE id = $1', [row.id, hash])
      return signIn(q, res, row)
    })
    res.json({ user })
  }),
)

router.get(
  '/me',
  requireAuth,
  handle(async (req, res) => res.json({ user: req.user })),
)

router.post(
  '/logout',
  handle(async (req, res) => {
    clearSessionCookie(res)
    res.status(204).end()
  }),
)

export default router
