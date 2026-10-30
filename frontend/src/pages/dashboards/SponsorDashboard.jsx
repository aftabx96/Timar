import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import DashboardShell, { Panel, Stat, Upcoming } from '../../components/DashboardShell'
import { Button, Pill } from '../../components/ui'
import { PHOTOS as FIELD, src } from '../../lib/fieldPhotos'
import { STANDARD_DRIVE } from '../../lib/sites'
import { get } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Seedling } from '../../components/illustrations'

/*
  Dashboard for public users. Everyone starts as a visitor; once they have paid for at least one
  mangrove (user.adopted > 0) they are an adopter and get the plot, photo timeline and visits.
  Current phase (FYP-I) only: no model readings, no cutting reports.
*/

const VISITOR_NAV = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'adopt', label: 'Adopt a mangrove', glyph: 'plots', short: 'Adopt', plan: 'Choose how many mangroves to adopt and pay online. Once paid, you can follow the plot they go into.' },
  { key: 'trips', label: 'Trips', glyph: 'trips', plan: 'Browse plantation drives and Mangrove Safaris, book seats and see joining details.' },
  { key: 'learn', label: 'Learn', glyph: 'learn', plan: 'Articles and awareness pieces from the journal.' },
]

const ADOPTER_NAV = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'mangroves', label: 'My mangroves', glyph: 'plots', short: 'Mangroves', plan: 'Every adoption with its plot, coordinates and full photo timeline.' },
  { key: 'trips', label: 'Trips', glyph: 'trips', plan: 'Browse plantation drives and Mangrove Safaris, book seats and see joining details.' },
  { key: 'learn', label: 'Learn', glyph: 'learn', plan: 'Articles and awareness pieces from the journal.' },
]

// one photo per survey visit, always from stake 3
const TIMELINE = [
  { stage: 0, date: '14 Apr 2026', label: 'Planting day', note: '1,200 planted' },
  { stage: 1, date: '16 May 2026', label: 'Month 1', note: 'photos checked' },
  { stage: 2, date: '18 Jul 2026', label: 'Month 3', note: 'photos checked' },
  { stage: 3, date: '12 Oct 2026', label: 'Month 6', note: 'photos checked' },
]

const VISITS = [
  { when: '14 Apr 2026', what: 'Planted', done: true },
  { when: '16 May 2026', what: 'Month 1 survey', done: true },
  { when: '18 Jul 2026', what: 'Month 3 survey', done: true },
  { when: '12 Oct 2026', what: 'Month 6 survey', done: true },
  { when: 'Apr 2027', what: 'Month 12 survey', done: false },
]

const PRICE = STANDARD_DRIVE.saplingCost

export default function SponsorDashboard() {
  const { user } = useAuth()
  const adopter = user.adopted > 0
  const nav = adopter ? ADOPTER_NAV : VISITOR_NAV
  const [active, setActive] = useState('overview')
  const section = nav.find((n) => n.key === active) ?? nav[0]

  return (
    <DashboardShell
      nav={nav}
      active={section.key}
      onNavigate={setActive}
      title={section.key === 'overview' ? undefined : section.label}
      subtitle={
        section.key !== 'overview'
          ? null
          : adopter
            ? `Your ${user.adopted} adopted mangroves are in plot KD-014 on the north shore of Kaderu Island.`
            : 'You have not adopted a mangrove yet. When you do, this page follows the plot it goes into.'
      }
    >
      {section.key === 'overview' ? adopter ? <AdopterOverview count={user.adopted} /> : <VisitorOverview /> : <Upcoming section={section} />}
    </DashboardShell>
  )
}

/* ---------------------------------------------------------------- visitor */

function VisitorOverview() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <section className="relative overflow-hidden rounded-[22px] bg-ink text-paper xl:col-span-2">
        <div className="grid md:grid-cols-[1fr_1.1fr]">
          <img src={src(FIELD.propagules, 800)} alt={FIELD.propagules.alt} className="h-56 w-full object-cover md:h-full" style={{ objectPosition: FIELD.propagules.focus }} />
          <div className="p-6 sm:p-7">
            <p className="font-display text-[2rem] leading-tight">Adopt your first mangrove</p>
            <p className="mt-3 text-paper/80">
              Each one is raised in the Rehri Goth nursery and planted on a Saltwater Marina drive. Once you adopt, you get the plot it went into and a
              photo from the same stake at every survey visit.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-paper/85">
              {[`Rs. ${PRICE} a mangrove`, 'Plot and coordinates', 'Photo timeline from every visit'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf-2" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <AdoptPanel title="Choose how many" meta="They go into the next plot opening for adoption." start={5} />

      <UpcomingDrive />
      <WorthReading className="xl:col-span-2" />
    </div>
  )
}

/* ---------------------------------------------------------------- adopter */

