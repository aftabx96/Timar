import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import AuthLayout, { StepMarks } from '../components/AuthLayout'
import VerifyCode from '../components/VerifyCode'
import { Button, Field } from '../components/ui'
import { passwordStrength, useAuth, validators } from '../lib/auth'
import { PasswordField } from './Login'

const slide = {
  initial: { x: 28, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -28, opacity: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
}

const strengthText = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColor = ['bg-rust', 'bg-rust', 'bg-silt', 'bg-leaf-2', 'bg-leaf']

export default function Signup() {
  const { signup, verifySignup } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [agree, setAgree] = useState(false)
  const [touched, setTouched] = useState({})
  const [serverErr, setServerErr] = useState({})
  const [busy, setBusy] = useState(false)

  const errors = {
    name: validators.name(form.name),
    email: serverErr.email || validators.email(form.email),
    phone: validators.phone(form.phone),
    password: validators.password(form.password),
    agree: agree ? '' : 'Please accept the terms to continue.',
  }
  const strength = passwordStrength(form.password)

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (serverErr[k]) setServerErr((s) => ({ ...s, [k]: '' }))
  }
  // Validate as the user types once they have left the field once (SRS 3.1, forms).
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const submit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true, password: true, agree: true })
    if (Object.values(errors).some(Boolean)) return
    setBusy(true)
    try {
      await signup(form)
      setStep(1)
    } catch (err) {
      setServerErr({ [err.field || 'form']: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <StepMarks steps={['Your details', 'Verify email', 'Profile']} current={step} />
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div key="details" {...slide}>
            <h1 className="font-display text-[2.4rem] leading-[1.05]">Create your account</h1>
            <p className="mt-3 text-ink-2">
              Already have one?{' '}
              <Link to="/login" className="link-grow pb-0.5 font-medium text-ink">
                Sign in
              </Link>
            </p>

            <form onSubmit={submit} className="mt-8" noValidate>
              <Field label="Full name" autoComplete="name" placeholder="Ayesha Siddiqui" value={form.name} onChange={set('name')} onBlur={blur('name')} error={errors.name} touched={touched.name} />
              <Field
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                onBlur={blur('email')}
                error={errors.email}
                touched={touched.email || !!serverErr.email}
              />
              {serverErr.email ? (
                <p className="-mt-3 mb-3 text-sm">
                  <Link to="/login" className="link-grow pb-0.5 font-medium text-ink">
                    Sign in instead
                  </Link>
                </p>
              ) : null}
              <Field
                label="Phone number"
                type="tel"
                autoComplete="tel"
                placeholder="0300 1234567"
                value={form.phone}
                onChange={set('phone')}
                onBlur={blur('phone')}
                error={errors.phone}
                touched={touched.phone}
                hint="Used for trip day updates only."
              />
              <PasswordField
                label="Password"
                autoComplete="new-password"
                value={form.password}
                onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                onBlur={blur('password')}
                error={errors.password}
                touched={touched.password}
              />
              <div className="mb-5" aria-live="polite">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-paper-2">
                      <motion.div
                        className={`h-full ${strengthColor[strength]}`}
                        initial={false}
                        animate={{ width: form.password && i < Math.max(strength, 1) ? '100%' : '0%' }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted">{form.password ? strengthText[strength] : '8 or more characters, letters and numbers.'}</p>
              </div>

              <label className="mb-1 flex cursor-pointer items-start gap-3 text-sm text-ink-2">
                <span className="relative mt-0.5">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="peer sr-only" />
                  <span className="flex h-5 w-5 items-center justify-center rounded-md border border-ink/40 transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-tide">
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-paper">
                      <motion.path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" initial={false} animate={{ pathLength: agree ? 1 : 0 }} />
                    </svg>
                  </span>
                </span>
                <span>
                  I agree to the terms and to Timar storing the location of photos I upload.
                </span>
              </label>
              <p className="mb-4 min-h-5 text-[0.8rem] text-rust">{touched.agree && errors.agree}</p>

              {serverErr.form ? <p className="mb-3 rounded-xl bg-rust-pale px-4 py-3 text-sm text-rust">{serverErr.form}</p> : null}

              <Button type="submit" className="w-full" loading={busy} arrow>
                Continue
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="verify" {...slide}>
            <VerifyCode
              email={form.email}
              purpose="signup"
              onBack={() => setStep(0)}
              onVerify={async (c) => {
                await verifySignup(form.email, c)
                setTimeout(() => navigate('/setup', { replace: true }), 500)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
