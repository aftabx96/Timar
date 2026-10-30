import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from './ui'
import { PHOTOS, dscName, src, srcSet } from '../lib/fieldPhotos'
import { SALTWATER_MARINA, STANDARD_DRIVE } from '../lib/sites'

/*
  "How muddy do you want to get?" as an actual control.
  Drag (or click, or use the arrow keys on) the slider: the boot gets muddier, and the photo and
  details swap to the way of taking part at that depth.
*/

const WAYS = [
  {
    key: 'adopt',
    title: 'Adopt a mangrove',
    depth: 0,
    depthLabel: 'Not a drop',
    body: 'Adopt one or more mangroves from the Rehri Goth nursery. You get the spot each one was planted and a photo timeline you can check from your phone.',
    facts: [`Rs. ${STANDARD_DRIVE.saplingCost} a mangrove`, 'Photo timeline', 'Survival updates'],
    cta: 'Adopt a mangrove',
    photo: PHOTOS.propagules,
  },
  {
    key: 'report',
    title: 'Report cutting',
    depth: 10,
    depthLabel: 'Boots on the shore',
    body: 'Seen mangroves cut or creek land being filled? Send a location and a photo. Timar compiles it into a formal complaint.',
    facts: ['Location and photo', 'Tracked by status', 'Sent to the Forest Department'],
    cta: 'Report cutting',
    photo: PHOTOS.stumpField,
  },
  {
    key: 'safari',
    title: 'Take a Mangrove Safari',
    depth: 20,
    depthLabel: 'Hands in the mud',
    body: 'A guided boat ride through the mangrove channels to see how the forest works, then you step off and plant a sapling of your own before heading back.',
    facts: ['Guided boat ride', 'Plant your own sapling', 'Funds the conservation work'],
    cta: 'Book a safari',
    photo: PHOTOS.creekBoatTall,
  },
  {
    key: 'company',
    title: 'Run a carbon project as a company',
    depth: 30,
    depthLabel: 'Your team, ankle deep',
    body: 'Take on a blue carbon project: your company funds whole plots, your team plants them, and every survey adds checked photos and a health reading you can use in carbon and ESG reporting.',
    facts: ['Plots under your name', 'Plot health checked in the field', 'Carbon estimates for reports'],
    cta: 'Start a carbon project',
    photo: PHOTOS.rows,
  },
  {
    key: 'drive',
    title: 'Bring a group on a drive',
    depth: 50,
    depthLabel: 'Knee deep',
    body: `A ${STANDARD_DRIVE.hours} hour morning: a fishing boat from Rehri Goth to Kaderu Island, ${STANDARD_DRIVE.saplingsEach} saplings each, then lunch and a walk round the island.`,
    facts: [`PKR ${STANDARD_DRIVE.pricePerHead.toLocaleString()} per person`, 'Any group size', 'Lunch on the island'],
    cta: 'Book a drive',
    photo: PHOTOS.boat,
  },
  {
    key: 'volunteer',
    title: 'Be a volunteer',
    depth: 100,
    depthLabel: 'Up to your waist',
    body: 'Help on plantation drives, look after the nursery and photograph plots on survey visits, sometimes from inside the creek. Your hours and plots stay on your profile.',
    facts: [`${SALTWATER_MARINA.dailyVolunteers}+ volunteers out most days`, 'Drives, nursery and surveys', 'Hours on your profile'],
    cta: 'Join as a volunteer',
    photo: PHOTOS.team,
  },
]

const PAD = 22 // px kept clear at each end of the track so the thumb never hangs off
const at = (t) => `calc(${PAD}px + (100% - ${PAD * 2}px) * ${t})`
const ease = [0.22, 1, 0.36, 1]

