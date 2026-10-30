import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Logo } from './ui'
import { FIELD_DAY, FIELD_PLACE, PHOTOS, dscName, src, srcSet } from '../lib/fieldPhotos'

// Mangrove facts for the auth screens, each paired with a field photo that shows it.
// Facts follow Saltwater Marina's own material (saltwater-marina.com) and the Timar SRS.
const FACTS = [
  {
    title: 'Four kinds grow here.',
    text: 'Pakistan has four native mangrove species. The grey mangrove, which fishermen call timar, makes up most of the Indus Delta.',
    photo: PHOTOS.bank,
  },
  {
    title: 'They sweat salt.',
    text: 'The grey mangrove pushes extra salt out through glands on its leaves. On a dry day you can see tiny salt crystals on the surface.',
    photo: PHOTOS.creek,
  },
  {
    title: 'Seeds sprout on the tree.',
    text: 'Mangrove propagules start growing while still on the parent tree, then drop, float and root in the mud. Saltwater Marina collects them for its nursery.',
    photo: PHOTOS.propagules,
  },
  {
    title: 'Roots that breathe.',
    text: 'In waterlogged mud there is little air, so the grey mangrove sends up pencil roots that poke out of the mud to breathe.',
    photo: PHOTOS.seedlingStump,
  },
  {
    title: 'A nursery for the catch.',
    text: 'Young fish, shrimp and crabs shelter between the roots. That is why mangroves keep fishing villages like Rehri Goth going.',
    photo: PHOTOS.crab,
  },
  {
    title: 'They hold the coast together.',
    text: 'The tangle of roots slows waves and holds the mud in place, softening storm surges before they reach the shore.',
    photo: PHOTOS.creekBoatTall,
  },
  {
    title: 'Carbon stays in the mud.',
    text: 'Mangroves lock carbon away in their waterlogged soil, where it can stay for a very long time if the trees are left standing.',
    photo: PHOTOS.rows,
  },
  {
    title: 'Easy to lose.',
    text: 'Cutting for firewood, camels browsing young trees and the wash from passing boats all thin the forest. Every plot Timar records is a check on that.',
    photo: PHOTOS.camels,
  },
]

const ease = [0.22, 1, 0.36, 1]
const EVERY_MS = 6500

// Right hand panel on the auth screens: a photo from the field day with a mangrove fact beneath it.
function MangroveFacts() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => setI((v) => (v + 1) % FACTS.length), EVERY_MS)
    return () => clearTimeout(t)
  }, [i, paused])

  const fact = FACTS[i]

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-ink text-paper" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* the photo wipes up over the last one; the text sits on solid green below, never on the photo */}
      <figure className="relative min-h-0 flex-[0_0_56%] overflow-hidden bg-ink-2">
        <AnimatePresence initial={false}>
          <motion.img
            key={fact.photo.file}
            src={src(fact.photo, 800)}
            srcSet={srcSet(fact.photo)}
            sizes="40vw"
            alt={fact.photo.alt}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: fact.photo.focus }}
            initial={{ clipPath: 'inset(100% 0 0 0)', scale: 1.1, zIndex: 1 }}
            animate={{ clipPath: 'inset(0% 0 0 0)', scale: 1, zIndex: 1 }}
            exit={{ zIndex: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 0.8, ease }}
          />
        </AnimatePresence>
        <figcaption className="absolute bottom-3 left-3 z-10 rounded-full bg-ink px-3 py-1.5 font-mono text-[0.68rem] text-paper/85">
          {dscName(fact.photo)} / {FIELD_PLACE}, {FIELD_DAY}
        </figcaption>
      </figure>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-5 p-7 xl:p-10">
        <div>
          <p className="font-mono text-xs text-paper/70">
            Mangrove fact {i + 1} of {FACTS.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ y: 14, clipPath: 'inset(0 0 100% 0)' }}
              animate={{ y: 0, clipPath: 'inset(0 0 -10% 0)' }}
              exit={{ y: -10, clipPath: 'inset(100% 0 0 0)' }}
              transition={{ duration: 0.45, ease }}
            >
              <p className="mt-3 max-w-md font-display text-[clamp(1.6rem,2.4vw,2.2rem)] leading-[1.05]">{fact.title}</p>
              <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-paper/85">{fact.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* one bar per fact: the current one fills while it is on screen; click any to jump */}
        <div className="flex gap-1.5">
          {FACTS.map((f, k) => (
            <button key={f.title} onClick={() => setI(k)} aria-label={`Fact ${k + 1}: ${f.title}`} className="group relative h-6 flex-1">
              <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-paper/20 transition-colors group-hover:bg-paper/35">
                {k < i ? <span className="absolute inset-0 bg-paper/70" /> : null}
                {k === i ? (
                  <motion.span
                    key={`fill-${i}-${paused}`}
                    className="absolute inset-y-0 left-0 bg-leaf-2"
                    initial={{ width: paused ? '100%' : '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: paused ? 0 : EVERY_MS / 1000, ease: 'linear' }}
                  />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(420px,0.85fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16 xl:px-24">
        <Logo />
        <div className="flex flex-1 items-center py-10">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>
        <p className="text-xs text-muted">Timar is run with Saltwater Marina, Karachi.</p>
      </div>
      <div className="hidden p-3 lg:block">
        <div className="sticky top-3 h-[calc(100dvh-1.5rem)] overflow-hidden rounded-[28px]">
          <MangroveFacts />
        </div>
      </div>
    </div>
  )
}

export function StepMarks({ steps, current }) {
  return (
    <ol className="mb-8 flex items-center gap-3" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-3">
          <span className={`flex items-center gap-2 text-xs ${i <= current ? 'text-ink' : 'text-muted'}`}>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[0.68rem] transition-colors duration-300 ${
                i < current ? 'bg-leaf text-paper' : i === current ? 'bg-ink text-paper' : 'bg-paper-2 text-muted'
              }`}
            >
              {i < current ? (
                <svg viewBox="0 0 12 12" className="h-3 w-3">
                  <motion.path
                    d="M2.5 6.2l2.3 2.3 4.7-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                  />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className="hidden font-medium sm:inline">{s}</span>
          </span>
          {i < steps.length - 1 ? <span className={`h-px w-6 ${i < current ? 'bg-leaf' : 'bg-line'}`} /> : null}
        </li>
      ))}
    </ol>
  )
}
