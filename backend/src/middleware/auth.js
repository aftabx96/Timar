import { getDb } from '../db/index.js'
import { clearSessionCookie, readUserId } from '../lib/session.js'
import { loadUser } from '../lib/users.js'
import { forbidden, handle, unauthorized } from '../lib/errors.js'

// Requires a signed in user (SI-2). Puts the user on req.user.
export const requireAuth = handle(async (req, res, next) => {
  const id = readUserId(req)
  if (!id) throw unauthorized()

  const db = await getDb()
  const user = await loadUser(db.query, id)
  if (!user) {
    clearSessionCookie(res)
    throw unauthorized('Your session has ended. Please sign in again.', { code: 'session_ended' })
  }

  req.user = user
  next()
})

export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role) ? next() : next(forbidden())

/*
  SI: delay further attempts after five consecutive failures from the same source.
  Kept in memory, which is enough for a single server.
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
