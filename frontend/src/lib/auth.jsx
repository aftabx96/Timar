import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/*
  Client side of the Timar auth API (backend/src/routes/auth.js).
  The session lives in an httpOnly cookie set by the server, so nothing secret is stored in the browser.
  In development, without a mail server, the API returns each code as `devCode`; those are pushed to the
  dev inbox listeners, which the DevInbox component shows on screen.
*/

class AuthError extends Error {
  constructor(message, { field, code, status, details } = {}) {
    super(message)
    this.field = field
    this.code = code
    this.status = status
    this.details = details
  }
}

async function api(method, path, body) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new AuthError('Could not reach Timar. Check your connection and try again.', { code: 'network' })
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = data.error ?? {}
    if (e.devCode) mailDevCode(body?.email, e.devCode, 'verify')
    throw new AuthError(e.message || 'Something went wrong. Please try again.', {
      field: e.code === 'unverified' ? 'unverified' : e.field,
      code: e.code,
      status: res.status,
      details: e,
    })
  }
  return data
}

/* ---------- dev inbox: where codes land while there is no mail service ---------- */

const inboxListeners = new Set()
export function onDevMail(fn) {
  inboxListeners.add(fn)
  return () => inboxListeners.delete(fn)
}

const subjects = { verify: 'Verify your Timar account', login: 'Your Timar sign in code', reset: 'Reset your Timar password' }

function mailDevCode(to, code, purpose) {
  if (!code) return
  inboxListeners.forEach((fn) => fn({ id: crypto.randomUUID(), at: new Date(), to, subject: subjects[purpose], code }))
}

// The screens say "signup"; the API calls that code "verify".
const toPurpose = (p) => (p === 'signup' ? 'verify' : p)

export async function resendOtp(email, purpose) {
  const out = await api('POST', '/auth/resend', { email, purpose: toPurpose(purpose) })
  mailDevCode(email, out.devCode, toPurpose(purpose))
  return out
}

/* ---------- validation shared by the forms (mirrors the server rules) ---------- */

export const validators = {
  name: (v) => (v.trim().length < 2 ? 'Enter your full name.' : ''),
  email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Enter an email address like name@example.com.' : ''),
  phone: (v) => {
    const digits = v.replace(/\D/g, '')
    return digits.length < 10 || digits.length > 13 ? 'Enter a phone number like 0300 1234567.' : ''
  },
  password: (v) => {
    if (v.length < 8) return 'Use at least 8 characters.'
    if (!/[a-zA-Z]/.test(v) || !/\d/.test(v)) return 'Mix letters and numbers.'
    return ''
  },
}

export function passwordStrength(v) {
  let s = 0
  if (v.length >= 8) s++
  if (v.length >= 12) s++
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++
  if (/\d/.test(v)) s++
  if (/[^a-zA-Z0-9]/.test(v)) s++
  return Math.min(4, s)
}

/* ---------- context ---------- */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // Restore the session from the cookie on first load.
  useEffect(() => {
    api('GET', '/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true))
  }, [])

  const signup = useCallback(async ({ name, email, phone, password }) => {
    const out = await api('POST', '/auth/signup', { name, email, phone, password })
    mailDevCode(out.email, out.devCode, 'verify')
    return out
  }, [])

  const verifySignup = useCallback(async (email, code) => {
    const { user } = await api('POST', '/auth/verify', { email, code })
    setUser(user)
    return user
  }, [])

  const requestLoginCode = useCallback(async (email) => {
    const out = await api('POST', '/auth/login/code', { email })
    mailDevCode(email, out.devCode, 'login')
    return out
  }, [])

  const verifyLoginCode = useCallback(async (email, code) => {
    const { user } = await api('POST', '/auth/login/code/verify', { email, code })
    setUser(user)
    return user
  }, [])

  const loginWithPassword = useCallback(async (email, password) => {
    const { user } = await api('POST', '/auth/login/password', { email, password })
    setUser(user)
    return user
  }, [])

  // body: { role, bio, photo, notify, details } as expected by PUT /api/me/profile
  const completeProfile = useCallback(async (body) => {
    const { user } = await api('PUT', '/me/profile', body)
    setUser(user)
    return user
  }, [])

  const logout = useCallback(async () => {
    // A transition, like router navigation, so a navigate() called just before lands in the same render
    // and the route guard never sees "signed out on a protected page".
    startTransition(() => setUser(null))
    await api('POST', '/auth/logout').catch(() => {})
  }, [])

  const value = useMemo(
    () => ({ user, ready, signup, verifySignup, requestLoginCode, verifyLoginCode, loginWithPassword, completeProfile, logout }),
    [user, ready, signup, verifySignup, requestLoginCode, verifyLoginCode, loginWithPassword, completeProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const roleHome = (u) => (!u ? '/login' : u.profileComplete ? '/dashboard' : '/setup')
