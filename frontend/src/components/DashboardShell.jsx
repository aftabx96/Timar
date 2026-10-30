import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Avatar, Logo, LogoMark } from './ui'
import { useAuth } from '../lib/auth'

const roleName = {
  visitor: 'Visitor',
  coordinator: 'Field coordinator',
  volunteer: 'Volunteer',
  company: 'Company',
  admin: 'Saltwater Marina',
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

// Small glyphs drawn for the nav. Kept deliberately plain: a shape per area, not an icon set.
const GLYPHS = {
  overview: <path d="M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z" />,
  plots: <path d="M3 6l5-3 4 2 5-2v11l-5 2-4-2-5 3z M8 3v14 M12 5v14" />,
  photos: <path d="M3 5h14v11H3z M3 13l4-4 3 3 2-2 5 5" />,
  trips: <path d="M2 13c3-2 5-2 8 0s5 2 8 0 M5 11V6l5-3 5 3v5" />,
  learn: <path d="M3 4h5c1.5 0 2 1 2 2v10c0-1-.5-2-2-2H3z M17 4h-5c-1.5 0-2 1-2 2v10c0-1 .5-2 2-2h5z" />,
  report: <path d="M5 17V3 M5 4h10l-2 3.5L15 11H5" />,
  tasks: <path d="M4 5h2 M4 10h2 M4 15h2 M9 5h7 M9 10h7 M9 15h7" />,
  hours: <path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M10 6v4l3 2" />,
  portfolio: <path d="M3 7h14v9H3z M7 7V4h6v3" />,
  reports: <path d="M5 3h7l3 3v11H5z M8 10h4 M8 13h4" />,
  people: <path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M2 17c0-3 2-5 5-5s5 2 5 5 M14 9a2.5 2.5 0 1 0 0-5 M15 12c2 .5 3 2 3 5" />,
  alerts: <path d="M10 3l8 14H2z M10 8v4 M10 14.5v.5" />,
  log: <path d="M4 4h12 M4 8h12 M4 12h8 M4 16h6" />,
}

export function Glyph({ name, className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {GLYPHS[name]}
    </svg>
  )
}

export default function DashboardShell({ nav, active, onNavigate, title, subtitle, actions, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menu) return
    const close = (e) => !menuRef.current?.contains(e.target) && setMenu(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [menu])

  // Leave the protected page first, otherwise the route guard sends us to /login.
  const signOut = () => {
    navigate('/')
    logout()
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* sidebar, desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-paper-2/50 px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo to="/" />
        </div>
        <p className="eyebrow mt-8 px-3">{user.role === 'visitor' && user.adopted > 0 ? 'Mangrove adopter' : roleName[user.role]}</p>
        <nav className="mt-3 flex-1">
          <ul className="space-y-0.5">
            {nav.map((n) => {
              const on = active === n.key
              return (
                <li key={n.key}>
                  <button
                    onClick={() => onNavigate(n.key)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] transition-colors ${on ? 'text-paper' : 'text-ink-2 hover:text-ink'}`}
                  >
                    {on ? <motion.span layoutId="side-active" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 36 }} /> : null}
                    <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
                      <Glyph name={n.glyph} />
                    </span>
                    <span className="relative">{n.label}</span>
                    {n.count ? (
                      <span className={`relative ml-auto rounded-full px-2 py-0.5 font-mono text-[0.68rem] ${on ? 'bg-paper/15 text-paper' : 'bg-paper-3 text-ink-2'}`}>{n.count}</span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="rounded-2xl border border-line bg-paper p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.profile?.photo} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <button onClick={signOut} className="mt-3 w-full rounded-lg py-2 text-sm text-ink-2 ring-1 ring-line transition-colors hover:bg-ink hover:text-paper hover:ring-ink">
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        {/* top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-paper">
          <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <LogoMark className="h-8 w-8" />
            </div>
            <p className="hidden font-mono text-xs text-muted lg:block">{today}</p>
            <div className="flex items-center gap-3">
              {actions}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Account menu" className="rounded-full ring-offset-2 ring-offset-paper transition-shadow hover:ring-2 hover:ring-line">
                  <Avatar name={user.name} src={user.profile?.photo} className="h-9 w-9 text-xs" />
                </button>
                <AnimatePresence>
                  {menu ? (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-12 w-60 origin-top-right overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_20px_40px_-20px_rgba(19,41,29,.45)]"
                    >
                      <div className="border-b border-line px-4 py-3">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted">{user.role === 'visitor' && user.adopted > 0 ? 'Mangrove adopter' : roleName[user.role]}</p>
                      </div>
                      <button onClick={() => navigate('/')} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-paper-2">
                        Public site
                      </button>
                      <button onClick={signOut} className="block w-full px-4 py-2.5 text-left text-sm text-rust hover:bg-rust-pale">
                        Sign out
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="px-5 py-8 sm:px-8 lg:py-10">
          <div className="mb-8">
            <p className="font-mono text-xs text-muted lg:hidden">{today}</p>
            <h1 className="mt-1 font-display text-[clamp(1.9rem,3.6vw,2.6rem)] leading-[1.08]">
              {title ?? `${greeting()}, ${user.name.split(' ')[0]}.`}
            </h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-ink-2">{subtitle}</p> : null}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* bottom bar, phones (SRS 3.1: bottom navigation on small screens) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="flex">
          {nav.slice(0, 5).map((n) => {
            const on = active === n.key
            return (
              <li key={n.key} className="flex-1">
                <button onClick={() => onNavigate(n.key)} className={`relative flex w-full flex-col items-center gap-1 py-2.5 text-[0.68rem] ${on ? 'text-ink' : 'text-muted'}`}>
                  {on ? <motion.span layoutId="bottom-active" className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-ink" /> : null}
                  <Glyph name={n.glyph} className="h-5 w-5" />
                  {n.short || n.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

/* ---------- building blocks used by every dashboard ---------- */

export function Panel({ title, meta, action, className = '', children, pad = true }) {
  return (
    <section className={`rounded-[22px] border border-line bg-white/60 ${className}`}>
      {title ? (
        <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div>
            <h2 className="font-medium text-ink">{title}</h2>
            {meta ? <p className="mt-0.5 text-sm text-muted">{meta}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={pad ? 'p-5 sm:p-6' : ''}>{children}</div>
    </section>
  )
}

export function Stat({ label, value, note, tone }) {
  return (
    <div className="rounded-[22px] border border-line bg-white/60 p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 font-display text-[2.1rem] leading-none ${tone === 'rust' ? 'text-rust' : 'text-ink'}`}>{value}</p>
      {note ? <p className="mt-2 text-xs text-muted">{note}</p> : null}
    </div>
  )
}

export function Upcoming({ section }) {
  return (
    <div className="ruled rounded-[22px] border border-dashed border-line px-6 py-16 text-center">
      <p className="eyebrow">Next on the build list</p>
      <p className="mx-auto mt-3 max-w-md font-display text-2xl">{section.label}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{section.plan}</p>
    </div>
  )
}

export function TextButton({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick} className={`link-grow shrink-0 pb-0.5 text-sm font-medium text-ink ${className}`}>
      {children}
    </button>
  )
}
