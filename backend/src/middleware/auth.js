import { getDb } from '../db/index.js'
import { clearSessionCookie, decodeToken, readToken, setSessionCookie, signToken } from '../lib/session.js'
import { loadUser } from '../lib/users.js'
import { forbidden, handle, unauthorized } from '../lib/errors.js'

/*
  Requires a valid session (SI-2). The signed token is short lived; while the session row behind it
  is still alive and not revoked, an expired token is swapped for a fresh one on the way through.
  That is the "expire and allow refresh" rule from the SRS without a second refresh cookie.
*/
export const requireAuth = handle(async (req, res, next) => {
  const token = readToken(req)
  const decoded = token && decodeToken(token)
  if (!decoded) throw unauthorized()

  const db = await getDb()
  const { rows } = await db.query(
    `UPDATE sessions SET last_seen_at = now()
     WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > now()
     RETURNING id`,
    [decoded.payload.sid, decoded.payload.sub],
  )
  if (!rows.length) {
    clearSessionCookie(res)
    throw unauthorized('Your session has ended. Please sign in again.', { code: 'session_ended' })
  }

  const user = await loadUser(db.query, decoded.payload.sub)
  if (!user) throw unauthorized()

  // Refresh when expired, or when the role changed since the token was signed.
  if (decoded.expired || decoded.payload.role !== user.role) {
    setSessionCookie(res, signToken(user, decoded.payload.sid))
  }

  req.user = user
  req.sessionId = decoded.payload.sid
  next()
})

export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role) ? next() : next(forbidden())

/*
  SI: delay further attempts after five consecutive failures from the same source.
  Kept in memory, which is enough for a single server. Move to the database or Redis if the API scales out.
*/
const failures = new Map()

export function loginThrottle(maxFailures, lockSec) {
  const key = (req) => req.ip
  return {
    check(req) {
      const f = failures.get(key(req))
      if (f?.until && f.until > Date.now()) return Math.ceil((f.until - Date.now()) / 1000)
      return 0
    },
    fail(req) {
      const k = key(req)
      const f = failures.get(k) ?? { count: 0, until: 0 }
      f.count += 1
      if (f.count >= maxFailures) {
        f.until = Date.now() + lockSec * 1000
        f.count = 0
      }
      failures.set(k, f)
    },
    reset(req) {
      failures.delete(key(req))
    },
  }
}
