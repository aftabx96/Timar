import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { config } from '../config.js'
import { sendCodeEmail } from './mailer.js'
import { badRequest, tooMany } from './errors.js'

// Codes are stored as an HMAC, never in plain text, and bound to the user and purpose.
const hash = (userId, purpose, code) => createHmac('sha256', config.jwtSecret).update(`${userId}:${purpose}:${code}`).digest('hex')

/**
 * Creates a fresh code (dropping earlier unused ones for the same purpose) and emails it.
 * Returns { resendIn, devCode? }. devCode is only present when no mail server is configured.
 */
export async function issueCode(q, user, purpose, { enforceCooldown = true } = {}) {
  if (enforceCooldown) {
    const { rows } = await q(
      `SELECT EXTRACT(EPOCH FROM (now() - created_at))::int AS age FROM otp_codes
       WHERE user_id = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1`,
      [user.id, purpose],
    )
    const age = rows[0]?.age
    if (age !== undefined && age < config.otp.resendCooldownSec) {
      const wait = config.otp.resendCooldownSec - age
      throw tooMany(`Please wait ${wait} seconds before asking for another code.`, { details: { retryAfter: wait } })
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await q('DELETE FROM otp_codes WHERE user_id = $1 AND purpose = $2', [user.id, purpose])
  await q(
    `INSERT INTO otp_codes (user_id, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(secs => $4))`,
    [user.id, purpose, hash(user.id, purpose, code), config.otp.ttlSec],
  )
  await sendCodeEmail({ to: user.email, name: user.full_name, code, purpose, minutes: Math.round(config.otp.ttlSec / 60) })

  return { resendIn: config.otp.resendCooldownSec, ...(config.exposeDevCodes ? { devCode: code } : {}) }
}

/**
 * Checks a code and marks it used. Returns null on success, or the user facing error.
 * It returns rather than throws so the caller can commit the attempt counter before failing;
 * a throw inside the transaction would roll the counter back and the lockout would never trigger.
 */
export async function consumeCode(q, userId, purpose, code) {
  try {
    await checkCode(q, userId, purpose, code)
    return null
  } catch (e) {
    if (e.status === 400) return e
    throw e
  }
}

async function checkCode(q, userId, purpose, code) {
  const { rows } = await q(
    `SELECT id, code_hash, attempts, expires_at < now() AS expired FROM otp_codes
     WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose],
  )
  const row = rows[0]
  if (!row || row.expired) throw badRequest('That code has expired. Send a new one.', { code: 'code_expired', field: 'code' })
  if (row.attempts >= config.otp.maxAttempts) throw badRequest('Too many wrong attempts. Send a new code.', { code: 'code_locked', field: 'code' })

  const expected = Buffer.from(row.code_hash, 'hex')
  const given = Buffer.from(hash(userId, purpose, code), 'hex')
  if (!timingSafeEqual(expected, given)) {
    await q('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [row.id])
    const left = config.otp.maxAttempts - row.attempts - 1
    throw badRequest(left > 0 ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong attempts. Send a new code.', {
      code: left > 0 ? 'code_wrong' : 'code_locked',
      field: 'code',
    })
  }
  await q('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [row.id])
}
