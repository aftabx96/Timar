/*
  Timar use case diagrams (UML), generated from the SRS (sections 4.1 to 4.22).

  Run:  node generate.cjs
  Writes one SVG per diagram into this folder, and a PNG next to each when the `sharp`
  package can be found (NODE_PATH=/path/to/node_modules node generate.cjs).

  Layout rules that keep the diagrams readable:
  - use cases an actor is linked to sit in the column nearest that actor, left aligned,
    so the association lines fan out without crossing other use cases;
  - included and extending use cases sit in the next column;
  - generalisation arrows can be routed outside the system boundary.

  Solid white ellipse  = FYP-I use case (current phase)
  Dashed grey ellipse  = FYP-II use case (planned)
*/
const fs = require('fs')
const path = require('path')

const OUT = __dirname
const FONT = 'Arial, Helvetica, sans-serif'
const INK = '#1d2b24'

/* ------------------------------------------------------------ use cases */
// id: [label, phase]
const UC = {
  browse: ['Browse public website', 1],
  read: ['Read awareness articles', 1],
  journal: ['View past drives', 1],
  impact: ['View public impact dashboard', 1],
  map: ['View plots on map', 1],
  signup: ['Sign up', 1],
  verify: ['Verify email with code', 1],
  signin: ['Sign in', 1],
  signinCode: ['Sign in with email code', 1],
  reset: ['Reset password', 1],
  profile: ['Set up profile', 1],
  editProfile: ['Edit profile', 1],
  signout: ['Sign out', 1],
  adopt: ['Adopt mangroves', 1],
  adoptBulk: ['Adopt mangroves in bulk', 1],
  pay: ['Pay online', 1],
  track: ['Track adopted plot', 1],
  timeline: ['View photo timeline', 1],
  reqPhoto: ['Request follow up photo', 1],
  book: ['Book a trip', 1],
  bookStaff: ['Book a staff drive', 1],
  waitlist: ['Join waiting list', 1],
  cancel: ['Cancel booking', 1],
  apply: ['Apply to volunteer', 1],
  reviewApps: ['Review volunteer applications', 1],
  tasks: ['View field tasks', 1],
  acceptTask: ['Accept or decline task', 1],
  assign: ['Assign field tasks', 1],
  hours: ['View hours record', 1],
  survey: ['Submit photo survey', 1],
  stakePhotos: ['Upload stake photos', 1],
  verifySurvey: ['Verify survey', 1],
  createPlot: ['Create plot', 1],
  updatePlot: ['Update plot', 1],
  archivePlot: ['Archive plot', 1],
  manageTrips: ['Manage trips', 1],
  attendance: ['Mark attendance', 1],
  users: ['Manage users and roles', 1],
  content: ['Manage articles and drive records', 1],
  uploadPhotos: ['Upload photos', 1],
  export: ['Export plot and survey data', 1],
  sendCode: ['Send verification code', 1],
  sendConfirm: ['Send booking confirmation', 1],
  processPay: ['Process payment', 1],
  // FYP-II
  complaint: ['Report cutting', 2],
  processComplaint: ['Process cutting complaint', 2],
  receiveComplaint: ['Receive cutting complaint', 2],
  threat: ['View threat map', 2],
  feed: ['Post to community feed', 2],
  moderate: ['Moderate community feed', 2],
  media: ['Request interview or information', 2],
  handleMedia: ['Handle media requests', 2],
  portfolio: ['View company portfolio', 2],
  report: ['Download impact report', 2],
  health: ['Assess plant health from photo', 2],
  count: ['Count seedlings in photo', 2],
  healthResult: ['View plant health result', 2],
  sites: ['Get site recommendations', 2],
  detect: ['Detect mangrove change', 2],
  risk: ['Predict survival risk', 2],
  verifyAlert: ['Verify satellite alert', 2],
  audit: ['View audit log and reports', 2],
  models: ['Manage model versions', 2],
}

/* ---------------------------------------------------------------- shapes */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function wrap(text, max) {
  const lines = []
  let line = ''
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > max && line) {
      lines.push(line)
      line = w
    } else line = (line + ' ' + w).trim()
  }
  lines.push(line)
  return lines
}

function caseBox(id) {
  const [label, phase] = UC[id]
  const lines = wrap(label, 21)
  const longest = Math.max(...lines.map((l) => l.length))
  return { lines, rx: Math.max(86, longest * 4.3 + 28), ry: 23 + (lines.length - 1) * 9, phase }
}

