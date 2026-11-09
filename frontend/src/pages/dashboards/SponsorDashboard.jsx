import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import DashboardShell, { Panel, Stat, Upcoming } from '../../components/DashboardShell'
import { Button, Pill, Spinner } from '../../components/ui'
import { LatestDrive, WorthReading } from '../../components/JournalPanels'
import { PHOTOS as FIELD, src } from '../../lib/fieldPhotos'
import { STANDARD_DRIVE } from '../../lib/sites'
import { formatDate } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { byPlot, plotSite, useAdoptions } from '../../lib/adoptions'
import { BookedTrip, FeedPanel, HealthPanel, PhotoTimeline, ReportCutting, SurveyVisits, TripsPanel } from '../../components/FeaturePanels'

/*
  Dashboard for public users. Everyone starts as a visitor; once they have paid for at least one
  mangrove (user.adopted > 0) they are an adopter and see their adoptions and plots.
  Adoptions come from the database; photo timeline, visits, trips, health and the feed read
  lib/previewData.js until those features are built.
*/

const VISITOR_NAV = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'adopt', label: 'Adopt a mangrove', glyph: 'plots', short: 'Adopt', plan: 'Choose how many mangroves to adopt and pay online. Once paid, you can follow the plot they go into.' },
  { key: 'trips', label: 'Trips', glyph: 'trips', plan: 'Browse plantation drives and Mangrove Safaris, book seats and see joining details.' },
  { key: 'learn', label: 'Learn', glyph: 'learn', plan: 'Articles and awareness pieces from the journal.' },
]

const ADOPTER_NAV = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'mangroves', label: 'My mangroves', glyph: 'plots', short: 'Mangroves', plan: 'Each plot with its coordinates and the photo timeline from every survey visit.' },
  { key: 'trips', label: 'Trips', glyph: 'trips', plan: 'Browse plantation drives and Mangrove Safaris, book seats and see joining details.' },
  { key: 'learn', label: 'Learn', glyph: 'learn', plan: 'Articles and awareness pieces from the journal.' },
]

const PRICE = STANDARD_DRIVE.saplingCost

const STATUS = { paid: ['leaf', 'Paid'], pending: ['muted', 'Waiting for payment'], refunded: ['rust', 'Refunded'] }

const joinPlots = (codes) => (codes.length <= 1 ? codes.join('') : `${codes.slice(0, -1).join(', ')} and ${codes.at(-1)}`)

export default function SponsorDashboard() {
  const { user } = useAuth()
  const adopter = user.adopted > 0
  const nav = adopter ? ADOPTER_NAV : VISITOR_NAV
  const [active, setActive] = useState('overview')
  const section = nav.find((n) => n.key === active) ?? nav[0]
  const { adoptions, error } = useAdoptions()
  const plots = adoptions ? byPlot(adoptions) : []

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
            ? plots.length
              ? `Your ${user.adopted} adopted mangroves are in ${plots.length === 1 ? 'plot' : 'plots'} ${joinPlots(plots.map((p) => p.plot))}.`
              : `You have adopted ${user.adopted} mangroves.`
            : 'You have not adopted a mangrove yet. When you do, this page follows the plot it goes into.'
      }
    >
      {section.key === 'overview' ? (
        adopter ? (
          <AdopterOverview count={user.adopted} adoptions={adoptions} plots={plots} error={error} />
        ) : (
          <VisitorOverview />
        )
      ) : (
        <Upcoming section={section} />
      )}
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

      <LatestDrive />
      <WorthReading className="xl:col-span-2" />

      <TripsPanel title="Upcoming trips" meta="Book a seat on a drive or a Mangrove Safari" bookable limit={3} className="xl:col-span-2" />
      <ReportCutting />
      <FeedPanel className="xl:col-span-3" />
    </div>
  )
}

/* ---------------------------------------------------------------- adopter */

function AdopterOverview({ count, adoptions, plots, error }) {
  const paid = adoptions?.filter((a) => a.status === 'paid') ?? []
  const spent = paid.reduce((s, a) => s + a.amount, 0)
  const first = paid.at(-1)

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="grid gap-5 sm:grid-cols-3 xl:col-span-3">
        <Stat label="Mangroves adopted" value={count} note={first ? `Since ${formatDate(first.createdAt, { month: 'long', year: 'numeric' })}` : 'Paid adoptions'} />
        <Stat label="Plots" value={adoptions ? plots.length : '...'} note={plots.length ? [...new Set(plots.map((p) => p.site))].join(', ') : 'Assigned once planted'} />
        <Stat label="Contributed" value={adoptions ? `Rs. ${spent.toLocaleString()}` : '...'} note={`Rs. ${PRICE} a mangrove`} />
      </div>

      {/* plots the mangroves went into */}
      <Panel className="xl:col-span-2" title="Where your mangroves are" meta="Each plot is photographed from its marked stakes at every survey visit.">
        {!adoptions ? (
          <div className="flex justify-center py-10 text-ink-3">
            <Spinner className="h-5 w-5" />
          </div>
        ) : null}
        <ul className="grid gap-3 sm:grid-cols-2">
          {plots.map((p, i) => (
            <motion.li
              key={p.plot}
              initial={{ clipPath: 'inset(0 0 100% 0)' }}
              animate={{ clipPath: 'inset(0 0 0% 0)' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-line bg-paper p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-paper-2 px-3 py-1 font-mono text-xs">{p.plot}</span>
                <Pill tone="leaf">Planted</Pill>
              </div>
              <p className="mt-4 font-display text-3xl leading-none">{p.quantity}</p>
              <p className="mt-1 text-sm text-muted">mangroves on {p.site}</p>
              <p className="mt-4 border-t border-line pt-3 font-mono text-[0.7rem] text-muted">Adopted {formatDate(p.since, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </motion.li>
          ))}
        </ul>
        {error ? <p className="text-sm text-rust">{error}</p> : null}
      </Panel>

      <AdoptPanel title="Adopt more mangroves" meta="They go into the next plot opening for adoption." start={10} />

      {/* every adoption, including ones still waiting for payment */}
      <Panel className="xl:col-span-2" title="Your adoptions" meta="Newest first" pad={false}>
        <div className="overflow-x-auto px-2 pb-3 sm:px-3">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left">
                {['Date', 'Mangroves', 'Plot', 'Amount', ''].map((h) => (
                  <th key={h} className="eyebrow px-3 pb-3 pt-4 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(adoptions ?? []).map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-3 py-3.5 text-ink-2">{formatDate(a.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-3 py-3.5 tabular-nums">{a.quantity}</td>
                  <td className="px-3 py-3.5">{a.plot ? `${a.plot}, ${plotSite(a.plot)}` : <span className="text-muted">Not planted yet</span>}</td>
                  <td className="px-3 py-3.5 tabular-nums">Rs. {a.amount.toLocaleString()}</td>
                  <td className="px-3 py-3.5 text-right">
                    <Pill tone={STATUS[a.status][0]}>{STATUS[a.status][1]}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <LatestDrive dark />

      <PhotoTimeline plot={plots[0]?.plot} className="xl:col-span-2" />
      <BookedTrip />
      <SurveyVisits plot={plots[0]?.plot} className="xl:col-span-2" />
      <HealthPanel plots={plots.map((p) => p.plot)} title="Health of your plots" />
      <FeedPanel className="xl:col-span-2" />
      <ReportCutting />

      <WorthReading className="xl:col-span-3" />
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
