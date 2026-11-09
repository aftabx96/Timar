import { useState } from 'react'
import { motion } from 'motion/react'
import DashboardShell, { Panel, Stat, Upcoming } from '../../components/DashboardShell'
import { Button, CountUp, Pill, Spinner } from '../../components/ui'
import { SALTWATER_MARINA, STANDARD_DRIVE } from '../../lib/sites'
import { PHOTOS, src } from '../../lib/fieldPhotos'
import { formatDate } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { byPlot, useAdoptions } from '../../lib/adoptions'
import { HealthPanel, ImpactPanel, PlotsTable } from '../../components/FeaturePanels'
import { STAFF_DRIVES, TRIPS } from '../../lib/previewData'

/*
  Company dashboard: the mangroves the company adopted and the plots they went into come from the
  adoptions table. Survey status, plant health, staff drives and the impact report read
  lib/previewData.js until those features are built.
*/

const NAV = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'plots', label: 'Plots', glyph: 'portfolio', plan: 'Each plot your company adopted, with its location and the photo timeline from every survey visit.' },
  { key: 'trips', label: 'Staff drives', glyph: 'trips', short: 'Drives', plan: 'Book a plantation drive for your team, priced per person.' },
]

const monthYear = (iso) => formatDate(iso, { month: 'long', year: 'numeric' })

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [active, setActive] = useState('overview')
  const section = NAV.find((n) => n.key === active)
  const company = user.profile?.company || 'Your company'
  const { adoptions, error } = useAdoptions()

  return (
    <DashboardShell
      nav={NAV}
      active={active}
      onNavigate={setActive}
      title={active === 'overview' ? company : section.label}
      subtitle={active === 'overview' ? 'The mangroves your company adopted and the plots they went into.' : null}
    >
      {active === 'overview' ? (
        <Overview adoptions={adoptions} error={error} />
      ) : (
        <Upcoming section={section} />
      )}
    </DashboardShell>
  )
}

function Overview({ adoptions, error }) {
  if (!adoptions) {
    return (
      <div className="flex justify-center py-20 text-ink-3">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  const plots = byPlot(adoptions)
  const total = plots.reduce((s, p) => s + p.quantity, 0)
  const spent = plots.reduce((s, p) => s + p.amount, 0)
  const sites = new Set(plots.map((p) => p.site)).size
  const dates = plots.map((p) => p.since).sort()
  const latest = adoptions.find((a) => a.status === 'paid')

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
      {error ? <p className="text-sm text-rust xl:col-span-4">{error}</p> : null}
      <div className="rounded-[22px] bg-ink p-6 text-paper xl:col-span-2">
        <p className="text-sm text-paper/75">Mangroves adopted by your company</p>
        <p className="mt-3 font-display text-6xl leading-none">
          <CountUp to={total} />
        </p>
        <p className="mt-3 text-sm text-paper/75">
          {plots.length
            ? `Planted across ${plots.length} ${plots.length === 1 ? 'plot' : 'plots'} on ${sites} ${sites === 1 ? 'site' : 'sites'}, ${dates.length > 1 ? `from ${monthYear(dates[0])} to ${monthYear(dates.at(-1))}` : `in ${monthYear(dates[0])}`}.`
            : 'Nothing adopted yet. Adoptions appear here once they are paid.'}
        </p>
        {/* one segment per plot, sized by how many it holds */}
        <div className="mt-6 flex h-2.5 gap-1">
          {plots.map((p, i) => (
            <motion.div
              key={p.plot}
              title={`${p.plot}: ${p.quantity.toLocaleString()}`}
              className="h-full rounded-full bg-leaf-2"
              style={{ flexGrow: p.quantity, transformOrigin: 'left' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </div>
      </div>
      <Stat label="Plots" value={plots.length} note={[...new Set(plots.map((p) => p.site))].join(', ') || 'None yet'} />
      <Stat label="Contributed" value={`Rs. ${spent.toLocaleString()}`} note={latest ? `Last adoption ${formatDate(latest.createdAt, { day: 'numeric', month: 'short' })}` : 'Paid adoptions'} />

      <Panel className="xl:col-span-4" title="Your plots" meta="Paid adoptions, grouped by the plot they were planted in" pad={false}>
        <div className="overflow-x-auto px-2 pb-3 sm:px-3">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left">
                {['Plot', 'Location', 'Adopted', 'Mangroves', 'Amount', ''].map((h) => (
                  <th key={h} className="eyebrow px-3 pb-3 pt-4 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plots.map((p) => (
                <tr key={p.plot} className="border-t border-line transition-colors hover:bg-paper-2">
                  <td className="whitespace-nowrap px-3 py-3.5 font-mono text-xs">{p.plot}</td>
                  <td className="px-3 py-3.5">{p.site}</td>
                  <td className="px-3 py-3.5 text-ink-2">{monthYear(p.since)}</td>
                  <td className="px-3 py-3.5 tabular-nums">{p.quantity.toLocaleString()}</td>
                  <td className="px-3 py-3.5 tabular-nums">Rs. {p.amount.toLocaleString()}</td>
                  <td className="px-3 py-3.5 text-right">
                    <Pill tone="leaf">Planted</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* staff drive */}
      <section className="overflow-hidden rounded-[22px] bg-paper-2 xl:col-span-2">
        <div className="grid sm:grid-cols-[1fr_1.2fr]">
          <img src={src(PHOTOS.team, 800)} alt={PHOTOS.team.alt} className="h-48 w-full object-cover sm:h-full" style={{ objectPosition: PHOTOS.team.focus }} />
          <div className="p-6">
            <p className="font-display text-2xl leading-tight">Bring your team on a drive</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              A {STANDARD_DRIVE.hours} hour morning on Kaderu Island: boat from Rehri Goth, planting, lunch on the island.
            </p>
            <p className="mt-3 font-display text-xl">PKR {STANDARD_DRIVE.pricePerHead.toLocaleString()} per person</p>
            <Button as="a" href={`mailto:${SALTWATER_MARINA.email}?subject=Staff%20plantation%20drive`} size="sm" className="mt-4" arrow>
              Ask for a date
            </Button>
          </div>
        </div>
      </section>

      <ImpactPanel total={total} className="xl:col-span-2" />
      <HealthPanel plots={plots.map((p) => p.plot)} title="Health of your plots" className="xl:col-span-2" />
      <PlotsTable codes={plots.map((p) => p.plot)} title="Survey status of your plots" className="xl:col-span-4" />
      <StaffDrives className="xl:col-span-2" />

      <Panel className="xl:col-span-2" title="How your plots are followed">
        <ol className="space-y-3 text-sm text-ink-2">
          {[
            'Each plot has marked stakes at its corners.',
            'At 1, 3, 6 and 12 months a volunteer photographs the plot from every stake.',
            'A Saltwater Marina coordinator checks the photos before they appear here.',
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}

// The company's staff drives, booked and past.
function StaffDrives({ className = '' }) {
  const rows = STAFF_DRIVES.map((b) => ({ ...TRIPS.find((t) => t.id === b.trip), ...b }))
  return (
    <Panel className={className} title="Your staff drives">
      <ul className="divide-y divide-line">
        {rows.map((d) => (
          <li key={d.trip} className="flex items-center justify-between gap-4 py-3.5">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{d.name}</span>
              <span className="font-mono text-xs text-muted">
                {formatDate(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} / {d.seats} people / Rs. {d.amount.toLocaleString()}
              </span>
            </span>
            <Pill tone={d.status === 'confirmed' ? 'tide' : 'leaf'}>{d.status === 'confirmed' ? 'Booked' : 'Done'}</Pill>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
