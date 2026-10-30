import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { onDevMail } from '../lib/auth'

/*
  Shows the verification emails the mock auth layer "sends", so OTP can be tested
  without a mail service. Remove once the Express API and email provider are wired up.
*/
export default function DevInbox() {
  const [mails, setMails] = useState([])
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    const off = onDevMail((m) => {
      setMails((prev) => [m, ...prev].slice(0, 2))
    })
    return () => {
      off()
    }
  }, [])

  // Codes are only useful on the auth screens, so clear them once the user moves on.
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname !== '/login' && pathname !== '/signup') setMails([])
  }, [pathname])

  useEffect(() => {
    if (!mails.length) return
    const t = setTimeout(() => setMails((prev) => prev.slice(0, -1)), 45000)
    return () => clearTimeout(t)
  }, [mails])

  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(m.code)
      setCopied(m.id)
      setTimeout(() => setCopied(null), 1400)
    } catch {
      /* clipboard blocked, the code is visible anyway */
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {mails.map((m) => (
          <motion.div
            key={m.id}
            layout
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_18px_40px_-18px_rgba(19,41,29,.45)]"
          >
            <div className="flex items-center justify-between border-b border-line/70 bg-paper-2 px-4 py-2">
              <span className="eyebrow">Dev inbox</span>
              <button
                onClick={() => setMails((p) => p.filter((x) => x.id !== m.id))}
                className="text-xs text-muted hover:text-ink"
                aria-label="Dismiss"
              >
                Close
              </button>
            </div>
            <div className="px-4 py-3">
              <p className="truncate text-xs text-muted">To {m.to}</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{m.subject}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-2xl tracking-[0.3em] text-ink">{m.code}</span>
                <button onClick={() => copy(m)} className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper">
                  {copied === m.id ? 'Copied' : 'Copy code'}
                </button>
              </div>
              <p className="mt-2 text-[0.7rem] leading-snug text-muted">No mail service is connected yet, so codes show up here.</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