function AdopterOverview({ count }) {
  const [open, setOpen] = useState(null)
  const [requested, setRequested] = useState(false)

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {/* plot card */}
      <Panel className="xl:col-span-2" pad={false}>
        <div className="grid md:grid-cols-[1fr_1.1fr]">
          <div className="relative overflow-hidden rounded-t-[22px] bg-tide-pale md:rounded-l-[22px] md:rounded-tr-none">
            <PlotMini />
            <span className="absolute left-4 top-4 rounded-full bg-paper px-3 py-1 font-mono text-xs">KD-014</span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Kaderu Island, north shore</p>
                <p className="mt-1 font-display text-2xl">Avicennia marina</p>
                <p className="mt-1 font-mono text-xs text-muted">24.7811°N, 67.2409°E</p>
              </div>
              <Pill tone="leaf">Photos checked</Pill>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted">Yours</dt>
                <dd className="font-medium">{count} mangroves</dd>
              </div>
              <div>
                <dt className="text-muted">In the plot</dt>
                <dd className="font-medium">1,200</dd>
              </div>
              <div>
                <dt className="text-muted">Planted</dt>
                <dd className="font-medium">14 Apr 2026</dd>
              </div>
              <div>
                <dt className="text-muted">Last survey</dt>
                <dd className="font-medium">12 Oct 2026</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-line pt-5">
              <AnimatePresence mode="wait" initial={false}>
                {requested ? (
                  <motion.div key="done" initial={{ y: 8, clipPath: 'inset(0 0 100% 0)' }} animate={{ y: 0, clipPath: 'inset(0 0 0% 0)' }} className="flex items-center gap-3 rounded-xl bg-leaf-pale px-4 py-3 text-sm text-leaf">
                    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0">
                      <motion.path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.15 }} />
                    </svg>
                    Added to the next field visit on Sat 7 Nov. We will email you when the photo is up.
                  </motion.div>
                ) : (
                  <motion.div key="ask" exit={{ y: -8, clipPath: 'inset(100% 0 0 0)' }} className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-ink-2">Want to see it now? Ask the next survey team for a fresh photo.</p>
                    <Button size="sm" onClick={() => setRequested(true)}>
                      Request a photo
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Panel>

      <BookedTrip />

      {/* photo timeline with shared element zoom */}
      <Panel className="xl:col-span-2" title="Photo timeline" meta="Taken from stake 3 at every visit, so you are always looking at the same patch.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TIMELINE.map((p, i) => (
            <motion.button key={p.date} layoutId={`photo-${i}`} onClick={() => setOpen(i)} className="group overflow-hidden rounded-2xl border border-line bg-paper text-left">
              <div className="aspect-[4/3] overflow-hidden">
                <motion.div layoutId={`photo-img-${i}`} className="h-full w-full transition-transform duration-700 ease-[var(--ease-tide)] group-hover:scale-105">
                  <Seedling stage={p.stage} className="h-full w-full" />
                </motion.div>
              </div>
              <div className="px-3 py-2.5">
                <p className="font-mono text-[0.68rem] text-muted">{p.date}</p>
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
                    <p className="font-mono text-xs text-muted">KD-014 / stake 3 / {TIMELINE[open].date}</p>
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

      <AdoptPanel title="Adopt more mangroves" meta="They go into the next plot opening for adoption." start={10} />

      {/* survey visits: when the plot was checked, and when it is next due */}
      <Panel className="xl:col-span-2" title="Survey visits to KD-014" meta="A volunteer photographs the plot from its stakes and a coordinator checks the photos.">
        <ol className="relative ml-1.5 space-y-4 border-l border-line pl-6">
          {VISITS.map((v) => (
            <li key={v.what} className="relative">
              <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-paper ${v.done ? 'bg-leaf' : 'border-2 border-ink-3 bg-paper'}`} />
              <p className="font-mono text-xs text-muted">{v.when}</p>
              <p className={`text-sm font-medium ${v.done ? '' : 'text-ink-2'}`}>
                {v.what}
                {v.done ? '' : ', due'}
              </p>
            </li>
          ))}
        </ol>
      </Panel>

      <WorthReading />

      <div className="grid gap-5 sm:grid-cols-3 xl:col-span-3">
        <Stat label="Mangroves adopted" value={count} note="One adoption, April 2026" />
        <Stat label="Last survey" value="12 Oct" note="Next due April 2027" />
        <Stat label="Trips taken" value="1" note="Next one on 14 Nov" />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- shared */

function AdoptPanel({ title, meta, start }) {
  const [qty, setQty] = useState(start)
  const [asked, setAsked] = useState(false)
  return (
    <Panel title={title} meta={meta}>
      <div className="flex items-center justify-between rounded-2xl bg-paper-2 p-2">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-12 rounded-xl bg-paper text-xl transition-transform active:scale-90" aria-label="Fewer">
          −
        </button>
        <div className="text-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={qty} initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: -16, opacity: 0 }} className="font-display text-4xl tabular-nums">
              {qty}
            </motion.p>
          </AnimatePresence>
          <p className="text-xs text-muted">{qty === 1 ? 'mangrove' : 'mangroves'}</p>
        </div>
        <button onClick={() => setQty((q) => Math.min(500, q + 1))} className="h-12 w-12 rounded-xl bg-paper text-xl transition-transform active:scale-90" aria-label="More">
          +
        </button>
      </div>
      <div className="mt-5 flex items-baseline justify-between text-sm">
        <span className="text-muted">Rs. {PRICE} each</span>
        <span className="font-display text-2xl">Rs. {(qty * PRICE).toLocaleString()}</span>
      </div>
      <Button className="mt-5 w-full" arrow onClick={() => setAsked(true)}>
        Continue to payment
      </Button>
      {asked ? <p className="mt-3 text-xs leading-relaxed text-muted">Online payment is not switched on in this prototype yet.</p> : null}
    </Panel>
  )
}

function UpcomingDrive() {
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-paper-2">
      <img src={src(FIELD.bow, 800)} alt={FIELD.bow.alt} className="h-32 w-full object-cover" style={{ objectPosition: FIELD.bow.focus }} />
      <div className="p-6">
        <p className="eyebrow">Next drive</p>
        <p className="mt-2 font-display text-2xl leading-tight">Plantation drive, Kaderu Island</p>
        <p className="mt-2 text-sm text-ink-2">Sat 14 Nov, boat leaves Rehri Goth jetty at 07:00.</p>
        <p className="mt-1 text-sm text-ink-2">PKR {STANDARD_DRIVE.pricePerHead.toLocaleString()} per person.</p>
      </div>
    </div>
  )
}

function BookedTrip() {
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-ink text-paper">
      <img src={src(FIELD.bow, 800)} alt={FIELD.bow.alt} className="h-32 w-full object-cover" style={{ objectPosition: FIELD.bow.focus }} />
      <div className="p-6">
        <p className="eyebrow !text-paper/70">Your next trip</p>
        <p className="mt-3 font-display text-2xl leading-tight">Plantation drive, Kaderu Island</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          {[
            ['Date', 'Sat 14 Nov'],
            ['Boat leaves', '07:00'],
            ['From', 'Rehri Goth jetty'],
            ['Seats', '2 booked'],
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
          <p className="font-mono text-lg tracking-wider">TRB-2611-048</p>
        </div>
        <Barcode />
      </div>
    </div>
  )
}

// Real articles from the journal, newest first.
function WorthReading({ className = '' }) {
  const [articles, setArticles] = useState(null)
  useEffect(() => {
    get('/articles')
      .then((d) => setArticles(d.articles.slice(0, 3)))
      .catch(() => setArticles([]))
  }, [])
  return (
    <Panel
      className={className}
      title="Worth reading"
      action={
        <Link to="/journal" className="link-grow shrink-0 pb-0.5 text-sm font-medium text-ink">
          All articles
        </Link>
      }
    >
      {articles && articles.length === 0 ? <p className="text-sm text-muted">Nothing published yet.</p> : null}
      <ul className="-my-3 divide-y divide-line">
        {(articles ?? []).map((a) => (
          <li key={a.id}>
            <Link to={`/journal/${a.slug}`} className="group flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-sm font-medium group-hover:underline">{a.title}</span>
                <span className="font-mono text-xs text-muted">{a.minutes} min read</span>
              </span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function PlotMini() {
  // the adopted mangroves sit in one corner of the plot
  const dots = Array.from({ length: 60 }, (_, i) => ({ x: 40 + (i % 10) * 22 + (Math.floor(i / 10) % 2) * 11, y: 60 + Math.floor(i / 10) * 24, mine: i % 10 < 5 && i < 50 && Math.floor(i / 10) < 5 }))
  return (
    <svg viewBox="0 0 300 240" className="block h-full min-h-[220px] w-full" aria-label="Plot KD-014 with your mangroves highlighted" role="img">
      <path d="M0 0 H300 V36 C240 50 180 26 120 40 C70 52 30 34 0 46 Z" fill="var(--color-paper-3)" />
      <motion.path
        d="M28 52 L262 40 L276 196 L36 212 Z"
        fill="var(--color-paper)"
        stroke="var(--color-leaf)"
        strokeWidth="2"
        strokeDasharray="6 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.mine ? 4.5 : 3}
          fill={d.mine ? 'var(--color-leaf)' : 'var(--color-ink-3)'}
          fillOpacity={d.mine ? 1 : 0.3}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 + i * 0.012, type: 'spring', stiffness: 400, damping: 18 }}
        />
      ))}
      <g transform="translate(36 222)">
        <circle r="4.5" fill="var(--color-leaf)" />
        <text x="10" y="4" fontSize="11" fill="var(--color-ink)">
          Your mangroves
        </text>
      </g>
    </svg>
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
