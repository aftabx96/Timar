import { useEffect, useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { Navbar, Footer } from '../components/SiteChrome'
import { Button, CountUp, MaskLines } from '../components/ui'
import Photo from '../components/Photo'
import { SALTWATER_MARINA } from '../lib/sites'
import { PHOTOS } from '../lib/fieldPhotos'

/*
  About Timar: what the project is, the partnership with Saltwater Marina, the vision, mission,
  goal and objectives, the student team, and why the name (with the species that go into Timar plots).
*/

const ease = [0.22, 1, 0.36, 1]
const h2 = 'font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] tracking-[-0.015em]'

export default function About() {
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView(), 60)
  }, [])
  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-32">
        <Intro />
        <Species />
        <Partnership />
        <Purpose />
        <Objectives />
        <Team />
        <Closing />
      </main>
      <Footer />
    </>
  )
}

/* ---------------------------------------------------------------- intro */

function Intro() {
  return (
    <section className="container-x">
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
        <MaskLines lines={['About Timar.']} as="h1" className="font-display text-[clamp(2.6rem,6.5vw,5rem)] leading-[1] tracking-[-0.02em]" />
        <p className="max-w-md text-lg leading-relaxed text-ink-2">
          A record for every mangrove planted on the Karachi coast, built with the people who plant them.
        </p>
      </div>

      <Photo photo={PHOTOS.creekBoat} className="mt-12 aspect-[16/9] rounded-[28px] sm:aspect-[21/9] md:mt-16" sizes="100vw" eager />

      <div id="project" className="mt-16 grid scroll-mt-28 gap-10 md:mt-20 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div>
          <p className="eyebrow">The project</p>
          <p className="mt-4 max-w-xs font-display text-2xl leading-snug">Planting is the easy part. Knowing what survived is the hard part.</p>
        </div>
        <div className="max-w-2xl space-y-5 text-[1.075rem] leading-[1.75] text-ink-2">
          <p>
            A plantation drive on the Karachi coast usually ends the same way. Seedlings go into the mud, photos go into phone galleries, and a few months later
            nobody can say which plants survived, where exactly they were, or what happened to the rest.
          </p>
          <p>
            Timar fixes that. Every drive and every plot gets a record: where it was planted, when, by whom and with which species. At each survey visit a volunteer
            photographs the plot from the same marked stakes, so the photos line up visit after visit and anyone can see the plot change over time. People who adopt a
            mangrove or bring a group can follow their own plot instead of taking it on trust.
          </p>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2">
            {[
              ['Phase one, now', 'Accounts, the public site, the journal of past drives, trip booking, volunteers, photo surveys and adoption.'],
              ['Phase two, next', 'Plant health checks from photos, satellite change detection, cutting reports and impact reports for companies.'],
            ].map(([k, v]) => (
              <div key={k} className="bg-paper p-5">
                <p className="eyebrow">{k}</p>
                <p className="mt-2 text-[0.95rem] leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- partnership */

const SPLIT = [
  {
    who: 'Saltwater Marina',
    role: 'In the mud',
    items: ['Runs the plantation drives and mangrove safaris', 'Grows seedlings in its own nursery', 'Plants and guards the sites on Kaderu Island', 'Brings the Rehri Goth community and volunteers out to the creeks'],
  },
  {
    who: 'Timar',
    role: 'On the record',
    items: ['Maps every plot with its species and planting date', 'Keeps the survey photos from the marked stakes', 'Shows adopters and companies their own plots', 'Publishes the journal of past drives and articles'],
  },
]

function Partnership() {
  const stats = [
    [SALTWATER_MARINA.planted, 'mangroves planted'],
    [SALTWATER_MARINA.drives, 'plantation drives'],
    [SALTWATER_MARINA.people, 'people brought to the creeks'],
  ]
  return (
    <section id="partnership" className="scroll-mt-16 border-y border-line bg-paper-2/60 py-24 md:mt-32 md:py-32">
      <div className="container-x">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <h2 className={h2}>Saltwater Marina and Timar.</h2>
            <div className="mt-8 max-w-xl space-y-5 leading-relaxed text-ink-2">
              <p>
                <a href={SALTWATER_MARINA.website} target="_blank" rel="noreferrer" className="link-grow pb-0.5 font-medium text-ink">
                  Saltwater Marina
                </a>{' '}
                is a community led conservation group from Rehri Goth, founded by {SALTWATER_MARINA.founder}. Its team works mainly on Kaderu Island, together with
                people from the Rehri Goth community.
              </p>
              <p>Saltwater Marina does the work in the mud. Timar keeps the record of that work, so a day of planting becomes something people can check years later.</p>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-line border-y border-line py-5">
              {stats.map(([n, label]) => (
                <div key={label} className="px-4 first:pl-0">
                  <dd className="font-display text-3xl sm:text-4xl">
                    <CountUp to={n} />
                  </dd>
                  <dt className="mt-1 text-xs text-muted sm:text-sm">{label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-4 font-mono text-[0.7rem] text-muted">Figures published by Saltwater Marina</p>
          </div>

          <TeamPhoto />
        </div>

        {/* who does what */}
        <div className="mt-20 grid gap-px overflow-hidden rounded-[28px] bg-line md:mt-24 md:grid-cols-2">
          {SPLIT.map((s, i) => (
            <div key={s.who} className={`p-7 sm:p-10 ${i === 0 ? 'bg-paper' : 'bg-ink text-paper'}`}>
              <p className={`eyebrow ${i === 0 ? '' : '!text-paper/70'}`}>{s.role}</p>
              <h3 className="mt-3 font-display text-3xl">{s.who}</h3>
              <ul className={`mt-6 divide-y ${i === 0 ? 'divide-line' : 'divide-paper/15'}`}>
                {s.items.map((t, k) => (
                  <motion.li
                    key={t}
                    initial={{ x: i === 0 ? -16 : 16, clipPath: 'inset(0 100% 0 0)' }}
                    whileInView={{ x: 0, clipPath: 'inset(0 0% 0 0)' }}
                    viewport={{ once: true, margin: '0px 0px -40px 0px' }}
                    transition={{ duration: 0.6, delay: k * 0.07, ease }}
                    className="flex gap-4 py-3.5"
                  >
                    <span className={`font-mono text-xs leading-6 ${i === 0 ? 'text-muted' : 'text-paper/60'}`}>0{k + 1}</span>
                    <span className={`leading-relaxed ${i === 0 ? 'text-ink-2' : 'text-paper/90'}`}>{t}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// The Saltwater Marina team in the creek. The source is 600 px wide, so it is never shown larger than that.
function TeamPhoto() {
  const ref = useRef(null)
  const shown = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })
  return (
    <figure ref={ref} className="mx-auto w-full max-w-[600px]">
      <motion.div
        className="aspect-[3/2] overflow-hidden rounded-[28px] bg-paper-3"
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={shown ? { clipPath: 'inset(0 0% 0 0)' } : {}}
        transition={{ duration: 1.1, ease }}
      >
        <motion.img
          src="/team/saltwater-marina-team.webp"
          width="600"
          height="400"
          alt="The Saltwater Marina team standing and sitting together in shallow water in front of the mangroves"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          initial={{ scale: 1.08 }}
          animate={shown ? { scale: 1 } : {}}
          transition={{ duration: 1.4, ease }}
        />
      </motion.div>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-sm text-ink-2">
        <span>The Saltwater Marina team, out in the creek.</span>
        <a href={`https://instagram.com/${SALTWATER_MARINA.instagram}`} target="_blank" rel="noreferrer" className="link-grow shrink-0 pb-0.5 font-mono text-[0.7rem] text-muted">
          @{SALTWATER_MARINA.instagram}
        </a>
      </figcaption>
    </figure>
  )
}

/* ------------------------------------------------- vision, mission, goal */

function Purpose() {
  const ref = useRef(null)
  const shown = useInView(ref, { once: true, margin: '0px 0px -80px 0px' })
  return (
    <section id="purpose" className="scroll-mt-16 py-24 md:py-32">
      <div className="container-x">
        <dl className="grid gap-12 md:grid-cols-2 md:gap-16">
          {[
            ['Vision', 'A Karachi coastline where the mangrove forest grows back, and every tree planted for it can be accounted for.'],
            ['Mission', 'Give every plantation drive and plot an open, photo backed record, so the people who plant, fund and protect mangroves can see what their effort became.'],
          ].map(([k, v]) => (
            <div key={k} className="border-t-2 border-ink pt-6">
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-4 font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-snug">{v}</dd>
            </div>
          ))}
        </dl>

        {/* the goal, said plainly and big */}
        <figure ref={ref} className="relative mt-20 overflow-hidden rounded-[28px] bg-ink px-7 py-14 text-paper sm:px-12 md:mt-28 md:py-20">
          <figcaption className="eyebrow !text-paper/70">Our goal</figcaption>
          <blockquote className="relative mt-6 max-w-5xl font-display text-[clamp(2rem,5vw,4rem)] leading-[1.06] tracking-[-0.015em]">
            {['The goal was never appreciation,', 'but contribution to a great cause,', 'for us and for the generations to come.'].map((line, i) => (
              <span key={i} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className="block"
                  initial={{ y: '105%' }}
                  animate={shown ? { y: 0 } : { y: '105%' }}
                  transition={{ duration: 0.9, delay: i * 0.12, ease }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </blockquote>
          <div className="relative mt-12 grid gap-6 border-t border-paper/15 pt-8 sm:grid-cols-[auto_1fr] sm:items-end sm:gap-12">
            <p className="font-display text-[clamp(2.6rem,6vw,4.4rem)] leading-none">
              {(SALTWATER_MARINA.goal / 1_000_000).toLocaleString()} million
            </p>
            <p className="max-w-md leading-relaxed text-paper/75">
              mangroves is what Saltwater Marina has set out to plant by {SALTWATER_MARINA.goalYear}. Timar exists to make sure each one of them is on the record.
            </p>
          </div>
        </figure>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ objectives */

const OBJECTIVES = [
  ['Record every plot', 'Map each plantation plot with its location, boundary, species, planting date and the people responsible.'],
  ['Photograph, not guess', 'Track survival through repeat photos from fixed stakes at every survey visit, instead of counting plants by hand.'],
  ['Show adopters their trees', 'Let individuals and companies adopt mangroves and follow the exact plot their money planted.'],
  ['Organise the field work', 'Handle trip bookings, volunteer applications, field tasks and survey checks in one place.'],
  ['Teach the coast', 'Publish past drives and awareness articles so more people understand why the delta needs its mangroves.'],
  ['Prepare for the next phase', 'Build the base for plant health checks from photos and satellite monitoring of the forest.'],
]

function Objectives() {
  return (
    <section id="objectives" className="scroll-mt-16 border-t border-line py-24 md:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className={h2}>Objectives.</h2>
          <p className="mt-6 max-w-sm leading-relaxed text-ink-2">What Timar has to do to count as done, across both phases of the project.</p>
        </div>
        <ol className="divide-y divide-line border-y border-line">
          {OBJECTIVES.map(([title, body], i) => (
            <motion.li
              key={title}
              initial={{ clipPath: 'inset(0 0 100% 0)' }}
              whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
              viewport={{ once: true, margin: '0px 0px -40px 0px' }}
              transition={{ duration: 0.7, ease }}
              className="group grid grid-cols-[3rem_1fr] gap-4 py-7 sm:grid-cols-[4rem_1fr]"
            >
              <span className="font-mono text-sm text-muted transition-colors duration-300 group-hover:text-leaf">0{i + 1}</span>
              <div>
                <h3 className="font-display text-2xl">{title}</h3>
                <p className="mt-2 max-w-xl leading-relaxed text-ink-2">{body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ team */

const TEAM = ['Aftab Ahmed Samoo', 'Haseeb Mudasir']

function Team() {
  return (
    <section id="team" className="scroll-mt-16 border-t border-line bg-paper-2/60 py-24 md:py-32">
      <div className="container-x">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
          <h2 className={h2}>The team behind the record.</h2>
          <p className="max-w-md leading-relaxed text-ink-2">
            Timar is the final year project of two Computer Science students at SZABIST University, Karachi, built together with Saltwater Marina.
          </p>
        </div>

        <ul className="mt-14 border-t border-ink">
          {TEAM.map((name, i) => (
            <li key={name} className="border-b border-line">
              <div className="grid gap-3 py-8 md:grid-cols-[4rem_1fr] md:items-baseline md:gap-8 md:py-10">
                <span className="font-mono text-sm text-muted">0{i + 1}</span>
                <MaskLines lines={[name]} as="h3" delay={i * 0.1} className="font-display text-[clamp(2.2rem,5.5vw,4.2rem)] leading-[1] tracking-[-0.015em]" />
              </div>
            </li>
          ))}
        </ul>

        <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            ['University', 'SZABIST, Karachi'],
            ['Programme', 'BS Computer Science'],
            ['Project', 'Final year, 2026'],
            ['Partner', 'Saltwater Marina'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1 font-display text-xl leading-tight">{v}</dd>
            </div>
          ))}
        </dl>
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
        transition={{ duration: 1.4, ease }}
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
    <section id="species" className="mt-24 scroll-mt-16 overflow-hidden border-t border-line py-24 md:mt-32 md:py-32">
      <div className="container-x grid gap-8 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <h2 className={h2}>Why the name.</h2>
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

/* --------------------------------------------------------------- closing */

function Closing() {
  return (
    <section className="border-t border-line py-24 md:py-28">
      <div className="container-x grid items-end gap-10 md:grid-cols-[1.4fr_1fr]">
        <h2 className={h2}>Come and plant one with us.</h2>
        <div className="flex flex-wrap gap-3">
          <Button to="/signup" size="lg" arrow>
            Create account
          </Button>
          <Button to="/journal" size="lg" variant="outline">
            Read the journal
          </Button>
        </div>
      </div>
    </section>
  )
}
