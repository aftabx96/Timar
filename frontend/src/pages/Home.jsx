import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react'
import { Navbar, Footer } from '../components/SiteChrome'
import CreekMap from '../components/CreekMap'
import { Arrow, Button, CountUp, MaskLines, TideLine } from '../components/ui'
import { SurvivalCurve } from '../components/charts'
import { MangroveForest } from '../components/illustrations'
import Photo from '../components/Photo'
import SitesMap from '../components/SitesMap'
import MudGauge from '../components/MudGauge'
import { SALTWATER_MARINA, STANDARD_DRIVE } from '../lib/sites'
import { FIELD_DAY, FIELD_DRIVE, FIELD_PLACE, PHOTOS, dscName, src } from '../lib/fieldPhotos'

export default function Home() {
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView(), 60)
  }, [])
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <RecordSection />
        <HowItWorks />
        <Sites />
        <Impact />
        <TakePart />
        <Species />
        <ClosingCta />
      </main>
      <Footer />
    </>
  )
}

/* ---------------------------------------------------------------- hero */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <MaskLines
            lines={['Every mangrove', 'we plant gets', 'a record.']}
            className="font-display text-[clamp(2.75rem,7vw,5.4rem)] leading-[0.98] tracking-[-0.02em] text-ink"
          />
          <motion.p
            initial={{ clipPath: 'inset(0 0 100% 0)', y: 14 }}
            animate={{ clipPath: 'inset(0 0 -10% 0)', y: 0 }}
            transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-[34rem] text-lg leading-relaxed text-ink-2"
          >
            Timar maps each plantation plot in the creeks of Karachi, photographs it from the same marked stakes at every field visit, and shows the people who adopt them the
            exact plants their money put in the mud.
          </motion.p>
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)', y: 14 }}
            animate={{ clipPath: 'inset(0 0 -10% 0)', y: 0 }}
            transition={{ delay: 0.58, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Button to="/signup" size="lg" arrow>
              Adopt a mangrove
            </Button>
            <Button to="/signup" size="lg" variant="outline">
              Book a plantation trip
            </Button>
          </motion.div>
          <motion.dl
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ delay: 0.8, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 grid max-w-md grid-cols-3 divide-x divide-line border-y border-line py-4"
          >
            {[
              ['Planted so far', '7,000+'],
              ['Drives run', '30+'],
              ['Goal by 2035', '10 million'],
            ].map(([k, v]) => (
              <div key={k} className="px-4 first:pl-0">
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-1 font-display text-2xl text-ink">{v}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <HeroPhotos />
      </div>
      <TideLine className="absolute inset-x-0 bottom-0 h-5" opacity={0.35} />
    </section>
  )
}

// Two real photos from the field day, the larger one drifting slightly slower than the page.
function HeroPhotos() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const drift = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const ease = [0.22, 1, 0.36, 1]

  return (
    <div ref={ref} className="relative pb-14 sm:pb-20 lg:pl-6">
      <motion.div
        className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-paper-3 sm:aspect-[5/5] lg:aspect-[4/5]"
        initial={{ clipPath: 'inset(100% 0 0 0 round 28px)' }}
        animate={{ clipPath: 'inset(0% 0 0 0 round 28px)' }}
        transition={{ duration: 1.2, delay: 0.1, ease }}
      >
        {/* a portrait crop cut from the full size original, so the browser never has to stretch it */}
        <motion.img
          src="/field/dsc02012-hero-1400.webp"
          srcSet="/field/dsc02012-hero-900.webp 900w, /field/dsc02012-hero-1400.webp 1400w"
          sizes="(min-width: 1024px) 50vw, 100vw"
          alt={PHOTOS.bank.alt}
          fetchPriority="high"
          className="absolute inset-x-0 -top-[6%] h-[118%] w-full object-cover"
          style={{ objectPosition: '50% 40%', y: drift }}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, delay: 0.1, ease }}
        />
      </motion.div>

      <motion.figure
        className="absolute bottom-0 left-0 w-[38%] sm:w-[34%] lg:-left-6"
        initial={{ clipPath: 'inset(0 100% 0 0)', rotate: -3 }}
        animate={{ clipPath: 'inset(0 0% 0 0)', rotate: -3 }}
        transition={{ duration: 1, delay: 0.75, ease }}
      >
        <div className="overflow-hidden rounded-2xl border-[6px] border-paper bg-paper">
          <img
            src={src(PHOTOS.seedlingStump, 800)}
            alt={PHOTOS.seedlingStump.alt}
            className="aspect-[3/4] w-full rounded-[10px] object-cover"
            style={{ objectPosition: PHOTOS.seedlingStump.focus }}
          />
        </div>
      </motion.figure>

      <p className="absolute bottom-1 right-0 max-w-[55%] text-right font-mono text-[0.7rem] leading-relaxed text-muted sm:bottom-4">
        {FIELD_PLACE} creek, {FIELD_DAY}
        <br />
        {dscName(PHOTOS.bank)}, {PHOTOS.bank.time}
      </p>
    </div>
  )
}

