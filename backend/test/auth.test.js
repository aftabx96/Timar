import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

// In-memory Postgres (PGlite) and dev codes in responses, so no mail server is needed.
process.env.NODE_ENV = 'test'
process.env.PGLITE_DIR = 'memory://'
process.env.DATABASE_URL = ''
process.env.SMTP_HOST = ''

const { createApp } = await import('../src/app.js')
const { migrate } = await import('../src/db/migrate.js')
const { seedDemoUsers, DEMO_PASSWORD } = await import('../src/db/seed.js')
const { getDb, closeDb } = await import('../src/db/index.js')

let server
let base

before(async () => {
  await migrate({ log: () => {} })
  await seedDemoUsers()
  server = createApp().listen(0)
  base = `http://localhost:${server.address().port}/api`
})

after(async () => {
  server.close()
  await closeDb()
})

// Tiny client with its own cookie jar, like one browser.
function client() {
  let cookie = ''
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const set = res.headers.get('set-cookie')
    if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0]
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null }
  }
}

const newUser = (email) => ({ name: 'Test Person', email, phone: '0300 1234567', password: 'Fieldtest42' })

test('sign up, wrong code, right code, then /me and profile setup', async () => {
  const api = client()

  const bad = await api('POST', '/auth/signup', { ...newUser('a@timar.com'), password: 'short' })
  assert.equal(bad.status, 400)
  assert.equal(bad.body.error.field, 'password')

  const signup = await api('POST', '/auth/signup', newUser('A@Timar.com'))
  assert.equal(signup.status, 201)
  assert.match(signup.body.devCode, /^\d{6}$/)

  const wrongCode = signup.body.devCode === '000000' ? '111111' : '000000'
  const wrong = await api('POST', '/auth/verify', { email: 'a@timar.com', code: wrongCode })
  assert.equal(wrong.status, 400)
  assert.match(wrong.body.error.message, /4 tries left/)

  const ok = await api('POST', '/auth/verify', { email: 'a@timar.com', code: signup.body.devCode })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.user.role, 'visitor') // SU: new accounts are visitors
  assert.equal(ok.body.user.adopted, 0) // a public user, not an adopter until they pay
  assert.equal(ok.body.user.verified, true)
  assert.equal(ok.body.user.profileComplete, false)
  assert.equal(ok.body.user.password_hash, undefined)

  // The same code cannot be used twice.
  const again = await api('POST', '/auth/verify', { email: 'a@timar.com', code: signup.body.devCode })
  assert.equal(again.status, 400)

  const me = await api('GET', '/auth/me')
  assert.equal(me.status, 200)
  assert.equal(me.body.user.email, 'a@timar.com')

  const missing = await api('PUT', '/me/profile', { role: 'volunteer', details: { area: 'Ibrahim Hyderi', days: [], emergency: '0300' } })
  assert.equal(missing.status, 400)

  const profile = await api('PUT', '/me/profile', {
    role: 'volunteer',
    bio: 'Out most weekends',
    notify: { news: true },
    details: { area: 'Ibrahim Hyderi', days: ['Sat'], boat: 'Yes', emergency: '0321 7654321' },
  })
  assert.equal(profile.status, 200)
  assert.equal(profile.body.user.profileComplete, true)
  assert.equal(profile.body.user.role, 'visitor') // VLM: role changes only on approval
  assert.equal(profile.body.user.volunteerStatus, 'pending')
  assert.equal(profile.body.user.profile.area, 'Ibrahim Hyderi')
  assert.equal(profile.body.user.profile.emergency, undefined) // kept on the application, not the public profile

  const db = await getDb()
  const { rows } = await db.query(`SELECT status, area, emergency_phone FROM volunteer_applications WHERE user_id = $1`, [ok.body.user.id])
  assert.deepEqual(rows, [{ status: 'pending', area: 'Ibrahim Hyderi', emergency_phone: '0321 7654321' }])
})

test('duplicate email is rejected once verified', async () => {
  const res = await client()('POST', '/auth/signup', newUser('sponsor@timar.com'))
  assert.equal(res.status, 409)
  assert.equal(res.body.error.field, 'email')
})

test('password sign in: generic failure message, success, logout signs out', async () => {
  const api = client()
  const unknown = await api('POST', '/auth/login/password', { email: 'nobody@timar.com', password: 'Whatever1' })
  const wrong = await api('POST', '/auth/login/password', { email: 'company@timar.com', password: 'Whatever1' })
  assert.equal(unknown.status, 401)
  assert.equal(unknown.body.error.message, wrong.body.error.message)

  const sponsor = client()
  const adopter = await sponsor('POST', '/auth/login/password', { email: 'sponsor@timar.com', password: DEMO_PASSWORD })
  assert.equal(adopter.body.user.adopted, 40) // paid adoptions only; the pending 10 do not count yet
  const mine = await sponsor('GET', '/me/adoptions')
  assert.deepEqual(mine.body.adoptions.map((x) => [x.quantity, x.status]), [[10, 'pending'], [15, 'paid'], [25, 'paid']])

  const ok = await api('POST', '/auth/login/password', { email: 'company@timar.com', password: DEMO_PASSWORD })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.user.role, 'company')

  assert.equal((await api('GET', '/auth/me')).status, 200)
  assert.equal((await api('POST', '/auth/logout')).status, 204)
  assert.equal((await api('GET', '/auth/me')).status, 401)
})

