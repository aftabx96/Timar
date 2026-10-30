import { useState } from 'react'
import { motion } from 'motion/react'
import DashboardShell, { Panel, Stat, Upcoming } from '../../components/DashboardShell'
import { Button, CountUp, Pill } from '../../components/ui'
import { STANDARD_DRIVE } from '../../lib/sites'
import { PHOTOS, src } from '../../lib/fieldPhotos'
import { useAuth } from '../../lib/auth'

/*
  Company dashboard for the current phase (FYP-I): mangroves adopted in bulk, the plots they went into,
  when each was last surveyed, and staff drives. Carbon figures and detailed impact reports belong to
  the company portfolio work in FYP-II and are left out until then.
*/

const NAV = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'plots', label: 'Plots', glyph: 'portfolio', plan: 'Each plot your company adopted, with its location and the photo timeline from every survey visit.' },
  { key: 'trips', label: 'Staff drives', glyph: 'trips', short: 'Drives', plan: 'Book a plantation drive for your team, priced per person.' },
]

const PLOTS = [
  { id: 'KD-014', where: 'Kaderu Island, north shore', planted: 'Apr 2026', seedlings: 1200, last: '12 Oct 2026', status: 'checked' },
  { id: 'KD-021', where: 'Kaderu Island, east channel', planted: 'Mar 2026', seedlings: 800, last: '3 Oct 2026', status: 'checked' },
  { id: 'BU-003', where: 'Buddo Island, west shore', planted: 'Jan 2026', seedlings: 4000, last: '6 Oct 2026', status: 'review' },
  { id: 'KD-031', where: 'Kaderu Island, south creek', planted: 'Nov 2025', seedlings: 5000, last: '20 Sep 2026', status: 'checked' },
  { id: 'KD-027', where: 'Kaderu Island, inner bend', planted: 'Oct 2026', seedlings: 1000, last: 'First survey due Nov', status: 'new' },
]

const STATUS = {
  checked: ['leaf', 'Photos checked'],
  review: ['muted', 'Survey in review'],
  new: ['tide', 'Newly planted'],
}

export default function CompanyDashboard() {
  const { user } = useAuth()
  const [active, setActive] = useState('overview')
  const section = NAV.find((n) => n.key === active)
  const company = user.profile?.company || 'Your company'

  return (
    <DashboardShell
      nav={NAV}
      active={active}
      onNavigate={setActive}
      title={active === 'overview' ? company : section.label}
      subtitle={active === 'overview' ? 'The mangroves your company adopted, the plots they went into, and when each was last surveyed.' : null}
    >
      {active === 'overview' ? <Overview /> : <Upcoming section={section} />}
    </DashboardShell>
  )
}

function Overview() {
  const total = PLOTS.reduce((s, p) => s + p.seedlings, 0)
  const sites = new Set(PLOTS.map((p) => p.where.split(',')[0])).size

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
      <div className="rounded-[22px] bg-ink p-6 text-paper xl:col-span-2">
        <p className="text-sm text-paper/75">Mangroves adopted by your company</p>
        <p className="mt-3 font-display text-6xl leading-none">
          <CountUp to={total} />
        </p>
        <p className="mt-3 text-sm text-paper/75">
          Planted across {PLOTS.length} plots on {sites} {sites === 1 ? 'island' : 'islands'}, from November 2025 to October 2026.
        </p>
        {/* one segment per plot, sized by how many it holds */}
        <div className="mt-6 flex h-2.5 gap-1">
          {PLOTS.map((p, i) => (
            <motion.div
              key={p.id}
              className={`h-full rounded-full ${p.status === 'new' ? 'bg-tide' : 'bg-leaf-2'}`}
              style={{ flexGrow: p.seedlings, transformOrigin: 'left' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </div>
      </div>
      <Stat label="Plots" value={PLOTS.length} note="4 surveyed, 1 newly planted" />
      <Stat label="Last survey" value="12 Oct" note="KD-014, stake photos checked" />

      <Panel className="xl:col-span-4" title="Your plots" pad={false}>
        <div className="overflow-x-auto px-2 pb-3 sm:px-3">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left">
                {['Plot', 'Location', 'Planted', 'Mangroves', 'Last survey', ''].map((h) => (
                  <th key={h} className="eyebrow px-3 pb-3 pt-4 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLOTS.map((p) => (
                <tr key={p.id} className="border-t border-line transition-colors hover:bg-paper-2">
                  <td className="whitespace-nowrap px-3 py-3.5 font-mono text-xs">{p.id}</td>
                  <td className="px-3 py-3.5">{p.where}</td>
                  <td className="px-3 py-3.5 text-ink-2">{p.planted}</td>
                  <td className="px-3 py-3.5 tabular-nums">{p.seedlings.toLocaleString()}</td>
                  <td className="px-3 py-3.5 text-ink-2">{p.last}</td>
                  <td className="px-3 py-3.5 text-right">
                    <Pill tone={STATUS[p.status][0]}>{STATUS[p.status][1]}</Pill>
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
            <Button size="sm" className="mt-4" arrow>
              Ask for a date
            </Button>
          </div>
        </div>
      </section>

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
