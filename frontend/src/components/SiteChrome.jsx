import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Button, Logo, LogoMark, TideLine } from './ui'
import { useAuth } from '../lib/auth'
import { SALTWATER_MARINA } from '../lib/sites'

const NAV = [
  { href: '/#how', label: 'How it works' },
  { href: '/#sites', label: 'Sites' },
  { href: '/#take-part', label: 'Take part' },
  { href: '/journal', label: 'Journal' },
]

export function Navbar() {
  const { user } = useAuth()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  // Bar tucks away while scrolling down and returns on the way up.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 12)
    setHidden(y > 240 && y > prev && !open)
  })

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => (document.body.style.overflow = '')
  }, [open])

  return (
    <motion.header
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color] duration-300 ${
        scrolled || open ? 'border-b border-line/80 bg-paper' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between md:h-[72px]">
        <Logo />
        <ul className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="link-grow pb-0.5 text-[0.95rem] text-ink-2 hover:text-ink">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Button to="/dashboard" size="sm" arrow>
              Your dashboard
            </Button>
          ) : (
            <>
              <Link to="/login" className="link-grow px-2 pb-0.5 text-[0.95rem] font-medium text-ink">
                Sign in
              </Link>
              <Button to="/signup" size="sm" arrow>
                Create account
              </Button>
            </>
          )}
        </div>
        <button
          className="relative -mr-2 flex h-11 w-11 items-center justify-center md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          <motion.span animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }} className="absolute h-0.5 w-6 rounded bg-ink" />
          <motion.span animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }} className="absolute h-0.5 w-6 rounded bg-ink" />
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="h-[calc(100dvh-64px)] bg-paper md:hidden"
          >
            <ul className="container-x flex flex-col pt-6">
              {NAV.map((n, i) => (
                <motion.li
                  key={n.href}
                  initial={{ x: -24 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.4 }}
                  className="border-b border-line"
                >
                  <a href={n.href} onClick={() => setOpen(false)} className="block py-4 font-display text-3xl text-ink">
                    {n.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="container-x mt-8 flex flex-col gap-3">
              {user ? (
                <Button to="/dashboard" arrow>
                  Your dashboard
                </Button>
              ) : (
                <>
                  <Button to="/signup" arrow>
                    Create account
                  </Button>
                  <Button to="/login" variant="outline">
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  )
}

export function Footer() {
  return (
    <footer className="relative bg-ink text-paper">
      <TideLine className="h-6" color="var(--color-paper)" opacity={0.25} />
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-paper p-1">
              <LogoMark className="h-7 w-7" />
            </span>
            <span className="font-display text-2xl">Timar</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/75">
            Built with Saltwater Marina to keep an honest record of mangrove restoration along the Karachi coast and the Indus Delta.
          </p>
        </div>
        {[
          ['Take part', [['Adopt a mangrove', '/signup'], ['Bring a group', '/signup'], ['Volunteer', '/signup'], ['Report cutting', '/signup']]],
          ['On this site', [['How it works', '/#how'], ['Sites', '/#sites'], ['Journal', '/journal'], ['Species', '/#species']]],
        ].map(([title, links]) => (
          <div key={title}>
            <p className="eyebrow !text-paper/75">{title}</p>
            <ul className="mt-4 space-y-2.5">
              {links.map(([l, href]) => (
                <li key={l}>
                  <a href={href} className="link-grow pb-0.5 text-sm text-paper/90 hover:text-paper">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {/* Saltwater Marina's public contact details, as published on saltwater-marina.com */}
        <div>
          <p className="eyebrow !text-paper/75">Saltwater Marina</p>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/90">
            <li>
              <a href={SALTWATER_MARINA.website} target="_blank" rel="noreferrer" className="link-grow pb-0.5 hover:text-paper">
                saltwater-marina.com
              </a>
            </li>
            <li>
              <a href={`mailto:${SALTWATER_MARINA.email}`} className="link-grow pb-0.5 hover:text-paper">
                {SALTWATER_MARINA.email}
              </a>
            </li>
            <li>
              <a href={SALTWATER_MARINA.whatsappLink} target="_blank" rel="noreferrer" className="link-grow pb-0.5 hover:text-paper">
                WhatsApp {SALTWATER_MARINA.whatsapp}
              </a>
            </li>
            <li>
              <a href={`https://instagram.com/${SALTWATER_MARINA.instagram}`} target="_blank" rel="noreferrer" className="link-grow pb-0.5 hover:text-paper">
                @{SALTWATER_MARINA.instagram}
              </a>
            </li>
            <li className="text-paper/75">{SALTWATER_MARINA.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/15">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-paper/75 md:flex-row md:items-center md:justify-between">
          <p>A final year project at SZABIST University, Karachi, with Saltwater Marina. 2026.</p>
          <p className="font-mono">Rehri Goth, 24.81°N 67.23°E</p>
        </div>
      </div>
    </footer>
  )
}
