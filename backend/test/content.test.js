import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

process.env.NODE_ENV = 'test'
process.env.PGLITE_DIR = 'memory://'
process.env.DATABASE_URL = ''
process.env.SMTP_HOST = ''
const uploads = mkdtempSync(join(tmpdir(), 'timar-uploads-'))
process.env.UPLOAD_DIR = uploads

const { createApp } = await import('../src/app.js')
const { migrate } = await import('../src/db/migrate.js')
const { seedDemoUsers, DEMO_PASSWORD } = await import('../src/db/seed.js')
const { seedContent } = await import('../src/db/seedContent.js')
const { closeDb } = await import('../src/db/index.js')

let server
let base

before(async () => {
  await migrate({ log: () => {} })
  await seedDemoUsers()
  await seedContent()
  server = createApp().listen(0)
  base = `http://localhost:${server.address().port}`
})

after(async () => {
  server.close()
  await closeDb()
  rmSync(uploads, { recursive: true, force: true })
})

function client() {
  let cookie = ''
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const set = res.headers.get('set-cookie')
    if (set) cookie = set.split(';')[0]
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null }
  }
}

async function signedIn(email) {
  const api = client()
  const r = await api('POST', '/api/auth/login/password', { email, password: DEMO_PASSWORD })
  assert.equal(r.status, 200)
  return api
}

const drive = {
  title: 'Test drive at Buddo Island',
  date: '2026-11-14',
  startTime: '07:30',
  endTime: '12:00',
  site: 'Buddo Island',
  people: 18,
  saplings: 46,
  summary: 'A test.',
  photos: [{ src: '/field/dsc02044-1600.webp', caption: 'Rows', time: '11:23' }],
  published: false,
}

test('seeded content is public', async () => {
  const api = client()
  const drives = await api('GET', '/api/drives')
  assert.equal(drives.status, 200)
  assert.equal(drives.body.drives[0].date, '2026-10-03')
  assert.ok(drives.body.drives[0].photos.length > 5)

  const list = await api('GET', '/api/articles')
  assert.equal(list.body.articles.length, 4)
  assert.equal(list.body.articles[0].body, undefined) // list stays light

  const one = await api('GET', '/api/articles/why-we-photograph-plots')
  assert.equal(one.status, 200)
  assert.match(one.body.article.body, /Same stake, same angle/)

  const awareness = await api('GET', '/api/articles?kind=awareness')
  assert.ok(awareness.body.articles.every((a) => a.kind === 'awareness'))
})

test('only staff can manage content', async () => {
  const anon = client()
  assert.equal((await anon('POST', '/api/admin/drives', drive)).status, 401)
  const volunteer = await signedIn('volunteer@timar.com')
  assert.equal((await volunteer('POST', '/api/admin/drives', drive)).status, 403)
  assert.equal((await volunteer('GET', '/api/admin/articles')).status, 403)
})

test('admin creates, publishes, edits and deletes a drive', async () => {
  const admin = await signedIn('admin@timar.com')
  const pub = client()

  const bad = await admin('POST', '/api/admin/drives', { ...drive, photos: [{ src: 'https://evil.example/x.jpg' }] })
  assert.equal(bad.status, 400)

  const created = await admin('POST', '/api/admin/drives', drive)
  assert.equal(created.status, 201)
  const id = created.body.drive.id

  // a draft is not public
  assert.equal((await pub('GET', `/api/drives/${id}`)).status, 404)
  assert.ok((await admin('GET', '/api/admin/drives')).body.drives.some((d) => d.id === id))

  const edited = await admin('PUT', `/api/admin/drives/${id}`, { ...drive, people: 22, published: true })
  assert.equal(edited.status, 200)
  assert.equal(edited.body.drive.people, 22)
  assert.equal((await pub('GET', `/api/drives/${id}`)).status, 200)

  assert.equal((await admin('DELETE', `/api/admin/drives/${id}`)).status, 204)
  assert.equal((await pub('GET', `/api/drives/${id}`)).status, 404)
  assert.equal((await admin('DELETE', `/api/admin/drives/${id}`)).status, 404)
})

test('admin article slugs stay unique and drafts stay hidden', async () => {
  const admin = await signedIn('admin@timar.com')
  const article = { title: 'Why mangroves matter', kind: 'awareness', summary: 'S', body: 'Mangroves protect the coast and shelter fish.', published: true }
  const a = await admin('POST', '/api/admin/articles', article)
  const b = await admin('POST', '/api/admin/articles', article)
  assert.equal(a.body.article.slug, 'why-mangroves-matter')
  assert.equal(b.body.article.slug, 'why-mangroves-matter-2')

  const hidden = await admin('PUT', `/api/admin/articles/${b.body.article.id}`, { ...article, published: false })
  assert.equal(hidden.body.article.published, false)
  assert.equal((await client()('GET', '/api/articles/why-mangroves-matter-2')).status, 404)

  assert.equal((await admin('DELETE', `/api/admin/articles/${a.body.article.id}`)).status, 204)
})

