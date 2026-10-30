import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import AuthLayout from '../components/AuthLayout'
import VerifyCode from '../components/VerifyCode'
import { Button, Field } from '../components/ui'
import { roleHome, useAuth, validators } from '../lib/auth'

const slide = {
  initial: { x: 28, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -28, opacity: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
}


export default function Login() {
  const { requestLoginCode, verifyLoginCode, loginWithPassword } = useAuth()
  const navigate = useNavigate()
  const [method, setMethod] = useState('code')
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const emailErr = validators.email(email)
  const passErr = password ? '' : 'Enter your password.'

  const submit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    setFormError('')
    if (emailErr || (method === 'password' && passErr)) return
    setBusy(true)
    try {
      if (method === 'code') {
        await requestLoginCode(email)
        setStep('code')
      } else {
        const u = await loginWithPassword(email, password)
        navigate(roleHome(u), { replace: true })
      }
    } catch (err) {
      if (err.field === 'unverified') setStep('code')
      else setFormError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {step === 'email' ? (
          <motion.div key="email" {...slide}>
            <h1 className="font-display text-[2.4rem] leading-[1.05]">Welcome back</h1>
            <p className="mt-3 text-ink-2">
              New here?{' '}
              <Link to="/signup" className="link-grow pb-0.5 font-medium text-ink">
                Create an account
              </Link>
            </p>

            <div className="mt-8 grid grid-cols-2 rounded-full bg-paper-2 p-1" role="tablist" aria-label="Sign in method">
              {[
                ['code', 'Email code'],
                ['password', 'Password'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={method === key}
                  onClick={() => {
                    setMethod(key)
                    setFormError('')
                  }}
                  className="relative rounded-full py-2.5 text-sm font-medium"
                >
                  {method === key ? (
                    <motion.span layoutId="method-pill" className="absolute inset-0 rounded-full bg-paper shadow-[0_1px_0_rgba(19,41,29,.08),0_4px_14px_-6px_rgba(19,41,29,.3)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                  ) : null}
                  <span className={`relative ${method === key ? 'text-ink' : 'text-muted'}`}>{label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6" noValidate>
              <Field
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                error={emailErr}
                touched={touched.email}
              />
              <AnimatePresence initial={false}>
                {method === 'password' ? (
                  <motion.div
                    key="pw"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <PasswordField
                      value={password}
                      onChange={setPassword}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      error={passErr}
                      touched={touched.password}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {formError ? (
                <motion.p initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-3 rounded-xl bg-rust-pale px-4 py-3 text-sm text-rust" role="alert">
                  {formError}
                </motion.p>
              ) : null}

              <Button type="submit" className="w-full" loading={busy} arrow>
                {method === 'code' ? 'Send me a code' : 'Sign in'}
              </Button>
              <p className="mt-3 text-center text-xs text-muted">
                {method === 'code' ? 'No password needed. We email you a 6 digit code.' : 'Forgot it? Switch to email code to get in.'}
              </p>
            </form>

          </motion.div>
        ) : (
          <motion.div key="code" {...slide}>
            <VerifyCode
              email={email}
              purpose="login"
              onBack={() => setStep('email')}
              onVerify={async (c) => {
                const u = await verifyLoginCode(email, c)
                setTimeout(() => navigate(roleHome(u), { replace: true }), 500)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

export function PasswordField({ value, onChange, onBlur, error, touched, label = 'Password', hint, autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false)
  return (
    <Field
      label={label}
      type={show ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      error={error}
      touched={touched}
      hint={hint}
      right={
        <button type="button" onClick={() => setShow((s) => !s)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:bg-paper-2">
          {show ? 'Hide' : 'Show'}
        </button>
      }
    />
  )
}
