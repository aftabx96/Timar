import jwt from 'jsonwebtoken'
import { config } from '../config.js'

const { cookieName, tokenTtlSec, sessionTtlDays } = config.session

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProd,
  path: '/',
  maxAge: sessionTtlDays * 24 * 60 * 60 * 1000,
}

export const signToken = (user, sessionId) =>
  jwt.sign({ sub: user.id, role: user.role, sid: sessionId }, config.jwtSecret, { expiresIn: tokenTtlSec, algorithm: 'HS256' })

export function setSessionCookie(res, token) {
  res.cookie(cookieName, token, cookieOptions)
}

export function clearSessionCookie(res) {
  const { maxAge, ...rest } = cookieOptions // eslint-disable-line no-unused-vars
  res.clearCookie(cookieName, rest)
}

/** Creates a session row and sets the signed token cookie (SI-2). */
export async function startSession(q, req, res, user) {
  const { rows } = await q(
    `INSERT INTO sessions (user_id, user_agent, ip, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(days => $4)) RETURNING id`,
    [user.id, req.get('user-agent')?.slice(0, 300) ?? null, req.ip, sessionTtlDays],
  )
  setSessionCookie(res, signToken(user, rows[0].id))
  return rows[0].id
}

/** Reads the token from the cookie, or from an Authorization: Bearer header for other API clients. */
export function readToken(req) {
  const header = req.get('authorization')
  if (header?.startsWith('Bearer ')) return header.slice(7)
  return req.cookies?.[cookieName] ?? null
}

/** Verifies the signature. An expired token comes back with expired: true so its session can be refreshed. */
export function decodeToken(token) {
  try {
    return { payload: jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }), expired: false }
  } catch (e) {
    if (e.name !== 'TokenExpiredError') return null
    return { payload: jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], ignoreExpiration: true }), expired: true }
  }
}
