import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import DashboardShell, { Panel, Stat, Upcoming } from '../../components/DashboardShell'
import { Avatar, Spinner } from '../../components/ui'
import { Columns } from '../../components/charts'
import ContentManager from '../../components/admin/ContentManager'
import AdoptionsManager from '../../components/admin/AdoptionsManager'
import UsersManager from '../../components/admin/UsersManager'
import { AlertsPanel, AuditPanel, HealthPanel, PlotsTable, ReportsPanel, SurveyQueue, TripsPanel } from '../../components/FeaturePanels'
import { ALERTS, PLOTS, SURVEYS, TRIPS } from '../../lib/previewData'
import { api, formatDate } from '../../lib/api'

/*
  Saltwater Marina admin. Adoptions, volunteers, users, content and the top numbers come from the
  database. Plots, surveys, trips and the monitoring panels read lib/previewData.js until they are built.
*/

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const SECTIONS = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'adoptions', label: 'Adoptions', glyph: 'portfolio', short: 'Adoptions' },
  { key: 'volunteers', label: 'Volunteers', glyph: 'people', short: 'Volunteers' },
  { key: 'users', label: 'Users and roles', glyph: 'log', short: 'Users' },
  { key: 'content', label: 'Content', glyph: 'learn' },
  { key: 'plots', label: 'Plots', glyph: 'plots', plan: 'Create, edit and map plots. Draw boundaries, set species and assign a responsible person.' },
  { key: 'trips', label: 'Trips', glyph: 'trips', plan: 'Create trips, set capacity and fees, mark attendance on the day.' },
]

// January up to this month, with 0 for months that have nothing
const thisYear = (perMonth) =>
  MONTHS.slice(0, new Date().getMonth() + 1).map((label, i) => ({ label, value: perMonth.find((m) => m.month === i + 1)?.value ?? 0 }))

export default function AdminDashboard() {
  const [active, setActive] = useState('overview')
  const [adoptionFilter, setAdoptionFilter] = useState('all')
  const [overview, setOverview] = useState(null)
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [o, r] = await Promise.all([api('GET', '/admin/overview'), api('GET', '/admin/volunteer-applications')])
      setOverview(o)
      setRequests(r.applications)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const go = (key, filter) => {
    if (filter) setAdoptionFilter(filter)
    setActive(key)
  }

  const openAlerts = ALERTS.filter((a) => a.status === 'open').length
  const counts = { volunteers: requests?.length, adoptions: overview ? overview.pendingPayments + overview.needsPlot : 0 }
  const nav = SECTIONS.map((s) => (counts[s.key] ? { ...s, count: counts[s.key] } : s))
  const section = nav.find((n) => n.key === active)
  const todo = overview && requests ? requests.length + overview.pendingPayments + overview.needsPlot + SURVEYS.length + openAlerts : null

  return (
    <DashboardShell
      nav={nav}
      active={active}
      onNavigate={(k) => go(k, k === 'adoptions' ? 'all' : null)}
      title={active === 'overview' ? undefined : section.label}
      subtitle={active !== 'overview' || todo === null ? null : todo ? `${todo} ${todo === 1 ? 'thing needs' : 'things need'} your attention.` : 'Nothing is waiting on you.'}
    >
      {error ? (
        <p role="alert" className="mb-5 rounded-2xl bg-rust-pale px-4 py-3 text-sm text-rust">
          Could not load the dashboard: {error}
        </p>
      ) : null}
      {active === 'overview' ? (
        <Overview overview={overview} requests={requests} onDecided={load} go={go} />
      ) : active === 'adoptions' ? (
        <AdoptionsManager key={adoptionFilter} start={adoptionFilter} onChanged={load} />
      ) : active === 'volunteers' ? (
        <VolunteerRequests requests={requests} onDecided={load} />
      ) : active === 'users' ? (
        <UsersManager onChanged={load} />
      ) : active === 'content' ? (
        <ContentManager />
      ) : (
        <Upcoming section={section} />
      )}
    </DashboardShell>
  )
}