// point on an ellipse boundary towards (tx, ty)
function edge(cx, cy, rx, ry, tx, ty) {
  const dx = tx - cx
  const dy = ty - cy
  const t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2 || 1)
  return [cx + dx * t, cy + dy * t]
}

function drawCase(id, x, y) {
  const b = caseBox(id)
  const planned = b.phase === 2
  let s = `<ellipse cx="${x}" cy="${y}" rx="${b.rx}" ry="${b.ry}" fill="${planned ? '#f1f1f1' : '#fff'}" stroke="${planned ? '#777' : INK}" stroke-width="1.6"${planned ? ' stroke-dasharray="6 4"' : ''}/>`
  const top = y - ((b.lines.length - 1) * 16) / 2 + 5
  b.lines.forEach((l, i) => {
    s += `<text x="${x}" y="${top + i * 16}" text-anchor="middle" font-family="${FONT}" font-size="13.5" fill="${planned ? '#555' : '#14231b'}">${esc(l)}</text>`
  })
  return s
}

// stick figure; (x, y) is the middle of the body. Head top is y - 45, label ends near y + 56.
function drawHuman(name, x, y) {
  const lines = wrap(name, 16)
  let s = `<g stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round">
    <circle cx="${x}" cy="${y - 34}" r="11" fill="#fff"/>
    <line x1="${x}" y1="${y - 23}" x2="${x}" y2="${y + 8}"/>
    <line x1="${x - 18}" y1="${y - 12}" x2="${x + 18}" y2="${y - 12}"/>
    <line x1="${x}" y1="${y + 8}" x2="${x - 14}" y2="${y + 32}"/>
    <line x1="${x}" y1="${y + 8}" x2="${x + 14}" y2="${y + 32}"/></g>`
  lines.forEach((l, i) => {
    s += `<text x="${x}" y="${y + 52 + i * 16}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="bold" fill="#14231b">${esc(l)}</text>`
  })
  return s
}

const systemSize = (name) => {
  const lines = wrap(name, 18)
  return { lines, w: Math.max(...lines.map((l) => l.length)) * 7.8 + 30, h: 36 + lines.length * 16 }
}

function drawSystem(name, x, y) {
  const { lines, w, h } = systemSize(name)
  let s = `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="4" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`
  s += `<text x="${x}" y="${y - h / 2 + 20}" text-anchor="middle" font-family="${FONT}" font-size="12" fill="#444">«system»</text>`
  lines.forEach((l, i) => {
    s += `<text x="${x}" y="${y - h / 2 + 40 + i * 16}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="bold" fill="#14231b">${esc(l)}</text>`
  })
  return s
}

function arrowHead(x1, y1, x2, y2, open = true) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const l = open ? 11 : 15
  const w = open ? 0.4 : 0.45
  const p1 = [x2 - l * Math.cos(a - w), y2 - l * Math.sin(a - w)]
  const p2 = [x2 - l * Math.cos(a + w), y2 - l * Math.sin(a + w)]
  return open
    ? `<polyline points="${p1} ${x2},${y2} ${p2}" fill="none" stroke="${INK}" stroke-width="1.4"/>`
    : `<polygon points="${p1} ${x2},${y2} ${p2}" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`
}

/* ---------------------------------------------------------------- render */

