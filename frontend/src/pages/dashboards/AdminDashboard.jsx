import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import DashboardShell, { Panel, Stat, TextButton, Upcoming } from '../../components/DashboardShell'
import { Avatar, Button, Pill } from '../../components/ui'
import { Columns } from '../../components/charts'
import ContentManager from '../../components/admin/ContentManager'

const NAV = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'plots', label: 'Plots', glyph: 'plots', plan: 'Create, edit and map plots. Draw boundaries, set species and assign a responsible person.' },
  { key: 'volunteers', label: 'Volunteers', glyph: 'people', short: 'People', count: 3, plan: 'Applications, approved volunteers, task assignment by area and hours.' },
  { key: 'trips', label: 'Trips', glyph: 'trips', plan: 'Create trips, set capacity and fees, mark attendance on the day.' },
  { key: 'content', label: 'Content', glyph: 'learn', plan: 'Write and publish articles and species guide entries.' },
]

const SURVEYS = [
  // each survey is a set of stake photos plus what the volunteer noticed on the plot
  { id: 'SV-3391', plot: 'KD-021', by: 'Hira Khan', when: '3 Oct', photos: 4, notes: [] },
  { id: 'SV-3394', plot: 'KR-009', by: 'Bilal Hussain', when: '28 Sep', photos: 4, notes: ['Browsing by camels'] },
  { id: 'SV-3398', plot: 'BU-003', by: 'Usman Ali', when: '6 Oct', photos: 3, notes: [] },
  { id: 'SV-3401', plot: 'KD-031', by: 'Mariam Shah', when: '20 Sep', photos: 4, notes: ['Washed out patch'] },
]

const APPLICANTS = [
  { name: 'Zainab Qureshi', area: 'Ibrahim Hyderi', days: 'Sat, Sun', boat: 'Yes', note: 'Marine science student, KU' },
  { name: 'Hamza Baig', area: 'Kaderu Island', days: 'Fri, Sat', boat: 'A few times', note: 'Has done two drives with WWF' },
  { name: 'Areeba Noor', area: 'Buddo Island', days: 'Sun', boat: 'No', note: 'Photographer, can help with stake photos' },
]

const TRIPS = [
  { name: 'Plantation drive, Kaderu Island', date: 'Sat 14 Nov', booked: 38, cap: 40 },
  { name: 'Eco tour, Buddo Island, west shores', date: 'Sun 15 Nov', booked: 12, cap: 25 },
  { name: 'Company drive, Kaderu Island', date: 'Sat 21 Nov', booked: 30, cap: 30 },
  { name: 'School visit, Rehri Goth creeks', date: 'Thu 26 Nov', booked: 18, cap: 35 },
]

export default function AdminDashboard() {
  const [active, setActive] = useState('overview')
  const section = NAV.find((n) => n.key === active)
  return (
    <DashboardShell
      nav={NAV}
      active={active}
      onNavigate={setActive}
      title={active === 'overview' ? undefined : section.label}
      subtitle={active === 'overview' ? 'Four surveys wait for your check and three people have asked to volunteer.' : null}
      actions={
        <Button size="sm" className="hidden sm:inline-flex" arrow>
          New plot
        </Button>
      }
    >
      {active === 'overview' ? <Overview /> : active === 'content' ? <ContentManager /> : <Upcoming section={section} />}
    </DashboardShell>
  )
}

