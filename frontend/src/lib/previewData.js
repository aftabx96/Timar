/*
  Sample data for features that are not built yet: plots, surveys, trips and bookings, field tasks,
  hours (FYP-I) and plant health, satellite alerts, cutting reports, community feed, impact
  reports and the audit log (FYP-II).

  Nothing here is in the database. When a feature is built, replace its export with an API call
  and delete it from this file.
*/

/* ---------- plots ---------- */

export const PLOTS = [
  { code: 'KD-014', site: 'Kaderu Island', where: 'north shore', species: 'Avicennia marina', planted: '2026-04-14', seedlings: 1200, lastSurvey: '2026-10-12', status: 'checked', lat: 24.7811, lng: 67.2409 },
  { code: 'KD-021', site: 'Kaderu Island', where: 'east channel', species: 'Avicennia marina', planted: '2026-03-02', seedlings: 800, lastSurvey: '2026-10-03', status: 'checked', lat: 24.7764, lng: 67.2468 },
  { code: 'KD-027', site: 'Kaderu Island', where: 'inner bend', species: 'Avicennia marina', planted: '2026-10-03', seedlings: 1000, lastSurvey: null, status: 'new', lat: 24.7742, lng: 67.2391 },
  { code: 'KD-031', site: 'Kaderu Island', where: 'south creek', species: 'Rhizophora mucronata', planted: '2025-11-20', seedlings: 5000, lastSurvey: '2026-09-20', status: 'checked', lat: 24.7719, lng: 67.2433 },
  { code: 'BU-003', site: 'Buddo Island', where: 'west shore', species: 'Avicennia marina', planted: '2026-01-15', seedlings: 4000, lastSurvey: '2026-10-06', status: 'review', lat: 24.733, lng: 67.205 },
  { code: 'KR-009', site: 'Kairi Creek', where: 'creek mouth', species: 'Avicennia marina', planted: '2025-12-08', seedlings: 2500, lastSurvey: '2026-09-28', status: 'flagged', lat: null, lng: null },
]

export const plotByCode = (code) => PLOTS.find((p) => p.code === code)

/* ---------- surveys (photo surveys from the marked stakes) ---------- */

export const SURVEYS = [
  { id: 'SV-3391', plot: 'KD-021', by: 'Hira Khan', when: '2026-10-03', photos: 4, notes: [] },
  { id: 'SV-3394', plot: 'KR-009', by: 'Bilal Hussain', when: '2026-09-28', photos: 4, notes: ['Browsing by camels'] },
  { id: 'SV-3398', plot: 'BU-003', by: 'Usman Ali', when: '2026-10-06', photos: 3, notes: [] },
  { id: 'SV-3401', plot: 'KD-031', by: 'Mariam Shah', when: '2026-09-20', photos: 4, notes: ['Washed out patch'] },
]

// one photo per survey visit of the adopter's plot, always from stake 3
export const TIMELINE = [
  { stage: 0, date: '2026-04-14', label: 'Planting day', note: '1,200 planted' },
  { stage: 1, date: '2026-05-16', label: 'Month 1', note: 'photos checked' },
  { stage: 2, date: '2026-07-18', label: 'Month 3', note: 'photos checked' },
  { stage: 3, date: '2026-10-12', label: 'Month 6', note: 'photos checked' },
]

export const VISITS = [
  { when: '2026-04-14', what: 'Planted', done: true },
  { when: '2026-05-16', what: 'Month 1 survey', done: true },
  { when: '2026-07-18', what: 'Month 3 survey', done: true },
  { when: '2026-10-12', what: 'Month 6 survey', done: true },
  { when: '2027-04-14', what: 'Month 12 survey', done: false },
]

/* ---------- trips and bookings ---------- */

export const TRIPS = [
  { id: 'TR-2611', name: 'Plantation drive, Kaderu Island', kind: 'drive', date: '2026-11-14', leaves: '07:00', booked: 38, cap: 40, price: 2000 },
  { id: 'TR-2612', name: 'Mangrove Safari, Buddo Island', kind: 'safari', date: '2026-11-15', leaves: '08:30', booked: 12, cap: 25, price: 2000 },
  { id: 'TR-2613', name: 'Company drive, Kaderu Island', kind: 'drive', date: '2026-11-21', leaves: '07:00', booked: 30, cap: 30, price: 2000 },
  { id: 'TR-2614', name: 'School visit, Rehri Goth creeks', kind: 'visit', date: '2026-11-26', leaves: '09:00', booked: 18, cap: 35, price: 1000 },
  { id: 'TR-2615', name: 'Plantation drive, Kaderu Island', kind: 'drive', date: '2026-12-05', leaves: '07:00', booked: 9, cap: 40, price: 2000 },
]

// the adopter's booking on the first trip
export const MY_BOOKING = { trip: 'TR-2611', code: 'TRB-2611-048', seats: 2, from: 'Rehri Goth jetty' }

// the company's staff drives
export const STAFF_DRIVES = [
  { trip: 'TR-2613', seats: 30, status: 'confirmed', amount: 60000 },
  { trip: 'TR-2504', name: 'Company drive, Buddo Island', date: '2026-04-11', seats: 24, status: 'done', amount: 48000 },
]