function render(d) {
  // place use cases: each column lists ids (evenly spaced) or [id, y] pairs (fixed height)
  const pos = {}
  for (const col of d.columns) {
    const n = col.ids.length
    col.ids.forEach((item, i) => {
      const [id, fixedY] = Array.isArray(item) ? item : [item, null]
      const y = fixedY ?? (n > 1 ? col.y1 + (i * (col.y2 - col.y1)) / (n - 1) : (col.y1 + col.y2) / 2)
      const { rx } = caseBox(id)
      const x = col.align === 'center' ? col.x : col.align === 'right' ? col.x - rx : col.x + rx
      pos[id] = [x, y]
    })
  }
  const actors = Object.fromEntries(d.actors.map((a) => [a.id, a.kind === 'system' ? { ...a, ...systemSize(a.name) } : a]))

  let lines = ''
  // associations
  for (const [aid, cid] of d.links) {
    const a = actors[aid]
    const [cx, cy] = pos[cid]
    const b = caseBox(cid)
    let ax
    let ay
    if (a.kind === 'system') {
      if (Math.abs(cx - a.x) < a.w / 2 + 40 && Math.abs(cy - a.y) > a.h / 2) {
        ax = a.x
        ay = cy > a.y ? a.y + a.h / 2 : a.y - a.h / 2
      } else {
        ax = cx > a.x ? a.x + a.w / 2 : a.x - a.w / 2
        ay = a.y
      }
    } else {
      ax = a.x + (cx > a.x ? 18 : -18)
      ay = a.y - 12
    }
    // actor clearly to one side: meet the ellipse at its outermost point, so the line never
    // passes over the other use cases in the same aligned column
    const [ex, ey] = ax < cx - b.rx ? [cx - b.rx, cy] : ax > cx + b.rx ? [cx + b.rx, cy] : edge(cx, cy, b.rx, b.ry, ax, ay)
    lines += `<line x1="${ax}" y1="${ay}" x2="${ex}" y2="${ey}" stroke="${INK}" stroke-width="1.3"${b.phase === 2 ? ' stroke-dasharray="5 4" stroke-opacity=".75"' : ''}/>`
  }

  // include / extend
  let labels = ''
  for (const r of d.rels || []) {
    const [x1, y1] = pos[r.from]
    const [x2, y2] = pos[r.to]
    const b1 = caseBox(r.from)
    const b2 = caseBox(r.to)
    const [sx, sy] = edge(x1, y1, b1.rx, b1.ry, x2, y2)
    const [tx, ty] = edge(x2, y2, b2.rx, b2.ry, x1, y1)
    lines += `<line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" stroke="${INK}" stroke-width="1.3" stroke-dasharray="6 4"/>`
    lines += arrowHead(sx, sy, tx, ty)
    const mx = (sx + tx) / 2
    const my = (sy + ty) / 2
    labels += `<rect x="${mx - 33}" y="${my - 11}" width="66" height="18" rx="3" fill="#fafbf7"/>`
    labels += `<text x="${mx}" y="${my + 3}" text-anchor="middle" font-family="${FONT}" font-size="12" font-style="italic" fill="#14231b">«${r.type}»</text>`
  }

  // generalisation: explicit polyline (points) or a straight line between the figures
  for (const g of d.gens || []) {
    let pts = g.points
    if (!pts) {
      const c = actors[g.child]
      const p = actors[g.parent]
      const labelBottom = (a) => a.y + 58 + (wrap(a.name, 16).length - 1) * 16
      pts = p.y < c.y ? [[c.x, c.y - 48], [p.x, labelBottom(p)]] : [[c.x, labelBottom(c)], [p.x, p.y - 48]]
    }
    lines += `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${INK}" stroke-width="1.4"/>`
    const [a, b] = pts.slice(-2)
    lines += arrowHead(a[0], a[1], b[0], b[1], false)
  }

  const B = d.boundary
  let shapes = `<rect x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" rx="10" fill="#fafbf7" stroke="#2f5a3a" stroke-width="2"/>`
  shapes += `<text x="${B.x + 18}" y="${B.y + 30}" font-family="${FONT}" font-size="17" font-weight="bold" fill="#2f5a3a">${esc(B.label || 'Timar')}</text>`
  let top = ''
  for (const id of Object.keys(pos)) top += drawCase(id, ...pos[id])
  for (const a of d.actors) top += a.kind === 'system' ? drawSystem(a.name, a.x, a.y) : drawHuman(a.name, a.x, a.y)

  const W = d.width
  const H = d.height
  const head = `<text x="40" y="46" font-family="${FONT}" font-size="22" font-weight="bold" fill="#14231b">${esc(d.title)}</text>
    <text x="40" y="70" font-family="${FONT}" font-size="13" fill="#555">${esc(d.subtitle)}</text>`
  const ly = H - 28
  const legend = `<g font-family="${FONT}" font-size="12.5" fill="#333">
    <ellipse cx="60" cy="${ly}" rx="26" ry="11" fill="#fff" stroke="${INK}" stroke-width="1.4"/><text x="94" y="${ly + 4}">FYP-I (current phase)</text>
    <ellipse cx="270" cy="${ly}" rx="26" ry="11" fill="#f1f1f1" stroke="#777" stroke-width="1.4" stroke-dasharray="6 4"/><text x="304" y="${ly + 4}">FYP-II (planned)</text>
    <line x1="450" y1="${ly}" x2="500" y2="${ly}" stroke="${INK}" stroke-dasharray="6 4"/><text x="510" y="${ly + 4}">«include» / «extend»</text>
    <line x1="670" y1="${ly}" x2="716" y2="${ly}" stroke="${INK}"/><polygon points="704,${ly - 7} 720,${ly} 704,${ly + 7}" fill="#fff" stroke="${INK}"/><text x="732" y="${ly + 4}">is a kind of (generalisation)</text></g>`

  // order: boundary, lines, use cases and actors on top, then include labels above everything
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/>${head}${shapes}${lines}${top}${labels}${legend}</svg>`
}

/* -------------------------------------------------------------- diagrams */

const human = (id, name, x, y) => ({ id, name, x, y, kind: 'human' })
const system = (id, name, x, y) => ({ id, name, x, y, kind: 'system' })

const DIAGRAMS = [
  {
    file: '01-visitor',
    title: 'Actor 1: Visitor (public user)',
    subtitle: 'Anyone using the website, signed in or not. Every other person actor is a kind of Visitor.',
    width: 1320,
    height: 960,
    boundary: { x: 270, y: 110, w: 780, h: 760 },
    actors: [human('v', 'Visitor', 120, 500), system('forest', 'Sindh Forest Department', 1180, 600), system('email', 'Email Service', 1180, 790)],
    columns: [
      { x: 360, y1: 190, y2: 800, ids: ['browse', 'read', 'journal', 'impact', 'map', 'complaint', 'threat', 'signup'] },
      { x: 760, ids: [['verify', 800]] },
    ],
    links: [
      ['v', 'browse'], ['v', 'read'], ['v', 'journal'], ['v', 'impact'], ['v', 'map'], ['v', 'complaint'], ['v', 'threat'], ['v', 'signup'],
      ['email', 'verify'], ['forest', 'complaint'],
    ],
    rels: [{ from: 'signup', to: 'verify', type: 'include' }],
  },
  {
    file: '02-registered-user',
    title: 'Actor 2: Registered User',
    subtitle: 'Any signed up account. Adopter, Company, Volunteer and Field Coordinator are kinds of Registered User.',
    width: 1480,
    height: 1000,
    boundary: { x: 450, y: 110, w: 760, h: 800 },
    actors: [
      human('ru', 'Registered User', 215, 470),
      human('ad', 'Adopter', 65, 790),
      human('co', 'Company', 165, 790),
      human('vo', 'Volunteer', 265, 790),
      human('fc', 'Field Coordinator', 365, 790),
      system('email', 'Email Service', 1340, 330),
    ],
    columns: [
      { x: 520, y1: 190, y2: 840, ids: ['signin', 'profile', 'editProfile', 'book', 'cancel', 'apply', 'feed', 'signout'] },
      { x: 900, ids: [['signinCode', 190], ['verify', 330], ['reset', 455], ['waitlist', 560], ['pay', 690]] },
    ],
    links: [['ru', 'signin'], ['ru', 'profile'], ['ru', 'editProfile'], ['ru', 'book'], ['ru', 'cancel'], ['ru', 'apply'], ['ru', 'feed'], ['ru', 'signout'], ['email', 'verify']],
    rels: [
      { from: 'signinCode', to: 'signin', type: 'extend' },
      { from: 'signinCode', to: 'verify', type: 'include' },
      { from: 'reset', to: 'signin', type: 'extend' },
      { from: 'reset', to: 'verify', type: 'include' },
      { from: 'waitlist', to: 'book', type: 'extend' },
      { from: 'book', to: 'pay', type: 'include' },
    ],
    gens: [
      { child: 'ad', parent: 'ru' },
      { child: 'co', parent: 'ru' },
      { child: 'vo', parent: 'ru' },
      { child: 'fc', parent: 'ru' },
    ],
  },
  {
    file: '03-adopter',
    title: 'Actor 3: Adopter',
    subtitle: 'A public user who has paid for at least one mangrove.',
    width: 1320,
    height: 900,
    boundary: { x: 260, y: 110, w: 780, h: 700 },
    actors: [human('ad', 'Adopter', 115, 480), system('pay', 'Payment Gateway', 1180, 200), system('ai', 'AI Model Service', 1180, 580)],
    columns: [
      { x: 350, y1: 200, y2: 740, ids: ['adopt', 'track', 'reqPhoto', 'book', 'feed'] },
      { x: 740, ids: [['pay', 200], ['timeline', 380], ['healthResult', 580]] },
    ],
    links: [['ad', 'adopt'], ['ad', 'track'], ['ad', 'reqPhoto'], ['ad', 'book'], ['ad', 'feed'], ['pay', 'pay'], ['ai', 'healthResult']],
    rels: [
      { from: 'adopt', to: 'pay', type: 'include' },
      { from: 'track', to: 'timeline', type: 'include' },
      { from: 'reqPhoto', to: 'track', type: 'extend' },
      { from: 'healthResult', to: 'timeline', type: 'extend' },
    ],
  },
  {
    file: '04-company',
    title: 'Actor 4: Company',
    subtitle: 'A business that adopts mangroves in bulk and books drives for its staff.',
    width: 1320,
    height: 840,
    boundary: { x: 260, y: 110, w: 780, h: 640 },
    actors: [human('co', 'Company', 115, 440), system('pay', 'Payment Gateway', 1180, 275)],
    columns: [
      { x: 350, y1: 200, y2: 680, ids: ['adoptBulk', 'bookStaff', 'track', 'portfolio'] },
      { x: 740, ids: [['pay', 275], ['timeline', 520], ['report', 680]] },
    ],
    links: [['co', 'adoptBulk'], ['co', 'bookStaff'], ['co', 'track'], ['co', 'portfolio'], ['pay', 'pay']],
    rels: [
      { from: 'adoptBulk', to: 'pay', type: 'include' },
      { from: 'bookStaff', to: 'pay', type: 'include' },
      { from: 'track', to: 'timeline', type: 'include' },
      { from: 'report', to: 'portfolio', type: 'extend' },
    ],
  },
  {
    file: '05-volunteer',
    title: 'Actor 5: Volunteer',
    subtitle: 'A registered user whose volunteer application was approved. Collects the field data.',
    width: 1320,
    height: 960,
    boundary: { x: 260, y: 110, w: 780, h: 760 },
    actors: [human('vo', 'Volunteer', 115, 500), system('ai', 'AI Model Service', 1180, 470)],
    columns: [
      { x: 350, y1: 190, y2: 800, ids: ['tasks', 'survey', 'book', 'hours', 'verifyAlert', 'complaint'] },
      { x: 740, ids: [['acceptTask', 190], ['stakePhotos', 290], ['health', 420], ['count', 540]] },
    ],
    links: [['vo', 'tasks'], ['vo', 'survey'], ['vo', 'book'], ['vo', 'hours'], ['vo', 'verifyAlert'], ['vo', 'complaint'], ['ai', 'health'], ['ai', 'count']],
    rels: [
      { from: 'acceptTask', to: 'tasks', type: 'extend' },
      { from: 'survey', to: 'stakePhotos', type: 'include' },
      { from: 'health', to: 'survey', type: 'extend' },
      { from: 'count', to: 'survey', type: 'extend' },
    ],
  },
  {
    file: '06-field-coordinator',
    title: 'Actor 6: Field Coordinator',
    subtitle: 'Saltwater Marina field staff. The quality gate between raw field entries and published records.',
    width: 1320,
    height: 1060,
    boundary: { x: 260, y: 110, w: 780, h: 860 },
    actors: [human('fc', 'Field Coordinator', 115, 540), system('ai', 'AI Model Service', 1180, 800), system('forest', 'Sindh Forest Department', 1180, 905)],
    columns: [
      { x: 350, y1: 190, y2: 900, ids: ['createPlot', 'updatePlot', 'assign', 'verifySurvey', 'reviewApps', 'manageTrips', 'verifyAlert', 'sites', 'processComplaint'] },
      { x: 740, ids: [['attendance', 545]] },
    ],
    links: [
      ['fc', 'createPlot'], ['fc', 'updatePlot'], ['fc', 'assign'], ['fc', 'verifySurvey'], ['fc', 'reviewApps'], ['fc', 'manageTrips'],
      ['fc', 'verifyAlert'], ['fc', 'sites'], ['fc', 'processComplaint'], ['ai', 'sites'], ['forest', 'processComplaint'],
    ],
    rels: [{ from: 'attendance', to: 'manageTrips', type: 'extend' }],
  },
  {
    file: '07-administrator',
    title: 'Actor 7: Administrator',
    subtitle: 'Saltwater Marina account holder. Does everything a Field Coordinator does, plus the use cases below.',
    width: 1320,
    height: 1000,
    boundary: { x: 300, y: 110, w: 760, h: 800 },
    actors: [human('admin', 'Administrator', 140, 600), human('fc', 'Field Coordinator', 140, 230)],
    columns: [
      { x: 390, y1: 190, y2: 840, ids: ['archivePlot', 'users', 'content', 'export', 'handleMedia', 'moderate', 'audit', 'models'] },
      { x: 790, ids: [['uploadPhotos', 380]] },
    ],
    links: [['admin', 'archivePlot'], ['admin', 'users'], ['admin', 'content'], ['admin', 'export'], ['admin', 'handleMedia'], ['admin', 'moderate'], ['admin', 'audit'], ['admin', 'models']],
    rels: [{ from: 'content', to: 'uploadPhotos', type: 'include' }],
    gens: [{ child: 'admin', parent: 'fc' }],
  },
  {
    file: '08-journalist-researcher',
    title: 'Actor 8: Journalist / Researcher',
    subtitle: 'Journalists, students and researchers who want information from Saltwater Marina. A kind of Visitor.',
    width: 1220,
    height: 720,
    boundary: { x: 300, y: 110, w: 640, h: 520 },
    actors: [human('jr', 'Journalist / Researcher', 140, 480), human('v', 'Visitor', 140, 200), system('email', 'Email Service', 1080, 545)],
    columns: [{ x: 420, y1: 200, y2: 545, ids: ['read', 'impact', 'media'] }],
    links: [['jr', 'read'], ['jr', 'impact'], ['jr', 'media'], ['email', 'media']],
    gens: [{ child: 'jr', parent: 'v' }],
  },
  {
    file: '09-external-systems',
    title: 'Actors 9 to 14: External systems',
    subtitle: 'Systems outside Timar that it works with. The Scheduler starts the satellite check on a timer.',
    width: 1420,
    height: 960,
    boundary: { x: 340, y: 110, w: 740, h: 760 },
    actors: [
      system('email', 'Email Service', 160, 245),
      system('pay', 'Payment Gateway', 160, 480),
      system('forest', 'Sindh Forest Department', 160, 715),
      system('ai', 'AI Model Service', 1260, 390),
      system('sat', 'Copernicus Sentinel-2', 1260, 640),
      system('timer', 'Scheduler', 1260, 790),
    ],
    columns: [
      { x: 400, ids: [['sendCode', 190], ['sendConfirm', 300], ['processPay', 480], ['receiveComplaint', 715]] },
      { x: 1020, align: 'right', y1: 190, y2: 790, ids: ['health', 'count', 'risk', 'sites', 'detect'] },
    ],
    links: [
      ['email', 'sendCode'], ['email', 'sendConfirm'], ['pay', 'processPay'], ['forest', 'receiveComplaint'],
      ['ai', 'health'], ['ai', 'count'], ['ai', 'risk'], ['ai', 'sites'], ['ai', 'detect'], ['sat', 'detect'], ['timer', 'detect'],
    ],
  },
  {
    // Overview: each actor's main use cases in a block next to it. Included and extending use cases
    // are in the per-actor diagrams. Generalisations run outside the boundary.
    file: '10-combined',
    title: 'Combined use case diagram: Timar',
    subtitle:
      'Every actor and its main use cases. Included and extending use cases are shown in the actor diagrams. A specialised actor inherits the use cases of the actor its arrow points to.',
    width: 3060,
    height: 2420,
    boundary: { x: 560, y: 130, w: 1880, h: 2050, label: 'Timar platform' },
    actors: [
      human('jr', 'Journalist / Researcher', 340, 235),
      human('v', 'Visitor', 190, 690),
      system('email', 'Email Service', 420, 1105),
      human('ru', 'Registered User', 190, 1450),
      human('ad', 'Adopter', 330, 1880),
      human('co', 'Company', 150, 2060),
      system('pay', 'Payment Gateway', 380, 2260),
      human('vo', 'Volunteer', 2700, 360),
      human('admin', 'Administrator', 2700, 940),
      human('fc', 'Field Coordinator', 2700, 1700),
      system('sat', 'Copernicus Sentinel-2', 760, 2290),
      system('timer', 'Scheduler', 1000, 2290),
      system('ai', 'AI Model Service', 1450, 2290),
      system('forest', 'Sindh Forest Department', 2620, 2280),
    ],
    columns: [
      {
        x: 640,
        y1: 220,
        y2: 2070,
        ids: ['media', 'browse', 'read', 'journal', 'impact', 'map', 'complaint', 'threat', 'signup', 'signin', 'profile', 'book', 'cancel', 'apply', 'feed', 'adopt', 'track', 'portfolio'],
      },
      { x: 1000, align: 'center', ids: [['detect', 2040]] },
      { x: 1450, align: 'center', ids: [['health', 2040]] },
      { x: 1900, align: 'center', ids: [['count', 2040]] },
      {
        x: 2330,
        align: 'right',
        y1: 220,
        y2: 2070,
        ids: ['tasks', 'survey', 'hours', 'verifyAlert', 'archivePlot', 'users', 'content', 'export', 'handleMedia', 'moderate', 'audit', 'models', 'reviewApps', 'assign', 'verifySurvey', 'createPlot', 'updatePlot', 'manageTrips', 'sites', 'processComplaint'],
      },
    ],
    links: [
      ['jr', 'media'],
      ['v', 'browse'], ['v', 'read'], ['v', 'journal'], ['v', 'impact'], ['v', 'map'], ['v', 'complaint'], ['v', 'threat'], ['v', 'signup'],
      ['email', 'signup'], ['email', 'signin'],
      ['ru', 'signin'], ['ru', 'profile'], ['ru', 'book'], ['ru', 'cancel'], ['ru', 'apply'], ['ru', 'feed'],
      ['ad', 'adopt'], ['ad', 'track'], ['co', 'adopt'], ['co', 'track'], ['co', 'portfolio'], ['pay', 'adopt'],
      ['vo', 'tasks'], ['vo', 'survey'], ['vo', 'hours'], ['vo', 'verifyAlert'],
      ['admin', 'archivePlot'], ['admin', 'users'], ['admin', 'content'], ['admin', 'export'], ['admin', 'handleMedia'], ['admin', 'moderate'], ['admin', 'audit'], ['admin', 'models'],
      ['fc', 'reviewApps'], ['fc', 'assign'], ['fc', 'verifySurvey'], ['fc', 'createPlot'], ['fc', 'updatePlot'], ['fc', 'manageTrips'], ['fc', 'sites'], ['fc', 'processComplaint'], ['fc', 'verifyAlert'],
      ['ai', 'health'], ['ai', 'count'], ['ai', 'detect'], ['ai', 'sites'], ['sat', 'detect'], ['timer', 'detect'], ['forest', 'processComplaint'],
    ],
    gens: [
      { child: 'jr', parent: 'v', points: [[340, 290], [340, 560], [212, 620]] },
      { child: 'ru', parent: 'v', points: [[190, 1402], [190, 760]] },
      { child: 'ad', parent: 'ru', points: [[330, 1832], [205, 1520]] },
      { child: 'co', parent: 'ru', points: [[150, 2012], [178, 1520]] },
      { child: 'admin', parent: 'fc', points: [[2700, 1015], [2700, 1652]] },
      // Volunteer and Field Coordinator are registered users: routed round the outside, along the top and down the left edge
      { child: 'vo', parent: 'ru', points: [[2700, 315], [2700, 100], [50, 100], [50, 1438], [168, 1438]] },
      { child: 'fc', parent: 'ru', points: [[2718, 1688], [2960, 1688], [2960, 100], [50, 100], [50, 1438], [168, 1438]] },
    ],
  },
]

/* ------------------------------------------------------------------ main */

let sharp = null
try {
  sharp = require('sharp')
} catch {
  /* PNG export is optional */
}

;(async () => {
  for (const d of DIAGRAMS) {
    const svg = render(d)
    fs.writeFileSync(path.join(OUT, `${d.file}.svg`), svg)
    if (sharp) await sharp(Buffer.from(svg), { density: 192 }).png().toFile(path.join(OUT, `${d.file}.png`))
    console.log(`${d.file}${sharp ? ' (svg + png)' : ' (svg)'}`)
  }
})()