export default function MudGauge() {
  const [i, setI] = useState(0)
  const track = useRef(null)
  const dragging = useRef(false)
  const way = WAYS[i]

  const indexAt = useCallback((clientX) => {
    const r = track.current.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - r.left - PAD) / (r.width - PAD * 2)))
    return Math.round(t * (WAYS.length - 1))
  }, [])

  const onPointerDown = (e) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    setI(indexAt(e.clientX))
  }
  const onPointerMove = (e) => {
    if (dragging.current) setI(indexAt(e.clientX))
  }
  const onPointerUp = () => {
    dragging.current = false
  }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setI((v) => Math.min(WAYS.length - 1, v + 1))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setI((v) => Math.max(0, v - 1))
    else if (e.key === 'Home') setI(0)
    else if (e.key === 'End') setI(WAYS.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      {/* the photo for the chosen way in */}
      <div className="relative order-2 lg:order-1">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-paper-3 sm:aspect-[5/4] lg:aspect-[4/5]">
          <AnimatePresence initial={false}>
            <motion.img
              key={way.photo.file}
              src={src(way.photo)}
              srcSet={srcSet(way.photo)}
              sizes="(min-width: 1024px) 45vw, 100vw"
              alt={way.photo.alt}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: way.photo.focus }}
              initial={{ clipPath: 'inset(100% 0 0 0)', scale: 1.08, zIndex: 1 }}
              animate={{ clipPath: 'inset(0% 0 0 0)', scale: 1, zIndex: 1 }}
              exit={{ zIndex: 0, transition: { duration: 0.6 } }}
              transition={{ duration: 0.6, ease }}
            />
          </AnimatePresence>
          <p className="absolute bottom-3 left-3 z-10 rounded-full bg-ink px-3 py-1.5 font-mono text-[0.68rem] text-paper/85">
            {dscName(way.photo)}, {way.photo.time}
          </p>
        </div>

      </div>

      {/* controls and details */}
      <div className="order-1 flex flex-col lg:order-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-ink-2">How muddy?</p>
          <p className="font-mono text-xs text-muted">
            {i + 1} of {WAYS.length}
          </p>
        </div>

        {/* the slider: drag, click a stop, or use arrow keys */}
        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label="How muddy do you want to get"
          aria-valuemin={0}
          aria-valuemax={WAYS.length - 1}
          aria-valuenow={i}
          aria-valuetext={`${way.title}, ${way.depthLabel}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className="relative mt-5 h-14 cursor-grab touch-none select-none rounded-full outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-tide focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
        >
          {/* the track gets muddier from left to right */}
          <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full bg-paper-3">
            <div className="h-full w-full" style={{ background: 'linear-gradient(90deg, var(--color-tide-pale), #c9b48f 55%, #7a5c38)' }} />
          </div>
          <motion.div
            className="absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-ink/80"
            animate={{ width: at(i / (WAYS.length - 1)) }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
          {WAYS.map((w, k) => (
            <span
              key={w.key}
              className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${k <= i ? 'bg-paper' : 'bg-ink/30'}`}
              style={{ left: at(k / (WAYS.length - 1)) }}
            />
          ))}
          <motion.div
            className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-paper shadow-[0_8px_20px_-8px_rgba(19,41,29,.6)]"
            animate={{ left: at(i / (WAYS.length - 1)) }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <Boot depth={way.depth} />
          </motion.div>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[0.68rem] text-muted">
          <span>Dry</span>
          <span>Waist deep</span>
        </div>

        {/* quick picks, so nobody has to drag */}
        <div className="mt-6 flex flex-wrap gap-2">
          {WAYS.map((w, k) => (
            <button
              key={w.key}
              onClick={() => setI(k)}
              aria-pressed={k === i}
              className={`relative overflow-hidden rounded-full px-3.5 py-2 text-sm ring-1 ring-inset transition-colors duration-200 ${
                k === i ? 'text-paper ring-ink' : 'text-ink-2 ring-line hover:ring-ink/50'
              }`}
            >
              {k === i ? <motion.span layoutId="mud-pick" className="absolute inset-0 bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} /> : null}
              <span className="relative">{w.title}</span>
            </button>
          ))}
        </div>

        <div className="relative mt-8 min-h-[280px] border-t border-ink pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={way.key}
              initial={{ y: 16, clipPath: 'inset(0 0 100% 0)' }}
              animate={{ y: 0, clipPath: 'inset(0 0 -10% 0)' }}
              exit={{ y: -10, clipPath: 'inset(100% 0 0 0)' }}
              transition={{ duration: 0.4, ease }}
            >
              <p className="font-mono text-xs text-muted">{way.depthLabel}</p>
              <h3 className="mt-2 font-display text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.05]">{way.title}</h3>
              <p className="mt-4 max-w-lg leading-relaxed text-ink-2">{way.body}</p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {way.facts.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button to="/signup" className="mt-7" arrow>
                {way.cta}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* The slider thumb is a boot that gets muddier as you go. */
function Boot({ depth }) {
  const mud = Math.min(1, depth / 60)
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <defs>
        <clipPath id="boot-shape">
          <path d="M8 3h6v9l5 3.2c1 .6 1.6 1.7 1.6 2.9V20H4v-6.5L8 11z" />
        </clipPath>
      </defs>
      <path d="M8 3h6v9l5 3.2c1 .6 1.6 1.7 1.6 2.9V20H4v-6.5L8 11z" fill="var(--color-paper)" />
      <g clipPath="url(#boot-shape)">
        <motion.rect x="0" width="24" height="24" fill="#8a6a43" animate={{ y: 20 - mud * 17 }} transition={{ type: 'spring', stiffness: 160, damping: 20 }} />
      </g>
      <path d="M8 3h6v9l5 3.2c1 .6 1.6 1.7 1.6 2.9V20H4v-6.5L8 11z" fill="none" stroke="var(--color-paper)" strokeWidth="1.2" />
    </svg>
  )
}
