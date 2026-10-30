import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import DashboardShell, { Panel, Stat, Upcoming } from '../../components/DashboardShell'
import { Button, Pill } from '../../components/ui'
import { Columns } from '../../components/charts'
import { PHOTOS, src } from '../../lib/fieldPhotos'
import { useAuth } from '../../lib/auth'

const NAV = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'tasks', label: 'Field tasks', glyph: 'tasks', short: 'Tasks', count: 3, plan: 'All assigned visits by area, with plot boundaries, stake positions and photo requests from sponsors.' },
  { key: 'surveys', label: 'My surveys', glyph: 'photos', short: 'Surveys', plan: 'Every survey you submitted, its verification status and the coordinator notes.' },
  { key: 'trips', label: 'Trips', glyph: 'trips', plan: 'Plantation drives you can join as crew.' },
  { key: 'hours', label: 'Hours', glyph: 'hours', plan: 'A full record of your hours and plots, which you can download as a certificate.' },
]

const TASKS = [
  {
    id: 'FT-1102',
    plot: 'KD-021',
    what: 'Month 6 photo survey',
    when: 'Sat 7 Nov, 07:30',
    where: 'Kaderu Island, east channel',
    status: 'assigned',
    notes: ['Photograph all four stakes, facing the marked direction', 'Note any browsed, cut or washed out patches', 'An adopter asked for a fresh photo of the north corner'],
  },
  {
    id: 'FT-1108',
    plot: 'KD-027',
    what: 'Month 1 check on new plot',
    when: 'Sun 15 Nov, 08:00',
    where: 'Kaderu Island, inner bend',
    status: 'assigned',
    notes: ['Look for propagules washed out by the last spring tide', 'Photo from stake 1'],
  },
  {
    id: 'FT-1093',
    plot: 'KD-014',
    what: 'Month 6 photo survey',
    when: 'Mon 12 Oct',
    where: 'Kaderu Island, north shore',
    status: 'verified',
    notes: ['Coordinator checked and approved your 4 stake photos on 13 Oct.'],
  },
  {
    id: 'FT-1087',
    plot: 'KR-009',
    what: 'Photo check after the heat spell',
    when: 'Mon 28 Sep',
    where: 'Kairi Creek',
    status: 'submitted',
    notes: ['Waiting on coordinator review'],
  },
]

const statusTone = { assigned: ['tide', 'Assigned'], submitted: ['muted', 'Waiting review'], verified: ['leaf', 'Verified'] }


export default function VolunteerDashboard() {
  const { user } = useAuth()
  const [active, setActive] = useState('overview')
  const section = NAV.find((n) => n.key === active)
  const pending = user.volunteerStatus === 'pending'
  return (
    <DashboardShell
      nav={NAV}
      active={active}
      onNavigate={setActive}
      title={active === 'overview' ? undefined : section.label}
      subtitle={
        active !== 'overview'
          ? null
          : pending
            ? 'Your volunteer request is with Saltwater Marina. Once approved, your real tasks replace the examples below.'
            : 'Two visits coming up. The next one is a photo survey on Kaderu Island this Saturday.'
      }
    >
      {active === 'overview' ? <Overview /> : <Upcoming section={section} />}
    </DashboardShell>
  )
}