function Overview() {
  const [surveys, setSurveys] = useState(SURVEYS)
  const [applicants, setApplicants] = useState(APPLICANTS)
  const [decided, setDecided] = useState({})

  const decide = (list, setList, key, verdict) => {
    setDecided((d) => ({ ...d, [key]: verdict }))
    setTimeout(() => setList(list.filter((x) => (x.id || x.name) !== key)), 650)
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
      <Stat label="Active plots" value="42" note="38 hectares mapped" />
      <Stat label="Waiting your check" value={surveys.length} note="Surveys to verify" />
      <Stat label="Volunteers" value="15" note="Out most days, 3 asking to join" />
      <Stat label="Booked this month" value="98" note="Seats across 4 trips" />

      {/* verification queue */}
      <Panel className="xl:col-span-4" title="Survey verification" meta="Look through each survey's stake photos before they go out to the people who adopted the plot.">
        {surveys.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center text-sm text-muted">
            Queue is clear. Nice.
          </motion.p>
        ) : null}
        <ul className="-mx-2">
          <AnimatePresence initial={false}>
            {surveys.map((s) => {
              const flag = s.photos < 4 || s.notes.length > 0
              const verdict = decided[s.id]
              return (
                <motion.li
                  key={s.id}
                  layout
                  exit={{ x: verdict === 'ok' ? 60 : -60, opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className={`grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors sm:grid-cols-[5rem_1fr_12rem_auto] ${verdict === 'ok' ? 'bg-leaf-pale' : verdict === 'no' ? 'bg-rust-pale' : 'hover:bg-paper-2'}`}>
                    <span className="hidden font-mono text-xs text-muted sm:block">{s.plot}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span className="font-mono text-xs text-muted sm:hidden">{s.plot} / </span>
                        {s.by}
                      </p>
                      <p className="text-xs text-muted">
                        {s.id}, {s.when}
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
                      <button
                        onClick={() => decide(surveys, setSurveys, s.id, 'no')}
                        disabled={!!verdict}
                        className="h-9 rounded-full px-3.5 text-sm text-ink-2 ring-1 ring-line transition-colors hover:bg-rust hover:text-paper hover:ring-rust"
                      >
                        Return
                      </button>
                      <button
                        onClick={() => decide(surveys, setSurveys, s.id, 'ok')}
                        disabled={!!verdict}
                        className="h-9 rounded-full bg-ink px-3.5 text-sm text-paper transition-colors hover:bg-leaf"
                      >
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

      {/* volunteer applications */}
      <Panel className="xl:col-span-2" title="Volunteer requests" meta={`${applicants.length} waiting`} action={<TextButton>See all</TextButton>}>
        {applicants.length === 0 ? <p className="py-8 text-center text-sm text-muted">No requests waiting.</p> : null}
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {applicants.map((a) => {
              const verdict = decided[a.name]
              return (
                <motion.li
                  key={a.name}
                  layout
                  exit={{ scale: 0.95, opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`overflow-hidden rounded-2xl border p-4 transition-colors ${verdict === 'ok' ? 'border-leaf bg-leaf-pale' : verdict === 'no' ? 'border-line bg-paper-2' : 'border-line'}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={a.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted">{a.note}</p>
                      <p className="mt-2 font-mono text-[0.68rem] text-ink-2">
                        {a.area} / {a.days} / boat: {a.boat}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button disabled={!!verdict} onClick={() => decide(applicants, setApplicants, a.name, 'no')} className="h-8 rounded-full px-3 text-xs text-ink-2 ring-1 ring-line hover:bg-paper-2">
                      Decline
                    </button>
                    <button disabled={!!verdict} onClick={() => decide(applicants, setApplicants, a.name, 'ok')} className="h-8 rounded-full bg-ink px-3 text-xs text-paper hover:bg-leaf">
                      {verdict === 'ok' ? 'Approved' : 'Approve'}
                    </button>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </Panel>

      {/* trips */}
      <Panel className="xl:col-span-2" title="Trips this month" action={<TextButton>Manage</TextButton>}>
        <ul className="space-y-4">
          {TRIPS.map((t, i) => {
            const full = t.booked >= t.cap
            return (
              <li key={t.name}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="truncate">
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{t.date}</span>
                  </span>
                  <span className={`shrink-0 tabular-nums ${full ? 'text-rust' : 'text-ink-2'}`}>
                    {t.booked}/{t.cap}
                    {full ? ' full' : ''}
                  </span>
                </div>
                <div className="mt-2 flex gap-[2px]">
                  {Array.from({ length: t.cap }, (_, k) => (
                    <motion.span
                      key={k}
                      className={`h-3 flex-1 rounded-[2px] ${k < t.booked ? (full ? 'bg-rust' : 'bg-ink-2') : 'bg-paper-3'}`}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.08 + k * 0.008 }}
                    />
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel className="xl:col-span-4" title="Seedlings planted per month" meta="2026">
        <Columns
          unit="seedlings"
          data={[
            { label: 'Jan', value: 6200 },
            { label: 'Feb', value: 4800 },
            { label: 'Mar', value: 3900 },
            { label: 'Apr', value: 2600 },
            { label: 'May', value: 400 },
            { label: 'Jun', value: 0 },
            { label: 'Jul', value: 0 },
            { label: 'Aug', value: 900 },
            { label: 'Sep', value: 2100 },
            { label: 'Oct', value: 4300 },
          ]}
        />
        <p className="mt-3 text-xs text-muted">Nothing goes in during the monsoon months, when the creeks are too rough for boats.</p>
      </Panel>

    </div>
  )
}