/* ---------- volunteer field work ---------- */

export const TASKS = [
  {
    id: 'FT-1102',
    plot: 'KD-021',
    what: 'Month 6 photo survey',
    when: '2026-11-07',
    time: '07:30',
    status: 'assigned',
    notes: ['Photograph all four stakes, facing the marked direction', 'Note any browsed, cut or washed out patches', 'An adopter asked for a fresh photo of the north corner'],
  },
  {
    id: 'FT-1108',
    plot: 'KD-027',
    what: 'Month 1 check on new plot',
    when: '2026-11-15',
    time: '08:00',
    status: 'assigned',
    notes: ['Look for propagules washed out by the last spring tide', 'Photo from stake 1'],
  },
  { id: 'FT-1093', plot: 'KD-014', what: 'Month 6 photo survey', when: '2026-10-12', status: 'verified', notes: ['Coordinator checked and approved your 4 stake photos on 13 Oct.'] },
  { id: 'FT-1087', plot: 'KR-009', what: 'Photo check after the heat spell', when: '2026-09-28', status: 'submitted', notes: ['Waiting on coordinator review'] },
]

export const HOURS = [
  { label: 'Jul', value: 6 },
  { label: 'Aug', value: 4 },
  { label: 'Sep', value: 12 },
  { label: 'Oct', value: 16 },
  { label: 'Nov', value: 8 },
]

export const VOLUNTEER_STATS = { hours: 46, plots: 6, surveys: 11, approved: 9, drives: 4 }

/* ---------- FYP-II: plant health from photos ---------- */

// share of the stake photos read as healthy, stressed or dead, per plot
export const HEALTH = [
  { plot: 'KD-014', healthy: 82, stressed: 13, dead: 5, cover: 34, change: +6, checked: '2026-10-12' },
  { plot: 'KD-021', healthy: 76, stressed: 18, dead: 6, cover: 27, change: +4, checked: '2026-10-03' },
  { plot: 'BU-003', healthy: 64, stressed: 24, dead: 12, cover: 22, change: -3, checked: '2026-10-06' },
  { plot: 'KR-009', healthy: 51, stressed: 29, dead: 20, cover: 15, change: -9, checked: '2026-09-28' },
]

export const healthOf = (code) => HEALTH.find((h) => h.plot === code)

/* ---------- FYP-II: satellite change detection ---------- */

export const ALERTS = [
  { id: 'SAT-118', where: 'Kaderu Island, south creek', plot: 'KD-031', change: -4.2, area: 0.6, seen: '2026-10-29', status: 'open' },
  { id: 'SAT-117', where: 'Kairi Creek, creek mouth', plot: 'KR-009', change: -7.8, area: 1.1, seen: '2026-10-22', status: 'checking' },
  { id: 'SAT-114', where: 'Buddo Island, north tip', plot: null, change: -2.1, area: 0.3, seen: '2026-10-08', status: 'cleared' },
]

/* ---------- FYP-II: cutting reports and threat map ---------- */

export const REPORTS = [
  { id: 'CR-0042', where: 'Kairi Creek, near the old jetty', what: 'Fresh cut stems, about 20 trees', by: 'Fisherman, by WhatsApp', when: '2026-11-01', status: 'sent to Forest Department' },
  { id: 'CR-0041', where: 'Buddo Island, west shore', what: 'Camels grazing inside plot BU-003', by: 'Volunteer', when: '2026-10-25', status: 'checked' },
  { id: 'CR-0039', where: 'Rehri Goth, east creek', what: 'Plastic and nets dumped on the flat', by: 'Visitor', when: '2026-10-14', status: 'cleared' },
]

/* ---------- FYP-II: community feed ---------- */

export const FEED = [
  { who: 'Saltwater Marina', when: '2026-11-02', text: 'The 14 Nov drive is almost full. Two seats left on the first boat.' },
  { who: 'Hira Khan', when: '2026-10-30', text: 'Month 6 photos for KD-014 are up. The pencil roots are coming through around stake 3.' },
  { who: 'Usman Ali', when: '2026-10-24', text: 'Spotted a pair of herons on the Buddo flats this morning.' },
]

/* ---------- FYP-II: company impact report ---------- */

// rough figures for the company's mangroves; the real report will use survey and satellite data
export const IMPACT = { surviving: 0.81, carbonTonnesPerYear: 84, coverHectares: 2.4, reportMonth: 'October 2026' }

/* ---------- FYP-II: audit log ---------- */

export const AUDIT = [
  { when: '2026-11-03T16:40:00', who: 'Rafay Ahmed', what: 'Approved volunteer request from Bilal Hussain' },
  { when: '2026-11-03T15:12:00', who: 'Rafay Ahmed', what: 'Published drive "Planting on Kaderu Island"' },
  { when: '2026-11-02T11:05:00', who: 'Hira Khan', what: 'Submitted survey SV-3391 for KD-021' },
  { when: '2026-11-01T09:30:00', who: 'System', what: 'Satellite check found 1 new change on Kaderu Island' },
  { when: '2026-10-31T18:22:00', who: 'Rafay Ahmed', what: 'Marked adoption of 1,000 mangroves as paid' },
]