function Overview() {
  const [openTask, setOpenTask] = useState(TASKS[0].id)
  const [checks, setChecks] = useState([true, false, false, false])
  const checklist = ['Phone charged, location on', 'Gloves and boots', 'Water, 2 litres', 'Stake map for KD-021']

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {/* next task */}
      <section className="relative overflow-hidden rounded-[22px] bg-ink p-6 text-paper sm:p-7 xl:col-span-2">
        <img
          src={src(PHOTOS.wadingBank, 800)}
          alt={PHOTOS.wadingBank.alt}
          className="-mx-6 -mt-6 mb-6 h-36 w-[calc(100%+3rem)] max-w-none object-cover sm:-mx-7 sm:-mt-7 sm:w-[calc(100%+3.5rem)]"
          style={{ objectPosition: '50% 35%' }}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow !text-paper/70">Next field task</p>
            <p className="mt-3 font-display text-[2rem] leading-tight">Survey KD-021</p>
            <p className="mt-1 text-paper/75">Month 6 photos on the east channel of Kaderu Island</p>
          </div>
          <div className="rounded-2xl bg-paper/10 px-4 py-3 text-right">
            <p className="font-display text-3xl leading-none">9</p>
            <p className="mt-1 text-xs text-paper/65">days to go</p>
          </div>
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-5 border-t border-paper/15 pt-5 text-sm sm:grid-cols-4">
          {[
            ['Meet', 'Rehri Goth jetty'],
            ['Time', 'Sat 7 Nov, 07:30'],
            ['Plot', 'KD-021, east channel'],
            ['Team', 'You and 3 others'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-paper/70">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {checklist.map((c, i) => (
            <button
              key={c}
              onClick={() => setChecks((s) => s.map((x, j) => (j === i ? !x : x)))}
              className="flex items-center gap-3 rounded-xl bg-paper/[0.06] px-4 py-3 text-left text-sm transition-colors hover:bg-paper/10"
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${checks[i] ? 'border-leaf-2 bg-leaf-2' : 'border-paper/40'}`}>
                <svg viewBox="0 0 12 12" className="h-3 w-3">
                  <motion.path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="var(--color-ink)" strokeWidth="2" fill="none" strokeLinecap="round" initial={false} animate={{ pathLength: checks[i] ? 1 : 0 }} />
                </svg>
              </span>
              <span className={checks[i] ? 'text-paper/60 line-through' : ''}>{c}</span>
            </button>
          ))}
        </div>
      </section>

      <StakeChecklist />

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 xl:col-span-3">
        <Stat label="Hours this season" value="46" note="Since 1 Jul 2026" />
        <Stat label="Plots worked" value="6" note="Kaderu and Buddo" />
        <Stat label="Surveys submitted" value="11" note="9 approved so far" />
        <Stat label="Drives joined" value="4" note="Last one on 3 Oct" />
      </div>

      {/* tasks */}
      <Panel className="xl:col-span-2" title="Your tasks" meta="Tap a task for the brief">
        <ul className="-mx-2 space-y-1">
          {TASKS.map((t) => {
            const open = openTask === t.id
            const [tone, label] = statusTone[t.status]
            return (
              <motion.li layout key={t.id} className={`rounded-2xl transition-colors ${open ? 'bg-paper-2' : 'hover:bg-paper-2/60'}`}>
                <button onClick={() => setOpenTask(open ? null : t.id)} className="flex w-full items-center gap-4 px-3 py-3.5 text-left" aria-expanded={open}>
                  <span className="w-16 shrink-0 font-mono text-xs text-muted">{t.plot}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{t.what}</span>
                    <span className="block truncate text-xs text-muted">
                      {t.when} / {t.where}
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
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-4 pl-[5.75rem]">
                        <ul className="space-y-1.5 text-sm text-ink-2">
                          {t.notes.map((n) => (
                            <li key={n} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                              {n}
                            </li>
                          ))}
                        </ul>
                        {t.status === 'assigned' ? (
                          <Button size="sm" className="mt-4" arrow>
                            Start survey
                          </Button>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </ul>
      </Panel>

      <Panel title="Hours by month" meta="2026 season">
        <Columns
          unit="hours"
          data={[
            { label: 'Jul', value: 6 },
            { label: 'Aug', value: 4 },
            { label: 'Sep', value: 12 },
            { label: 'Oct', value: 16 },
            { label: 'Nov', value: 8 },
          ]}
        />
      </Panel>
    </div>
  )
}

// Phone first checklist for a photo survey: one photo per marked stake, plus what you saw.
// Big targets, works with wet thumbs. Nobody counts plants; the photos carry the record.
const STAKES = [
  { id: 1, facing: 'N' },
  { id: 2, facing: 'E' },
  { id: 3, facing: 'S' },
  { id: 4, facing: 'W' },
]
const SIGNS = ['Browsing by camels', 'Cut stems', 'Washed out patch', 'Trash in the plot']

function StakeChecklist() {
  const [shot, setShot] = useState([])
  const [signs, setSigns] = useState([])
  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const done = shot.length === STAKES.length

  return (
    <Panel
      title="Stake photos"
      meta="Practice the checklist you will use in the field"
      action={
        <button
          onClick={() => {
            setShot([])
            setSigns([])
          }}
          className="text-sm text-muted hover:text-ink"
        >
          Reset
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {STAKES.map((s) => {
          const on = shot.includes(s.id)
          return (
            <motion.button
              key={s.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => toggle(shot, setShot, s.id)}
              aria-pressed={on}
              className={`relative flex aspect-[4/3] flex-col items-start justify-between overflow-hidden rounded-2xl p-3 text-left transition-colors duration-300 ${
                on ? 'bg-leaf text-paper' : 'bg-paper-2 text-ink'
              }`}
            >
              <span className="font-mono text-[0.7rem] opacity-80">Facing {s.facing}</span>
              <span className="font-display text-xl leading-none">Stake {s.id}</span>
              <svg viewBox="0 0 16 16" className="absolute right-3 top-3 h-5 w-5" aria-hidden="true">
                <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeOpacity={on ? 0 : 0.35} strokeWidth="1.5" />
                <motion.path d="M4.5 8.3l2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" initial={false} animate={{ pathLength: on ? 1 : 0 }} />
              </svg>
            </motion.button>
          )
        })}
      </div>

      <p className="mt-5 text-sm font-medium">Anything you noticed?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SIGNS.map((g) => {
          const on = signs.includes(g)
          return (
            <button
              key={g}
              onClick={() => toggle(signs, setSigns, g)}
              aria-pressed={on}
              className={`rounded-full px-3 py-1.5 text-xs ring-1 ring-inset transition-colors ${on ? 'bg-rust text-paper ring-rust' : 'text-ink-2 ring-line hover:ring-ink/50'}`}
            >
              {g}
            </button>
          )
        })}
      </div>

      <div className="mt-5">
        <div className="flex h-2 overflow-hidden rounded-full bg-paper-2">
          <motion.div className="h-full bg-leaf" animate={{ width: `${(shot.length / STAKES.length) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
        </div>
        <p className="mt-2 flex justify-between text-xs text-muted">
          <span>
            {shot.length} of {STAKES.length} stakes photographed
          </span>
          <span className={`font-medium ${done ? 'text-leaf' : 'text-ink'}`}>{done ? 'Ready to submit' : 'Keep going'}</span>
        </p>
      </div>
    </Panel>
  )
}
