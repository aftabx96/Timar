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