test('uploads accept real images only', async () => {
  const admin = await signedIn('admin@timar.com')
  // smallest valid PNG
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const ok = await admin('POST', '/api/uploads', { data: `data:image/png;base64,${png}` })
  assert.equal(ok.status, 201)
  assert.match(ok.body.url, /^\/uploads\/[\w-]+\.png$/)
  const served = await fetch(base + ok.body.url)
  assert.equal(served.status, 200)

  const fake = await admin('POST', '/api/uploads', { data: `data:image/png;base64,${Buffer.from('not an image').toString('base64')}` })
  assert.equal(fake.status, 400)
  assert.equal((await fetch(`${base}/uploads/nothing-here.png`)).status, 404)
})

test('admin approves a volunteer request and the overview counts it', async () => {
  // a new person signs up and asks to volunteer
  const person = client()
  const signup = await person('POST', '/api/auth/signup', { name: 'Nida Ali', email: 'nida@timar.com', phone: '0300 1234567', password: 'Fieldtest42' })
  await person('POST', '/api/auth/verify', { email: 'nida@timar.com', code: signup.body.devCode })
  await person('PUT', '/api/me/profile', {
    role: 'volunteer',
    details: { area: 'Kaderu Island', days: ['Sun'], emergency: '0321 7654321' },
  })

  assert.equal((await person('GET', '/api/admin/volunteer-applications')).status, 403)

  const admin = await signedIn('admin@timar.com')
  const before = await admin('GET', '/api/admin/overview')
  assert.equal(before.body.pendingVolunteers, 4) // three seeded requests plus this one
  assert.equal(before.body.volunteers, 1)

  const list = await admin('GET', '/api/admin/volunteer-applications')
  const app = list.body.applications.find((a) => a.email === 'nida@timar.com')
  assert.equal(app.area, 'Kaderu Island')

  assert.equal((await admin('POST', `/api/admin/volunteer-applications/${app.id}/approve`)).status, 204)
  assert.equal((await admin('POST', `/api/admin/volunteer-applications/${app.id}/decline`)).status, 404) // already handled

  const me = await person('GET', '/api/auth/me')
  assert.equal(me.body.user.role, 'volunteer')
  const after = await admin('GET', '/api/admin/overview')
  assert.equal(after.body.pendingVolunteers, 3)
  assert.equal(after.body.volunteers, 2)
})

test('admin marks an adoption paid, assigns its plot and changes roles', async () => {
  const admin = await signedIn('admin@timar.com')
  const sponsor = await signedIn('sponsor@timar.com')
  assert.equal((await sponsor('GET', '/api/admin/adoptions')).status, 403)

  const list = await admin('GET', '/api/admin/adoptions')
  const waiting = list.body.adoptions.find((a) => a.status === 'pending' && a.user.email === 'sponsor@timar.com')
  assert.equal(waiting.quantity, 10)

  const before = (await admin('GET', '/api/admin/overview')).body
  assert.equal(before.pendingPayments, 1)
  assert.equal(before.needsPlot, 0)

  // paid: counts towards the adopter and the overview, and now needs a plot
  assert.equal((await admin('POST', `/api/admin/adoptions/${waiting.id}/paid`)).status, 204)
  assert.equal((await admin('POST', `/api/admin/adoptions/${waiting.id}/paid`)).status, 404)
  assert.equal((await sponsor('GET', '/api/auth/me')).body.user.adopted, 50)
  const after = (await admin('GET', '/api/admin/overview')).body
  assert.equal(after.pendingPayments, 0)
  assert.equal(after.needsPlot, 1)
  assert.equal(after.adopted, before.adopted + 10)

  assert.equal((await admin('PUT', `/api/admin/adoptions/${waiting.id}/plot`, { plot: 'kaderu' })).status, 400)
  assert.equal((await admin('PUT', `/api/admin/adoptions/${waiting.id}/plot`, { plot: 'kd-030' })).status, 204)
  const planted = (await sponsor('GET', '/api/me/adoptions')).body.adoptions.find((a) => a.id === waiting.id)
  assert.equal(planted.plot, 'KD-030')

  // roles
  const users = (await admin('GET', '/api/admin/users')).body.users
  const zainab = users.find((u) => u.email === 'zainab@timar.com')
  const me = users.find((u) => u.email === 'admin@timar.com')
  assert.equal((await admin('PUT', `/api/admin/users/${zainab.id}/role`, { role: 'coordinator' })).status, 204)
  assert.equal((await admin('PUT', `/api/admin/users/${zainab.id}/role`, { role: 'boss' })).status, 400)
  assert.equal((await admin('PUT', `/api/admin/users/${me.id}/role`, { role: 'visitor' })).status, 400)
  const coordinator = await signedIn('zainab@timar.com')
  assert.equal((await coordinator('GET', '/api/admin/users')).status, 200) // coordinators can see users
  assert.equal((await coordinator('PUT', `/api/admin/users/${me.id}/role`, { role: 'visitor' })).status, 403) // but not change roles
})