test('email code sign in looks the same for unknown accounts', async () => {
  const api = client()
  const unknown = await api('POST', '/auth/login/code', { email: 'ghost@timar.com' })
  assert.equal(unknown.status, 200)
  assert.equal(unknown.body.devCode, undefined)

  const known = await api('POST', '/auth/login/code', { email: 'volunteer@timar.com' })
  assert.equal(known.status, 200)
  const signedIn = await api('POST', '/auth/login/code/verify', { email: 'volunteer@timar.com', code: known.body.devCode })
  assert.equal(signedIn.status, 200)
  assert.equal(signedIn.body.user.role, 'volunteer')
  assert.equal(signedIn.body.user.volunteerStatus, 'approved')

  // Asking again straight away is quietly ignored rather than revealing the cooldown.
  const soon = await api('POST', '/auth/login/code', { email: 'volunteer@timar.com' })
  assert.equal(soon.status, 200)
  assert.equal(soon.body.devCode, undefined)
})

test('code locks after five wrong tries', async () => {
  const api = client()
  const sent = await api('POST', '/auth/login/code', { email: 'admin@timar.com' })
  const wrong = sent.body.devCode === '999999' ? '888888' : '999999'
  for (let i = 0; i < 5; i++) await api('POST', '/auth/login/code/verify', { email: 'admin@timar.com', code: wrong })
  const locked = await api('POST', '/auth/login/code/verify', { email: 'admin@timar.com', code: sent.body.devCode })
  assert.equal(locked.status, 400)
  assert.equal(locked.body.error.code, 'code_locked')
})

test('password reset sets the new password and signs in', async () => {
  const laptop = client()
  const sent = await laptop('POST', '/auth/password/forgot', { email: 'sponsor@timar.com' })
  const reset = await laptop('POST', '/auth/password/reset', { email: 'sponsor@timar.com', code: sent.body.devCode, password: 'NewPass2026' })
  assert.equal(reset.status, 200)

  assert.equal((await laptop('GET', '/auth/me')).status, 200)
  const old = await client()('POST', '/auth/login/password', { email: 'sponsor@timar.com', password: DEMO_PASSWORD })
  assert.equal(old.status, 401)
})

test('unverified account gets a code instead of a session', async () => {
  const api = client()
  await api('POST', '/auth/signup', newUser('late@timar.com'))
  const res = await api('POST', '/auth/login/password', { email: 'late@timar.com', password: 'Fieldtest42' })
  assert.equal(res.status, 403)
  assert.equal(res.body.error.code, 'unverified')
  assert.equal((await api('GET', '/auth/me')).status, 401)
})

test('five failed passwords from one source are delayed', async () => {
  const api = client()
  let last
  for (let i = 0; i < 6; i++) last = await api('POST', '/auth/login/password', { email: 'admin@timar.com', password: 'Nope12345' })
  assert.equal(last.status, 429)
  // Even the right password waits until the delay is over.
  const right = await api('POST', '/auth/login/password', { email: 'admin@timar.com', password: DEMO_PASSWORD })
  assert.equal(right.status, 429)
})

test('expired and forged tokens are refused', async () => {
  const { default: jwt } = await import('jsonwebtoken')
  const { config } = await import('../src/config.js')
  const login = await client()('POST', '/auth/login/code', { email: 'company@timar.com' })
  const res = await fetch(`${base}/auth/login/code/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'company@timar.com', code: login.body.devCode }),
  })
  const token = res.headers.get('set-cookie').split(';')[0].split('=')[1]
  const { sub } = jwt.decode(token)
  assert.equal((await fetch(`${base}/auth/me`, { headers: { cookie: `timar_session=${token}` } })).status, 200)

  const expired = jwt.sign({ sub, exp: Math.floor(Date.now() / 1000) - 60 }, config.jwtSecret)
  assert.equal((await fetch(`${base}/auth/me`, { headers: { cookie: `timar_session=${expired}` } })).status, 401)

  const forged = jwt.sign({ sub }, 'not-the-secret')
  assert.equal((await fetch(`${base}/auth/me`, { headers: { cookie: `timar_session=${forged}` } })).status, 401)
})
