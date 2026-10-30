import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Button, OtpInput } from './ui'
import { resendOtp } from '../lib/auth'

// Step shared by sign up and sign in: enter the 6 digit code sent to an email address.
export default function VerifyCode({ email, purpose, onVerify, onBack, initialCooldown = 30 }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [cooldown, setCooldown] = useState(initialCooldown)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const submit = async (value = code) => {
    if (value.length !== 6 || busy) return
    setBusy(true)
    setError('')
    try {
      await onVerify(value)
      setDone(true)
    } catch (e) {
      setError(e.message)
      setShake((s) => s + 1)
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const change = (v) => {
    setCode(v)
    if (error) setError('')
    if (v.length === 6) submit(v)
  }

  const resend = async () => {
    setNotice('')
    setError('')
    try {
      const r = await resendOtp(email, purpose)
      setCooldown(r.resendIn)
      setNotice('A new code is on its way.')
    } catch (e) {
      setError(e.message)
    }
  }

  const [user, domain] = email.split('@')

  return (
    <div>
      <h1 className="font-display text-[2.4rem] leading-[1.05]">Check your email</h1>
      <p className="mt-3 leading-relaxed text-ink-2">
        We sent a 6 digit code to{' '}
        <span className="font-medium text-ink">
          {user.length > 3 ? `${user.slice(0, 2)}${'•'.repeat(Math.min(user.length - 2, 6))}` : user}@{domain}
        </span>
        . It works for 5 minutes.
      </p>

      <div className="mt-8" key={shake}>
        <OtpInput value={code} onChange={change} error={!!error} disabled={busy || done} />
      </div>
      <div className="mt-3 min-h-6 text-sm" aria-live="polite">
        {error ? <p className="text-rust">{error}</p> : notice ? <p className="text-leaf">{notice}</p> : null}
      </div>

      <Button className="mt-4 w-full" onClick={() => submit()} loading={busy} disabled={code.length !== 6 || done}>
        {done ? (
          <>
            <svg viewBox="0 0 16 16" className="h-4 w-4">
              <motion.path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
            </svg>
            Verified
          </>
        ) : busy ? (
          'Checking'
        ) : (
          'Verify code'
        )}
      </Button>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button onClick={onBack} className="link-grow pb-0.5 text-ink-2">
          Use a different email
        </button>
        {cooldown > 0 ? (
          <span className="font-mono text-xs text-muted">Resend in 0:{String(cooldown).padStart(2, '0')}</span>
        ) : (
          <button onClick={resend} className="link-grow pb-0.5 font-medium text-ink">
            Send a new code
          </button>
        )}
      </div>
    </div>
  )
}