function Overview({ overview, requests, onDecided, go }) {
  if (!overview || !requests) {
    return (
      <div className="flex justify-center py-20 text-ink-3">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }
  const o = overview
  const year = new Date().getFullYear()

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
      <Stat label="Mangroves adopted" value={o.adopted.toLocaleString()} note="Paid adoptions" />
      <Stat label="Raised" value={`Rs. ${o.raised.toLocaleString()}`} note="From paid adoptions" />
      <Stat label="Volunteers" value={o.volunteers} note={`${o.pendingVolunteers} asking to join`} />
      <Stat label="Accounts" value={o.users} note={`${o.newUsers} new this month`} />
      <Stat label="Active plots" value={PLOTS.length} note={`${PLOTS.reduce((n, p) => n + p.seedlings, 0).toLocaleString()} seedlings mapped`} />
      <Stat label="Surveys to check" value={SURVEYS.length} note="Stake photos waiting" tone={SURVEYS.length ? 'rust' : undefined} />
      <Stat label="Trips this month" value={TRIPS.filter((t) => t.date.slice(0, 7) === '2026-11').length} note={`${TRIPS.reduce((n, t) => n + t.booked, 0)} seats booked`} />
      <Stat label="Satellite alerts" value={ALERTS.filter((a) => a.status !== 'cleared').length} note="Open or being checked" />

      <Attention
        className="xl:col-span-2"
        items={[
          { n: requests.length, one: 'volunteer request to answer', many: 'volunteer requests to answer', action: () => go('volunteers') },
          { n: o.pendingPayments, one: 'adoption waiting for payment', many: 'adoptions waiting for payment', action: () => go('adoptions', 'pending') },
          { n: o.needsPlot, one: 'paid adoption without a plot', many: 'paid adoptions without a plot', action: () => go('adoptions', 'needs-plot') },
          { n: SURVEYS.length, one: 'survey waiting for your check', many: 'surveys waiting for your check' },
          { n: ALERTS.filter((a) => a.status === 'open').length, one: 'new satellite alert', many: 'new satellite alerts' },
          { n: o.drafts, one: 'unpublished draft in Content', many: 'unpublished drafts in Content', action: () => go('content') },
        ]}
      />

      <VolunteerRequests requests={requests} onDecided={onDecided} limit={2} onSeeAll={() => go('volunteers')} className="xl:col-span-2" />

      <Panel className="xl:col-span-2" title="Saplings planted per month" meta={`${year}, from the drive records`}>
        <Columns unit="saplings" data={thisYear(o.saplingsByMonth)} />
        <p className="mt-3 text-xs text-muted">{o.drives} {o.drives === 1 ? 'drive' : 'drives'} on record, {o.saplings.toLocaleString()} saplings in total. Edit a drive in Content to correct it.</p>
      </Panel>

      <Panel className="xl:col-span-2" title="New accounts per month" meta={`${year}, everyone who signed up`}>
        <Columns unit="accounts" data={thisYear(o.signupsByMonth)} />
        <p className="mt-3 text-xs text-muted">See and manage every account in Users and roles.</p>
      </Panel>

      <SurveyQueue className="xl:col-span-4" />
      <TripsPanel className="xl:col-span-2" />
      <AlertsPanel className="xl:col-span-2" />
      <HealthPanel className="xl:col-span-2" />
      <ReportsPanel className="xl:col-span-2" />
      <PlotsTable className="xl:col-span-4" title="Plots" />
      <AuditPanel className="xl:col-span-4" />
    </div>
  )
}

// A short to do list built from the numbers above. Each row jumps to the place to deal with it.
function Attention({ items, className = '' }) {
  const open = items.filter((i) => i.n > 0)
  return (
    <Panel className={className} title="Needs your attention" meta={open.length ? null : 'All clear.'}>
      <ul className="-mx-2">
        {items.map((i, k) => (
          <motion.li
            key={i.one}
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.5, delay: k * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={i.action}
              disabled={!i.n || !i.action}
              className="group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-paper-2 disabled:pointer-events-none"
            >
              <span className={`w-10 shrink-0 font-display text-2xl leading-none tabular-nums ${i.n ? 'text-rust' : 'text-ink-3'}`}>{i.n}</span>
              <span className={`flex-1 text-sm ${i.n ? 'text-ink' : 'text-muted'}`}>{i.n === 1 ? i.one : i.many}</span>
              {i.n && i.action ? <span className="text-ink-2 transition-transform duration-300 group-hover:translate-x-1">→</span> : null}
            </button>
          </motion.li>
        ))}
      </ul>
    </Panel>
  )
}

function VolunteerRequests({ requests, onDecided, limit, onSeeAll, className = '' }) {
  const [decided, setDecided] = useState({})
  const [error, setError] = useState('')

  const decide = async (id, decision) => {
    setError('')
    setDecided((d) => ({ ...d, [id]: decision }))
    try {
      await api('POST', `/admin/volunteer-applications/${id}/${decision}`)
      setTimeout(onDecided, 600) // let the row show the decision before it leaves
    } catch (e) {
      setDecided((d) => ({ ...d, [id]: undefined }))
      setError(e.message)
    }
  }

  const shown = limit ? requests?.slice(0, limit) : requests
  const more = limit && requests && requests.length > limit

  return (
    <Panel
      className={className}
      title="Volunteer requests"
      meta={requests ? `${requests.length} waiting` : null}
      action={
        more ? (
          <button onClick={onSeeAll} className="link-grow shrink-0 pb-0.5 text-sm font-medium text-ink">
            See all
          </button>
        ) : null
      }
    >
      {error ? <p className="mb-3 text-sm text-rust">{error}</p> : null}
      {!requests ? (
        <div className="flex justify-center py-10 text-ink-3">
          <Spinner className="h-5 w-5" />
        </div>
      ) : requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No requests waiting. New ones appear here when someone picks volunteer during profile setup.</p>
      ) : null}
      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {shown?.map((a) => {
            const verdict = decided[a.id]
            return (
              <motion.li
                key={a.id}
                layout
                exit={{ scale: 0.95, opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
                className={`overflow-hidden rounded-2xl border p-4 transition-colors ${verdict === 'approve' ? 'border-leaf bg-leaf-pale' : verdict === 'decline' ? 'border-line bg-paper-2' : 'border-line'}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={a.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="truncate text-xs text-muted">
                      {a.email} / {a.phone}
                    </p>
                    <p className="mt-2 font-mono text-[0.68rem] text-ink-2">
                      {a.area} / {a.days.join(', ')}
                      {a.boat ? ` / boat: ${a.boat}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[0.68rem] text-muted">{formatDate(a.createdAt, { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    disabled={!!verdict}
                    onClick={() => decide(a.id, 'decline')}
                    className="h-8 rounded-full px-3 text-xs text-ink-2 ring-1 ring-line hover:bg-paper-2 disabled:opacity-60"
                  >
                    {verdict === 'decline' ? 'Declined' : 'Decline'}
                  </button>
                  <button
                    disabled={!!verdict}
                    onClick={() => decide(a.id, 'approve')}
                    className="h-8 rounded-full bg-ink px-3 text-xs text-paper hover:bg-leaf disabled:opacity-60"
                  >
                    {verdict === 'approve' ? 'Approved' : 'Approve'}
                  </button>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </Panel>
  )
}