/* ---------------------------------------------------- without / with a record */

// Real photos from one morning. Scattered, they are a camera roll; filed, each one says what it shows and when.
const TILES = [
  { id: 'a', photo: PHOTOS.stumpMud, file: 'DSC02029.JPG', what: 'Cut stump at the water line' },
  { id: 'b', photo: PHOTOS.seedlingStumpWide, file: 'DSC02036.JPG', what: 'Seedling beside a stump' },
  { id: 'c', photo: PHOTOS.rows, file: 'DSC02044.JPG', what: 'Planted rows on the flat' },
  { id: 'd', photo: PHOTOS.propagules, file: 'DSC02056.JPG', what: 'Propagules ready to plant' },
  { id: 'e', photo: PHOTOS.wading, file: 'DSC02085.JPG', what: 'Survey photo from inside the creek' },
]
const SCATTER = [
  { left: '4%', top: '8%', rotate: -9 },
  { left: '50%', top: '2%', rotate: 7 },
  { left: '26%', top: '34%', rotate: -3 },
  { left: '54%', top: '44%', rotate: 11 },
  { left: '8%', top: '58%', rotate: 5 },
]

function RecordSection() {
  const [ordered, setOrdered] = useState(false)

  return (
    <section className="border-t border-line bg-paper-2/60 py-24 md:py-32">
      <div className="container-x grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:pt-6">
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] tracking-[-0.015em]">
            A plantation drive is not a forest.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">
            Thousands of seedlings go into Karachi&apos;s creeks every year. The photos end up in phone galleries and group chats. Six months
            later nobody can say what survived, or why the rest did not.
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Timar keeps the same photos, taken from the same stake, next to a health check a coordinator has signed off. That is what turns a drive into evidence.
          </p>

          <div className="mt-10 inline-flex rounded-full bg-paper p-1 ring-1 ring-line" role="tablist" aria-label="Compare">
            {[
              [false, 'Without a record'],
              [true, 'With Timar'],
            ].map(([val, label]) => (
              <button
                key={label}
                role="tab"
                aria-selected={ordered === val}
                onClick={() => setOrdered(val)}
                className="relative rounded-full px-5 py-2.5 text-sm font-medium"
              >
                {ordered === val ? (
                  <motion.span layoutId="toggle-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                ) : null}
                <span className={`relative transition-colors duration-300 ${ordered === val ? 'text-paper' : 'text-ink-2'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          className={`relative rounded-[28px] border border-line bg-paper ${ordered ? 'self-center p-5 sm:p-7' : 'h-[460px] overflow-hidden sm:h-[520px]'}`}
        >
          {ordered ? (
            <motion.div layout className="mb-5 border-b border-line pb-5">
              <p className="font-mono text-xs text-muted">Drive record / {FIELD_PLACE}</p>
              {/* the drive itself: when, where, who and how many went in the mud */}
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
                {[
                  ['When', FIELD_DRIVE.date, `${FIELD_DRIVE.start} to ${FIELD_DRIVE.end}`],
                  ['Where', FIELD_DRIVE.to, `by boat from ${FIELD_DRIVE.from}`],
                  ['People', FIELD_DRIVE.people, 'on the boat'],
                  ['Planted', FIELD_DRIVE.saplings, FIELD_DRIVE.saplingsNote],
                ].map(([k, v, sub], i) => (
                  <motion.div
                    key={k}
                    initial={{ clipPath: 'inset(0 0 100% 0)', y: 8 }}
                    animate={{ clipPath: 'inset(0 0 -20% 0)', y: 0 }}
                    transition={{ delay: 0.25 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <dt className="eyebrow">{k}</dt>
                    <dd className="mt-1 font-display text-2xl leading-tight">{typeof v === 'number' ? <CountUp to={v} duration={1} /> : v}</dd>
                    <dd className="text-xs text-muted">{sub}</dd>
                  </motion.div>
                ))}
              </dl>
              {FIELD_DRIVE.confirmed ? null : (
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Route, group size and sapling count follow Saltwater Marina&apos;s standard drive until the drive log is filled in.
                </p>
              )}
            </motion.div>
          ) : null}
          <div className={ordered ? 'grid grid-cols-2 gap-3 sm:grid-cols-5' : ''}>
            {TILES.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                transition={{ type: 'spring', stiffness: 170, damping: 24, delay: i * 0.03 }}
                animate={{ rotate: ordered ? 0 : SCATTER[i].rotate }}
                style={ordered ? {} : { position: 'absolute', left: SCATTER[i].left, top: SCATTER[i].top }}
                className={`${ordered ? '' : 'w-[42%] sm:w-[36%]'} overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_30px_-20px_rgba(19,41,29,.5)]`}
              >
                <motion.div layout className="aspect-[4/3] overflow-hidden bg-paper-3">
                  <img
                    src={src(t.photo, 800)}
                    alt={t.photo.alt}
                    loading="lazy"
                    draggable="false"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: t.photo.focus }}
                  />
                </motion.div>
                <motion.div layout className="px-3 py-2.5">
                  {ordered ? (
                    <>
                      <p className="font-mono text-[0.7rem] text-muted">{t.photo.time}</p>
                      <p className="text-sm font-medium leading-snug">{t.what}</p>
                    </>
                  ) : (
                    <p className="truncate font-mono text-xs text-muted">{t.file}</p>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- how it works */

const STEPS = [
  {
    title: 'Map the plot',
    body: 'Before a seedling goes in, a coordinator walks the boundary with a phone. The plot is saved with its species, planting date, how many seedlings went in and the person responsible.',
    detail: 'Boundary, area in hectares, GPS checked',
  },
  {
    title: 'Plant and photograph',
    body: 'Volunteers plant on the drive and take the first photo from a marked stake, so every later photo shows the same patch from the same angle.',
    detail: 'Stake photos, timestamp, location',
  },
  {
    title: 'Photograph at every visit',
    body: 'Survey teams go back at 1, 3, 6 and 12 months and photograph each plot from its marked stakes. Nobody counts every plant. A model reads the photos for plant health and green cover, so loss shows up between visits.',
    detail: 'Same stakes, same angle, health read from the photos',
  },
  {
    title: 'Publish what changed',
    body: 'Once a coordinator checks the photos and the health reading, the plot’s status goes live on the plot page, the adopter page and the public dashboard. Nothing is published unchecked.',
    detail: 'Checked by Saltwater Marina',
  },
]

function HowItWorks() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <section id="how" className="scroll-mt-20 py-24 md:py-32">
      <div className="container-x grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] tracking-[-0.015em]">
            From mud to a record you can check.
          </h2>
          <p className="mt-6 max-w-sm leading-relaxed text-ink-2">
            Four steps, the same for every plot. Each one leaves something behind that someone else can look at later.
          </p>
          <div className="mt-10 max-w-md">
            <CreekMap />
          </div>
        </div>

        <div ref={ref} className="relative pl-10 sm:pl-14">
          <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-line sm:left-[15px]" />
          <motion.div style={{ scaleY: fill }} className="absolute bottom-2 left-[11px] top-2 w-0.5 origin-top bg-leaf sm:left-[15px]" />
          <ol className="space-y-14 md:space-y-20">
            {STEPS.map((s, i) => (
              <Step key={s.title} step={s} index={i} progress={fill} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Step({ step, index, progress }) {
  const at = index / STEPS.length
  const bg = useTransform(progress, [at, at + 0.04], ['#f2f2ea', '#3f7a34'])
  const border = useTransform(progress, [at, at + 0.04], ['#cbd2bd', '#3f7a34'])
  return (
    <li className="relative">
      <motion.span
        style={{ backgroundColor: bg, borderColor: border }}
        className="absolute -left-10 top-1 h-6 w-6 rounded-full border-2 sm:-left-14 sm:h-8 sm:w-8"
      />
      <p className="font-mono text-sm text-muted">0{index + 1}</p>
      <h3 className="mt-2 font-display text-2xl md:text-3xl">{step.title}</h3>
      <p className="mt-3 max-w-xl leading-relaxed text-ink-2">{step.body}</p>
      <p className="mt-4 inline-block border-l-2 border-leaf pl-3 font-mono text-xs text-muted">{step.detail}</p>
    </li>
  )
}

/* ----------------------------------------------------------------- sites */

function Sites() {
  return (
    <section id="sites" className="scroll-mt-16 border-t border-line bg-paper-2/60 py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] tracking-[-0.015em]">
            Every drive leaves from Rehri Goth.
          </h2>
          <div className="max-w-md">
            <p className="leading-relaxed text-ink-2">
              Saltwater Marina runs {SALTWATER_MARINA.drivesPerMonth} community drives a month from its home in Rehri Goth, out to Kaderu Island,
              Buddo Island and Kairi Creek. Bundal Island and Keti Bandar are on the map as places plots could go later. Nobody has surveyed them
              for Timar yet.
            </p>
            <a
              href={SALTWATER_MARINA.website}
              target="_blank"
              rel="noreferrer"
              className="link-grow mt-3 inline-block pb-0.5 font-mono text-[0.7rem] text-muted"
            >
              Sites and figures from saltwater-marina.com
            </a>
          </div>
        </div>
        <div className="mt-12">
          <SitesMap />
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- impact */

function Impact() {
  return (
    <section id="impact" className="scroll-mt-16 bg-ink py-24 text-paper md:py-32">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] tracking-[-0.015em]">The coast so far.</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-paper/75">
            Saltwater Marina&apos;s own published figures. What nobody can show yet is how those mangroves are doing today. That is the record
            Timar is built to keep.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] bg-paper/15 lg:grid-cols-[1.1fr_1fr]">
          <div className="bg-ink p-7 sm:p-10">
            <p className="text-sm text-paper/75">Mangroves planted by Saltwater Marina</p>
            <p className="mt-3 font-display text-[clamp(3.4rem,9vw,6.5rem)] leading-none">
              <CountUp to={SALTWATER_MARINA.planted} suffix="+" />
            </p>
            <p className="mt-3 text-sm text-paper/75">
              Aiming for {(SALTWATER_MARINA.goal / 1_000_000).toLocaleString()} million along the coast and the Indus Delta by{' '}
              {SALTWATER_MARINA.goalYear}.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-paper/15 pt-6">
              {[
                { to: SALTWATER_MARINA.drives, suffix: '+', label: 'conservation drives' },
                { to: SALTWATER_MARINA.people, suffix: '+', label: 'people engaged' },
                { to: SALTWATER_MARINA.dailyVolunteers, suffix: '+', label: 'volunteers out most days' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-3xl sm:text-4xl">
                    <CountUp to={s.to} decimals={s.decimals} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-xs text-paper/65 sm:text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-ink p-7 sm:p-10">
            <p className="text-sm text-paper/75">Estimated survival by months since planting</p>
            <p className="mt-1 font-mono text-[0.7rem] text-paper/75">Sample curve, until the first verified surveys are in</p>
            <SurvivalCurve
              dark
              className="mt-6"
              data={[
                { x: 0, y: 100 },
                { x: 1, y: 92 },
                { x: 3, y: 83 },
                { x: 6, y: 76 },
                { x: 12, y: 71 },
                { x: 18, y: 69 },
              ]}
            />
            <p className="mt-4 text-xs leading-relaxed text-paper/75">
              Most losses happen in the first three months, which is why the first two survey visits matter most.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- take part */

function TakePart() {
  return (
    <section id="take-part" className="scroll-mt-16 py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
          <h2 className="max-w-2xl font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] tracking-[-0.015em]">
            How muddy do you want to get?
          </h2>
          <p className="max-w-md leading-relaxed text-ink-2">
            Six ways to take part, from adopting a mangrove on your phone to photographing plots waist deep in the creek. Slide to find yours.
          </p>
        </div>
        <div className="mt-14">
          <MudGauge />
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- species */

const SPECIES = [
  {
    name: 'Avicennia marina',
    common: 'Grey mangrove, locally timar',
    roots: 'Pencil roots that poke up through the mud to breathe',
    salt: 'Very high',
    share: 'Most of the delta',
    leaf: { w: 26, h: 54, tip: 0.2 },
  },
  {
    name: 'Rhizophora mucronata',
    common: 'Loop root mangrove',
    roots: 'Stilt roots that arch down from the trunk',
    salt: 'Moderate',
    share: 'Reintroduced in patches',
    leaf: { w: 34, h: 62, tip: 0.55 },
  },
  {
    name: 'Ceriops tagal',
    common: 'Spurred mangrove',
    roots: 'Short buttress and knee roots',
    salt: 'High',
    share: 'Rare, trial plots',
    leaf: { w: 30, h: 48, tip: 0.05 },
  },
  {
    name: 'Aegiceras corniculatum',
    common: 'River mangrove',
    roots: 'Shallow roots, grows as a shrub',
    salt: 'Lower, prefers fresher water',
    share: 'Creek heads only',
    leaf: { w: 32, h: 44, tip: 0.0 },
  },
]

function Leaf({ w, h, tip }) {
  const cx = 60
  const top = 60 - h / 2
  const bot = 60 + h / 2
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden="true">
      <motion.path
        d={`M${cx} ${bot} C ${cx - w} ${bot - h * 0.35}, ${cx - w * 0.8} ${top + h * tip * 0.4}, ${cx} ${top} C ${cx + w * 0.8} ${top + h * tip * 0.4}, ${cx + w} ${bot - h * 0.35}, ${cx} ${bot} Z`}
        fill="var(--color-leaf-pale)"
        stroke="var(--color-leaf)"
        strokeWidth="1.6"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <path d={`M${cx} ${bot + 10} L${cx} ${top + 6}`} stroke="var(--color-leaf)" strokeWidth="1.4" />
      {[0.3, 0.5, 0.7].map((t) => (
        <g key={t} stroke="var(--color-leaf)" strokeWidth="1" opacity=".6">
          <path d={`M${cx} ${bot - h * t} l ${-w * 0.45} ${-h * 0.12}`} />
          <path d={`M${cx} ${bot - h * t} l ${w * 0.45} ${-h * 0.12}`} />
        </g>
      ))}
    </svg>
  )
}

function Species() {
  const track = useRef(null)
  return (
    <section id="species" className="scroll-mt-16 overflow-hidden border-t border-line bg-paper-2/60 py-24 md:py-32">
      <div className="container-x grid gap-8 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] tracking-[-0.015em]">Why the name.</h2>
        </div>
        <p className="max-w-md leading-relaxed text-ink-2">
          Along the Sindh coast, <span className="font-medium text-ink">timar</span> is the everyday name for the grey mangrove, the hardy tree
          that holds most of the Indus Delta together. These are the species that go into Timar plots.
        </p>
      </div>

      <div ref={track} className="container-x mt-14">
        <motion.ul
          drag="x"
          dragConstraints={track}
          dragElastic={0.08}
          className="flex w-max cursor-grab gap-4 active:cursor-grabbing sm:gap-5"
        >
          {SPECIES.map((s) => (
            <li key={s.name} className="w-[78vw] max-w-[320px] shrink-0 select-none rounded-[24px] border border-line bg-paper p-6">
              <div className="flex items-start justify-between">
                <Leaf {...s.leaf} />
                <span className="font-mono text-[0.68rem] text-muted">{s.share}</span>
              </div>
              <p className="mt-4 font-display text-2xl leading-tight">{s.name}</p>
              <p className="mt-1 text-sm text-muted">{s.common}</p>
              <dl className="mt-6 space-y-3 border-t border-line pt-4 text-sm">
                <div>
                  <dt className="eyebrow">Roots</dt>
                  <dd className="mt-1 text-ink-2">{s.roots}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Salt tolerance</dt>
                  <dd className="mt-1 text-ink-2">{s.salt}</dd>
                </div>
              </dl>
            </li>
          ))}
        </motion.ul>
        <p className="mt-6 font-mono text-xs text-muted">Drag to see all four</p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ closing */

function ClosingCta() {
  return (
    <section className="relative overflow-hidden pt-24 md:pt-36">
      <div className="container-x grid items-end gap-10 md:grid-cols-[1.4fr_1fr]">
        <h2 className="font-display text-[clamp(2.4rem,6vw,4.8rem)] leading-[1] tracking-[-0.02em]">
          Your mangrove, at a coordinate you can visit.
        </h2>
        <div>
          <p className="leading-relaxed text-ink-2">
            Make an account to adopt a mangrove, book a trip or sign up as a volunteer. It takes about a minute and a code sent to your email.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button to="/signup" size="lg" arrow>
              Create account
            </Button>
            <Button to="/login" size="lg" variant="outline">
              Sign in
            </Button>
          </div>
        </div>
      </div>
      <MangroveForest className="mt-16 block h-[150px] w-full sm:h-[200px] md:mt-24 md:h-[230px]" />
    </section>
  )
}
