import { useState } from 'react'
import { motion } from 'motion/react'
import DashboardShell, { Panel, Stat, Upcoming } from '../../components/DashboardShell'
import { Pill } from '../../components/ui'
import { LatestDrive, WorthReading } from '../../components/JournalPanels'
import { AlertsPanel, HoursPanel, NextTask, TaskList } from '../../components/FeaturePanels'
import { VOLUNTEER_STATS } from '../../lib/previewData'
import { PHOTOS, src } from '../../lib/fieldPhotos'
import { SALTWATER_MARINA } from '../../lib/sites'
import { useAuth } from '../../lib/auth'

/*
  Volunteer dashboard. The volunteer request (pending or approved) comes from the database, the
  drive and articles from the Journal. Tasks, hours and satellite alerts read lib/previewData.js
  until those features are built.
*/

const NAV = [
  { key: 'overview', label: 'Overview', glyph: 'overview', short: 'Home' },
  { key: 'tasks', label: 'Field tasks', glyph: 'tasks', short: 'Tasks', plan: 'All assigned visits by area, with plot boundaries, stake positions and photo requests from adopters.' },
  { key: 'surveys', label: 'My surveys', glyph: 'photos', short: 'Surveys', plan: 'Every survey you submitted, its verification status and the coordinator notes.' },
  { key: 'trips', label: 'Trips', glyph: 'trips', plan: 'Plantation drives you can join as crew.' },
  { key: 'hours', label: 'Hours', glyph: 'hours', plan: 'A full record of your hours and plots, which you can download as a certificate.' },
]

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
            ? 'Your volunteer request is with Saltwater Marina. You will see field tasks here once it is approved.'
            : 'Two field tasks coming up. The next one is a photo survey of KD-021 on Saturday 7 November.'
      }
    >
      {active === 'overview' ? <Overview user={user} pending={pending} /> : <Upcoming section={section} />}
    </DashboardShell>
  )
}

function Overview({ user, pending }) {
  const p = user.profile
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      {/* the volunteer request, as saved */}
      <section className="relative overflow-hidden rounded-[22px] bg-ink p-6 text-paper sm:p-7 xl:col-span-2">
        <img
          src={src(PHOTOS.wadingBank, 800)}
          alt={PHOTOS.wadingBank.alt}
          className="-mx-6 -mt-6 mb-6 h-36 w-[calc(100%+3rem)] max-w-none object-cover sm:-mx-7 sm:-mt-7 sm:w-[calc(100%+3.5rem)]"
          style={{ objectPosition: '50% 35%' }}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow !text-paper/70">Volunteer request</p>
            <p className="mt-3 font-display text-[2rem] leading-tight">{pending ? 'Waiting for approval' : 'Approved'}</p>
            <p className="mt-1 max-w-md text-paper/75">
              {pending
                ? 'A Saltwater Marina coordinator reads every request. This page changes as soon as yours is approved.'
                : 'Saltwater Marina will contact you before each field visit in your area.'}
            </p>
          </div>
          <Pill tone={pending ? 'muted' : 'leaf'}>{pending ? 'Pending' : 'Volunteer'}</Pill>
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-5 border-t border-paper/15 pt-5 text-sm sm:grid-cols-4">
          {[
            ['Area', p.area || 'Not given'],
            ['Days', p.days?.length ? p.days.join(', ') : 'Not given'],
            ['On a boat before', p.boat || 'Not given'],
            ['Contact', user.phone],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-paper/70">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-paper/70">
          To change your area or days, edit your profile. Questions:{' '}
          <a href={`mailto:${SALTWATER_MARINA.email}`} className="link-grow pb-0.5 text-paper">
            {SALTWATER_MARINA.email}
          </a>
        </p>
      </section>

      <StakeChecklist />

      <Stats />
      <TaskList className="xl:col-span-2" />
      <NextTask />
      <HoursPanel />
      <AlertsPanel forField title="Alerts to check in the field" className="xl:col-span-2" />

      <LatestDrive />

      <Panel className="xl:col-span-2" title="What a photo survey involves">
        <ol className="space-y-3 text-sm text-ink-2">
          {[
            'You go out by boat from Rehri Goth with a small team and a coordinator.',
            'At each plot you photograph it from every marked stake, facing the marked direction.',
            'You note anything unusual: browsing by camels, cut stems, washed out patches.',
            'A coordinator checks the photos before they reach the people who adopted the plot.',
          ].map((t, i) => (
            <motion.li
              key={t}
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-3"
            >
              <span className="font-mono text-xs text-muted">0{i + 1}</span>
              {t}
            </motion.li>
          ))}
        </ol>
      </Panel>

      <WorthReading className="xl:col-span-3" />
    </div>
  )
}

function Stats() {
  const v = VOLUNTEER_STATS
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 xl:col-span-3">
      <Stat label="Hours this season" value={v.hours} note="Since 1 Jul 2026" />
      <Stat label="Plots worked" value={v.plots} note="Kaderu and Buddo" />
      <Stat label="Surveys submitted" value={v.surveys} note={`${v.approved} approved so far`} />
      <Stat label="Drives joined" value={v.drives} note="Last one on 3 Oct" />
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
