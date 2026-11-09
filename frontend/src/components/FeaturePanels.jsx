import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Panel } from './DashboardShell'
import { Button, Pill } from './ui'
import { Columns } from './charts'
import { Seedling } from './illustrations'
import { formatDate } from '../lib/api'
import { AUDIT, ALERTS, FEED, HEALTH, HOURS, IMPACT, MY_BOOKING, PLOTS, REPORTS, SURVEYS, TASKS, TIMELINE, TRIPS, VISITS, plotByCode } from '../lib/previewData'

/*
  Dashboard panels for the features that are not in the database yet. They read lib/previewData.js.
  Each one keeps its own on screen state (verify, book, report) without saving anything.
*/

const ease = [0.22, 1, 0.36, 1]
const day = (iso) => formatDate(iso, { day: 'numeric', month: 'short' })
const dayYear = (iso) => formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' })
const weekday = (iso) => formatDate(iso, { weekday: 'short', day: 'numeric', month: 'short' })

const PLOT_STATUS = {
  checked: ['leaf', 'Photos checked'],
  review: ['muted', 'Survey in review'],
  new: ['tide', 'Newly planted'],
  flagged: ['rust', 'Needs a look'],
}

/* ---------------------------------------------------------------- plots */

export function PlotsTable({ codes, className = '', title = 'Plots', meta }) {
  const plots = codes ? PLOTS.filter((p) => codes.includes(p.code)) : PLOTS
  return (
    <Panel className={className} title={title} meta={meta ?? `${plots.length} plots, ${plots.reduce((s, p) => s + p.seedlings, 0).toLocaleString()} seedlings`} pad={false}>
      <div className="overflow-x-auto px-2 pb-3 sm:px-3">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="text-left">
              {['Plot', 'Location', 'Species', 'Planted', 'Seedlings', 'Last survey', ''].map((h) => (
                <th key={h} className="eyebrow px-3 pb-3 pt-4 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plots.map((p) => (
              <tr key={p.code} className="border-t border-line transition-colors hover:bg-paper-2">
                <td className="whitespace-nowrap px-3 py-3.5 font-mono text-xs">{p.code}</td>
                <td className="px-3 py-3.5">
                  {p.site}, {p.where}
                </td>
                <td className="px-3 py-3.5 italic text-ink-2">{p.species}</td>
                <td className="px-3 py-3.5 text-ink-2">{dayYear(p.planted)}</td>
                <td className="px-3 py-3.5 tabular-nums">{p.seedlings.toLocaleString()}</td>
                <td className="px-3 py-3.5 text-ink-2">{p.lastSurvey ? dayYear(p.lastSurvey) : 'First due soon'}</td>
                <td className="px-3 py-3.5 text-right">
                  <Pill tone={PLOT_STATUS[p.status][0]}>{PLOT_STATUS[p.status][1]}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/* ---------------------------------------------------- survey verification */

export function SurveyQueue({ className = '' }) {
  const [surveys, setSurveys] = useState(SURVEYS)
  const [decided, setDecided] = useState({})
  const decide = (id, verdict) => {
    setDecided((d) => ({ ...d, [id]: verdict }))
    setTimeout(() => setSurveys((list) => list.filter((s) => s.id !== id)), 650)
  }
  return (
    <Panel className={className} title="Survey verification" meta="Look through each survey's stake photos before they go out to the people who adopted the plot.">
      {surveys.length === 0 ? <p className="py-10 text-center text-sm text-muted">Queue is clear.</p> : null}
      <ul className="-mx-2">
        <AnimatePresence initial={false}>
          {surveys.map((s) => {
            const flag = s.photos < 4 || s.notes.length > 0
            const verdict = decided[s.id]
            return (
              <motion.li key={s.id} layout exit={{ x: verdict === 'ok' ? 60 : -60, opacity: 0, height: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
                <div className={`grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors sm:grid-cols-[5rem_1fr_12rem_auto] ${verdict === 'ok' ? 'bg-leaf-pale' : verdict === 'no' ? 'bg-rust-pale' : 'hover:bg-paper-2'}`}>
                  <span className="hidden font-mono text-xs text-muted sm:block">{s.plot}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      <span className="font-mono text-xs text-muted sm:hidden">{s.plot} / </span>
                      {s.by}
                    </p>
                    <p className="text-xs text-muted">
                      {s.id}, {day(s.when)}
                    </p>
                  </div>
                  <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                    <p className="text-sm tabular-nums">
                      {s.photos} of 4 <span className="text-muted">stake photos</span>
                    </p>
                    <p className={`text-xs ${flag ? 'text-rust' : 'text-muted'}`}>
                      {s.photos < 4 ? 'A stake photo is missing' : s.notes.length ? `Noted: ${s.notes.join(', ')}` : 'Nothing unusual noted'}
                    </p>
                  </div>
                  <div className="col-start-2 row-start-1 flex gap-2 sm:col-start-auto sm:row-start-auto">
                    <button onClick={() => decide(s.id, 'no')} disabled={!!verdict} className="h-9 rounded-full px-3.5 text-sm text-ink-2 ring-1 ring-line transition-colors hover:bg-rust hover:text-paper hover:ring-rust">
                      Return
                    </button>
                    <button onClick={() => decide(s.id, 'ok')} disabled={!!verdict} className="h-9 rounded-full bg-ink px-3.5 text-sm text-paper transition-colors hover:bg-leaf">
                      Verify
                    </button>
                  </div>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </Panel>
  )
}

/* ---------------------------------------------------------------- trips */

// Seat bars for staff, or a book button for visitors and adopters.
export function TripsPanel({ title = 'Upcoming trips', meta, bookable = false, limit, className = '' }) {
  const [asked, setAsked] = useState({})
  const trips = limit ? TRIPS.slice(0, limit) : TRIPS
  return (
    <Panel className={className} title={title} meta={meta}>
      <ul className="space-y-5">
        {trips.map((t, i) => {
          const full = t.booked >= t.cap
          const left = t.cap - t.booked
          return (
            <li key={t.id}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{t.name}</span>
                  <span className="font-mono text-xs text-muted">
                    {weekday(t.date)}, boat {t.leaves} / PKR {t.price.toLocaleString()} a person
                  </span>
                </span>
                {bookable ? (
                  <button
                    disabled={full || asked[t.id]}
                    onClick={() => setAsked((a) => ({ ...a, [t.id]: true }))}
                    className="h-8 shrink-0 rounded-full bg-ink px-3.5 text-xs text-paper transition-colors hover:bg-leaf disabled:bg-paper-3 disabled:text-ink-2"
                  >
                    {full ? 'Full' : asked[t.id] ? 'Seat held' : 'Book'}
                  </button>
                ) : (
                  <span className={`shrink-0 tabular-nums ${full ? 'text-rust' : 'text-ink-2'}`}>
                    {t.booked}/{t.cap}
                    {full ? ' full' : ''}
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-[2px]">
                {Array.from({ length: t.cap }, (_, k) => (
                  <motion.span
                    key={k}
                    className={`h-2.5 flex-1 rounded-[2px] ${k < t.booked ? (full ? 'bg-rust' : 'bg-ink-2') : 'bg-paper-3'}`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.08 + k * 0.008 }}
                  />
                ))}
              </div>
              {bookable && !full ? <p className="mt-1 text-xs text-muted">{left} {left === 1 ? 'seat' : 'seats'} left</p> : null}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

export function BookedTrip({ className = '' }) {
  const t = TRIPS.find((x) => x.id === MY_BOOKING.trip)
  return (
    <div className={`relative overflow-hidden rounded-[22px] bg-ink text-paper ${className}`}>
      <div className="p-6">
        <p className="eyebrow !text-paper/70">Your next trip</p>
        <p className="mt-3 font-display text-2xl leading-tight">{t.name}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          {[
            ['Date', weekday(t.date)],
            ['Boat leaves', t.leaves],
            ['From', MY_BOOKING.from],
            ['Seats', `${MY_BOOKING.seats} booked`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-paper/70">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="relative flex items-center">
        <span className="absolute -left-3 h-6 w-6 rounded-full bg-paper" />
        <span className="mx-6 flex-1 border-t-2 border-dashed border-paper/25" />
        <span className="absolute -right-3 h-6 w-6 rounded-full bg-paper" />
      </div>
      <div className="flex items-center justify-between p-6">
        <div>
          <p className="font-mono text-xs text-paper/70">Booking</p>
          <p className="font-mono text-lg tracking-wider">{MY_BOOKING.code}</p>
        </div>
        <Barcode />
      </div>
    </div>
  )
}

function Barcode() {
  const bars = [2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1]
  let x = 0
  return (
    <svg viewBox="0 0 64 36" className="h-9 w-16" aria-hidden="true">
      {bars.map((w, i) => {
        const el = i % 2 === 0 ? <rect key={i} x={x} width={w * 1.4} height="36" fill="var(--color-paper)" /> : null
        x += w * 1.4 + 0.6
        return el
      })}
    </svg>
  )
}

/* ------------------------------------------------- photo timeline, visits */

export function PhotoTimeline({ plot = 'KD-014', className = '' }) {
  const [open, setOpen] = useState(null)
  return (
    <Panel className={className} title={`Photo timeline, ${plot}`} meta="Taken from stake 3 at every visit, so you are always looking at the same patch.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TIMELINE.map((p, i) => (
          <motion.button key={p.date} layoutId={`photo-${i}`} onClick={() => setOpen(i)} className="group overflow-hidden rounded-2xl border border-line bg-paper text-left">
            <div className="aspect-[4/3] overflow-hidden">
              <motion.div layoutId={`photo-img-${i}`} className="h-full w-full transition-transform duration-700 ease-[var(--ease-tide)] group-hover:scale-105">
                <Seedling stage={p.stage} className="h-full w-full" />
              </motion.div>
            </div>
            <div className="px-3 py-2.5">
              <p className="font-mono text-[0.68rem] text-muted">{dayYear(p.date)}</p>
              <p className="text-sm font-medium">{p.label}</p>
            </div>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {open !== null ? (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-ink/60" onClick={() => setOpen(null)} aria-label="Close photo" />
            <motion.div layoutId={`photo-${open}`} className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-paper">
              <motion.div layoutId={`photo-img-${open}`} className="aspect-[4/3]">
                <Seedling stage={TIMELINE[open].stage} className="h-full w-full" />
              </motion.div>
              <div className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="font-mono text-xs text-muted">
                    {plot} / stake 3 / {dayYear(TIMELINE[open].date)}
                  </p>
                  <p className="font-display text-xl">
                    {TIMELINE[open].label}: {TIMELINE[open].note}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button disabled={open === 0} onClick={() => setOpen(open - 1)} className="h-10 w-10 rounded-full ring-1 ring-line disabled:opacity-30" aria-label="Previous">
                    ←
                  </button>
                  <button disabled={open === TIMELINE.length - 1} onClick={() => setOpen(open + 1)} className="h-10 w-10 rounded-full ring-1 ring-line disabled:opacity-30" aria-label="Next">
                    →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Panel>
  )
}

export function SurveyVisits({ plot = 'KD-014', className = '' }) {
  const [requested, setRequested] = useState(false)
  return (
    <Panel className={className} title={`Survey visits to ${plot}`} meta="A volunteer photographs the plot from its stakes and a coordinator checks the photos.">
      <ol className="relative ml-1.5 space-y-4 border-l border-line pl-6">
        {VISITS.map((v) => (
          <li key={v.what} className="relative">
            <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-paper ${v.done ? 'bg-leaf' : 'border-2 border-ink-3 bg-paper'}`} />
            <p className="font-mono text-xs text-muted">{dayYear(v.when)}</p>
            <p className={`text-sm font-medium ${v.done ? '' : 'text-ink-2'}`}>
              {v.what}
              {v.done ? '' : ', due'}
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-5 border-t border-line pt-4">
        <AnimatePresence mode="wait" initial={false}>
          {requested ? (
            <motion.p key="done" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} className="rounded-xl bg-leaf-pale px-4 py-3 text-sm text-leaf">
              Added to the next field visit on Sat 7 Nov. We will email you when the photo is up.
            </motion.p>
          ) : (
            <motion.div key="ask" exit={{ clipPath: 'inset(100% 0 0 0)' }} className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-2">Want to see it now? Ask the next survey team for a fresh photo.</p>
              <Button size="sm" onClick={() => setRequested(true)}>
                Request a photo
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------- plant health (FYP-II) */

export function HealthPanel({ plots, className = '', title = 'Plant health from photos' }) {
  const rows = plots ? HEALTH.filter((h) => plots.includes(h.plot)) : HEALTH
  return (
    <Panel className={className} title={title} meta="Each stake photo is read for healthy, stressed and dead plants, and for green cover.">
      <ul className="space-y-5">
        {rows.map((h, i) => (
          <li key={h.plot}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                <span className="font-mono text-xs">{h.plot}</span>
                <span className="ml-2 text-muted">checked {day(h.checked)}</span>
              </span>
              <span className="tabular-nums">
                {h.cover}% cover{' '}
                <span className={h.change >= 0 ? 'text-leaf' : 'text-rust'}>
                  {h.change >= 0 ? '+' : ''}
                  {h.change}
                </span>
              </span>
            </div>
            <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-paper-3">
              {[
                [h.healthy, 'bg-leaf'],
                [h.stressed, 'bg-[#c9a227]'],
                [h.dead, 'bg-rust'],
              ].map(([v, c], k) => (
                <motion.span key={k} className={`h-full ${c}`} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8, delay: i * 0.1 + k * 0.08, ease }} />
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-leaf" /> Healthy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#c9a227]" /> Stressed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rust" /> Dead
        </span>
        <span>Cover change since the last visit, in points</span>
      </p>
    </Panel>
  )
}

/* ------------------------------------------ satellite alerts (FYP-II) */

const ALERT_STATUS = { open: ['rust', 'New'], checking: ['tide', 'Being checked'], cleared: ['muted', 'Cleared'] }

export function AlertsPanel({ className = '', title = 'Satellite change alerts', forField = false }) {
  const [taken, setTaken] = useState({})
  const alerts = forField ? ALERTS.filter((a) => a.status !== 'cleared') : ALERTS
  return (
    <Panel className={className} title={title} meta={forField ? 'Places the satellite check flagged. Look at them on your next visit nearby.' : 'Sentinel-2 images compared every 5 days. A drop in green cover raises an alert.'}>
      <ul className="divide-y divide-line">
        {alerts.map((a) => (
          <li key={a.id} className="flex items-center gap-4 py-3.5">
            <span className={`font-display text-xl tabular-nums ${a.change < 0 ? 'text-rust' : 'text-leaf'}`}>{a.change}%</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{a.where}</span>
              <span className="font-mono text-xs text-muted">
                {a.id} / {a.area} ha / seen {day(a.seen)}
              </span>
            </span>
            {forField ? (
              <button
                onClick={() => setTaken((t) => ({ ...t, [a.id]: true }))}
                disabled={taken[a.id]}
                className="h-8 shrink-0 rounded-full px-3 text-xs ring-1 ring-line transition-colors hover:bg-ink hover:text-paper disabled:bg-leaf-pale disabled:text-leaf disabled:ring-leaf-pale"
              >
                {taken[a.id] ? 'On my list' : 'I will check'}
              </button>
            ) : (
              <Pill tone={ALERT_STATUS[a.status][0]}>{ALERT_STATUS[a.status][1]}</Pill>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ------------------------------------- cutting reports (FYP-II) */

export function ReportsPanel({ className = '' }) {
  return (
    <Panel className={className} title="Cutting and damage reports" meta="From the public form, WhatsApp and volunteers. Serious ones go to the Sindh Forest Department.">
      <ul className="divide-y divide-line">
        {REPORTS.map((r) => (
          <li key={r.id} className="py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">{r.what}</p>
              <span className="shrink-0 font-mono text-xs text-muted">{day(r.when)}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {r.where} / {r.by}
            </p>
            <p className={`mt-1 text-xs font-medium ${r.status === 'cleared' ? 'text-muted' : r.status === 'checked' ? 'text-tide' : 'text-rust'}`}>{r.status}</p>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

const PLACES = ['Rehri Goth creeks', 'Kaderu Island', 'Buddo Island', 'Kairi Creek', 'Ibrahim Hyderi', 'Somewhere else']
const WHAT = ['Trees being cut', 'Animals grazing', 'Rubbish dumped', 'Land being filled']

export function ReportCutting({ className = '' }) {
  const [place, setPlace] = useState('')
  const [what, setWhat] = useState('')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    setSent(true)
  }
  return (
    <Panel className={className} title="Report cutting or damage" meta="Seen mangroves being cut or damaged? Tell Saltwater Marina. You can stay anonymous.">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div key="sent" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} className="rounded-2xl bg-leaf-pale p-5 text-sm text-leaf">
            <p className="font-medium">Thank you. Your report is CR-0043.</p>
            <p className="mt-1 text-leaf/80">A coordinator will look at it. Serious cutting is passed on to the Sindh Forest Department.</p>
            <button
              onClick={() => {
                setSent(false)
                setPlace('')
                setWhat('')
                setNote('')
              }}
              className="link-grow mt-3 pb-0.5 text-sm font-medium"
            >
              Report something else
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" exit={{ clipPath: 'inset(100% 0 0 0)' }} onSubmit={submit} className="space-y-4">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What did you see">
              {WHAT.map((w) => (
                <button
                  type="button"
                  key={w}
                  role="radio"
                  aria-checked={what === w}
                  onClick={() => setWhat(w)}
                  className={`rounded-full px-3 py-1.5 text-xs ring-1 ring-inset transition-colors ${what === w ? 'bg-rust text-paper ring-rust' : 'text-ink-2 ring-line hover:ring-ink/50'}`}
                >
                  {w}
                </button>
              ))}
            </div>
            <select value={place} onChange={(e) => setPlace(e.target.value)} aria-label="Where" className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-ink">
              <option value="">Where was it?</option>
              {PLACES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything that helps us find it (optional)"
              className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
            />
            <Button type="submit" size="sm" disabled={!place || !what}>
              Send report
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </Panel>
  )
}

/* ------------------------------------------ community feed (FYP-II) */

export function FeedPanel({ className = '' }) {
  const [posts, setPosts] = useState(FEED)
  const [text, setText] = useState('')
  const post = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setPosts((p) => [{ who: 'You', when: new Date().toISOString(), text: text.trim() }, ...p])
    setText('')
  }
  return (
    <Panel className={className} title="From the community">
      <form onSubmit={post} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share something from the creeks"
          aria-label="Write a post"
          className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-ink"
        />
        <button disabled={!text.trim()} className="h-10 rounded-full bg-ink px-4 text-sm text-paper transition-colors hover:bg-leaf disabled:opacity-40">
          Post
        </button>
      </form>
      <ul className="mt-4 divide-y divide-line">
        <AnimatePresence initial={false}>
          {posts.map((p) => (
            <motion.li key={p.when + p.who} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden py-3">
              <p className="text-sm">
                <span className="font-medium">{p.who}</span> <span className="font-mono text-xs text-muted">{day(p.when)}</span>
              </p>
              <p className="mt-0.5 text-sm text-ink-2">{p.text}</p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Panel>
  )
}

/* --------------------------------------------------- audit log (FYP-II) */

export function AuditPanel({ className = '' }) {
  return (
    <Panel className={className} title="Recent activity" meta="Every change to accounts, plots and content is logged.">
      <ul className="space-y-3">
        {AUDIT.map((a) => (
          <li key={a.when} className="grid grid-cols-[4.5rem_1fr] gap-3 text-sm">
            <span className="font-mono text-xs leading-5 text-muted">
              {day(a.when)}
              <br />
              {a.when.slice(11, 16)}
            </span>
            <span>
              <span className="font-medium">{a.who}</span> <span className="text-ink-2">{a.what.charAt(0).toLowerCase() + a.what.slice(1)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/* ---------------------------------------------------- volunteer field work */

const TASK_STATUS = { assigned: ['tide', 'Assigned'], submitted: ['muted', 'Waiting review'], verified: ['leaf', 'Verified'] }

export function TaskList({ className = '', only }) {
  const tasks = only ? TASKS.filter((t) => only.includes(t.status)) : TASKS
  const [openTask, setOpenTask] = useState(tasks[0]?.id)
  return (
    <Panel className={className} title="Your tasks" meta="Tap a task for the brief">
      <ul className="-mx-2 space-y-1">
        {tasks.map((t) => {
          const open = openTask === t.id
          const plot = plotByCode(t.plot)
          const [tone, label] = TASK_STATUS[t.status]
          return (
            <motion.li layout key={t.id} className={`rounded-2xl transition-colors ${open ? 'bg-paper-2' : 'hover:bg-paper-2/60'}`}>
              <button onClick={() => setOpenTask(open ? null : t.id)} className="flex w-full items-center gap-4 px-3 py-3.5 text-left" aria-expanded={open}>
                <span className="w-16 shrink-0 font-mono text-xs text-muted">{t.plot}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t.what}</span>
                  <span className="block truncate text-xs text-muted">
                    {weekday(t.when)}
                    {t.time ? `, ${t.time}` : ''} / {plot ? `${plot.site}, ${plot.where}` : ''}
                  </span>
                </span>
                <span className="hidden sm:block">
                  <Pill tone={tone}>{label}</Pill>
                </span>
                <motion.span animate={{ rotate: open ? 45 : 0 }} className="text-lg leading-none text-ink-2">
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
                    <div className="px-3 pb-4 pl-[5.75rem]">
                      <ul className="space-y-1.5 text-sm text-ink-2">
                        {t.notes.map((n) => (
                          <li key={n} className="flex gap-2">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                            {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.li>
          )
        })}
      </ul>
    </Panel>
  )
}

export function NextTask({ className = '' }) {
  const t = TASKS[0]
  const plot = plotByCode(t.plot)
  const days = Math.max(0, Math.round((new Date(`${t.when}T00:00:00`) - new Date(new Date().toDateString())) / 86_400_000))
  return (
    <div className={`rounded-[22px] bg-paper-2 p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Next field task</p>
          <p className="mt-2 font-display text-2xl leading-tight">Survey {t.plot}</p>
          <p className="mt-1 text-sm text-ink-2">
            {t.what}, {plot.site} {plot.where}
          </p>
        </div>
        <div className="rounded-2xl bg-paper px-4 py-3 text-right">
          <p className="font-display text-3xl leading-none">{days}</p>
          <p className="mt-1 text-xs text-muted">{days === 1 ? 'day' : 'days'} to go</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
        {[
          ['Meet', 'Rehri Goth jetty'],
          ['Time', `${weekday(t.when)}, ${t.time}`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-muted">{k}</dt>
            <dd className="mt-0.5 font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function HoursPanel({ className = '' }) {
  return (
    <Panel className={className} title="Hours by month" meta="2026 season">
      <Columns unit="hours" data={HOURS} />
    </Panel>
  )
}

/* ------------------------------------------ company impact (FYP-II) */

export function ImpactPanel({ total, className = '' }) {
  const [asked, setAsked] = useState(false)
  const surviving = Math.round(total * IMPACT.surviving)
  return (
    <Panel className={className} title="Impact report" meta={`Latest estimate, ${IMPACT.reportMonth}`}>
      <dl className="grid grid-cols-3 gap-4">
        {[
          [surviving.toLocaleString(), 'mangroves surviving', `${Math.round(IMPACT.surviving * 100)}% of those planted`],
          [`${IMPACT.carbonTonnesPerYear} t`, 'carbon a year', 'once the trees mature'],
          [`${IMPACT.coverHectares} ha`, 'green cover', 'from satellite images'],
        ].map(([v, label, sub]) => (
          <div key={label}>
            <dd className="font-display text-3xl leading-none">{v}</dd>
            <dt className="mt-2 text-sm">{label}</dt>
            <dd className="text-xs text-muted">{sub}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm text-ink-2">A PDF with every plot, its photos and the figures above, for your CSR report.</p>
        <Button size="sm" onClick={() => setAsked(true)} disabled={asked}>
          {asked ? 'Report requested' : 'Download report'}
        </Button>
      </div>
    </Panel>
  )
}
