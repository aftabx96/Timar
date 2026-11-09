import jwt from 'jsonwebtoken'
import { config } from '../config.js'

/*
  Signing in gives the browser a signed token (JWT) in an httpOnly cookie. The token holds the
  user id and lasts config.session.ttlDays days. Signing out clears the cookie.
*/

const { cookieName, ttlDays } = config.session

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/',
  maxAge: ttlDays * 24 * 60 * 60 * 1000,
}

/** Signs a token for the user and puts it in the session cookie. */
export function startSession(res, user) {
  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: `${ttlDays}d`, algorithm: 'HS256' })
  res.cookie(cookieName, token, cookieOptions)
}

export function clearSessionCookie(res) {
  const { maxAge, ...rest } = cookieOptions // eslint-disable-line no-unused-vars
  res.clearCookie(cookieName, rest)
}

/** Returns the user id from a valid token in the cookie (or an Authorization: Bearer header), else null. */
export function readUserId(req) {
  const header = req.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.[cookieName]
  if (!token) return null
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }).sub
  } catch {
    return null
  }
}
