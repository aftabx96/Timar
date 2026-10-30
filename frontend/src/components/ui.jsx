import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, motion, useInView, useReducedMotion } from 'motion/react'

/* ---------- brand ---------- */

export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M19 30c.4-7 2.4-12.6 7-17" stroke="var(--color-ink)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M21 20.5c-5-.6-8.6-3.6-9.3-8 4.4.3 8.4 3 9.3 8z" fill="var(--color-leaf)" />
      <path d="M25.4 14.6c.6-3.4 3-5.6 6.2-6-.3 3.3-2.5 5.6-6.2 6z" fill="var(--color-leaf-2)" />
      <path d="M23.6 17.3c3 .2 5.4-.9 6.8-3.2-2.8-.4-5.3.7-6.8 3.2z" fill="var(--color-leaf)" />
      <path d="M8 31c3.7-2 7.4-2 11.1 0s7.4 2 11.1 0" stroke="var(--color-tide)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M11 35c2.7-1.3 5.4-1.3 8 0s5.4 1.3 8 0" stroke="var(--color-tide)" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".6" />
    </svg>
  )
}

export function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2" aria-label="Timar home">
      <span className="transition-transform duration-500 ease-[var(--ease-tide)] group-hover:-rotate-6">
        <LogoMark />
      </span>
      <span className={`font-display text-[1.6rem] leading-none tracking-tight ${light ? 'text-paper' : 'text-ink'}`}>Timar</span>
    </Link>
  )
}

/* ---------- buttons ----------
   Hover does not fade. A second colour wipes in from the left and the arrow steps forward. */

const variants = {
  primary: 'bg-ink text-paper',
  leaf: 'bg-leaf text-paper',
  outline: 'bg-transparent text-ink ring-1 ring-inset ring-ink/80',
  light: 'bg-paper text-ink',
}
const wipe = {
  primary: 'bg-leaf',
  leaf: 'bg-ink',
  outline: 'bg-ink',
  light: 'bg-leaf-pale',
}
const wipeText = {
  primary: '',
  leaf: '',
  outline: 'group-hover/btn:text-paper',
  light: '',
}

export const Button = forwardRef(function Button(
  { as, to, variant = 'primary', arrow = false, loading = false, className = '', children, size = 'md', ...props },
  ref,
) {
  const Comp = to ? Link : as || 'button'
  const sizing = size === 'sm' ? 'h-9 px-4 text-sm' : size === 'lg' ? 'h-14 px-7 text-base' : 'h-12 px-6 text-[0.95rem]'
  return (
    <Comp
      ref={ref}
      to={to}
      className={`group/btn relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-medium transition-transform duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 ${sizing} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-[var(--ease-tide)] group-hover/btn:scale-x-100 ${wipe[variant]}`}
      />
      <span className={`relative inline-flex items-center gap-2 transition-colors duration-300 ${wipeText[variant]}`}>
        {loading ? <Spinner /> : null}
        {children}
        {arrow && !loading ? <Arrow className="transition-transform duration-500 ease-[var(--ease-tide)] group-hover/btn:translate-x-1" /> : null}
      </span>
    </Comp>
  )
})

export function Arrow({ className = '' }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 ${className}`} aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} animate-spin`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/* ---------- form field ---------- */

export function Field({ label, error, hint, touched, className = '', right, ...props }) {
  const id = useId()
  const showError = touched && error
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={`${id}-msg`}
          className={`peer h-12 w-full rounded-xl border bg-white/70 px-4 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted/70 focus:bg-white ${
            showError
              ? 'border-rust focus:shadow-[0_0_0_4px_var(--color-rust-pale)]'
              : 'border-line focus:border-ink focus:shadow-[0_0_0_4px_var(--color-tide-pale)]'
          } ${right ? 'pr-20' : ''}`}
          {...props}
        />
        {right ? <div className="absolute inset-y-0 right-2 flex items-center">{right}</div> : null}
      </div>
      <div id={`${id}-msg`} className="min-h-[1.375rem] pt-1 text-[0.8rem]" aria-live="polite">
        {showError ? (
          <motion.p initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-rust">
            {error}
          </motion.p>
        ) : hint ? (
          <p className="text-muted">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}

/* ---------- 6 digit code input ---------- */

export function OtpInput({ value, onChange, length = 6, error = false, disabled = false, autoFocus = true }) {
  const refs = useRef([])
  const digits = value.padEnd(length, ' ').slice(0, length).split('')

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const setAt = (i, d) => {
    const next = digits.slice()
    next[i] = d
    onChange(next.join('').replace(/\s+$/, '').replace(/\s/g, ''))
  }

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i] !== ' ') setAt(i, ' ')
      else if (i > 0) {
        setAt(i - 1, ' ')
        refs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handleInput = (i, e) => {
    const d = e.target.value.replace(/\D/g, '')
    if (!d) return
    if (d.length > 1) {
      onChange(d.slice(0, length))
      refs.current[Math.min(d.length, length) - 1]?.focus()
      return
    }
    setAt(i, d)
    if (i < length - 1) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!d) return
    e.preventDefault()
    onChange(d)
    refs.current[Math.min(d.length, length) - 1]?.focus()
  }

  return (
    <motion.div
      className="flex gap-2 sm:gap-3"
      animate={error ? { x: [0, -10, 9, -6, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.45 }}
      role="group"
      aria-label="Verification code"
    >
      {digits.map((d, i) => {
        const filled = d !== ' '
        return (
          <div key={i} className="relative">
            <input
              ref={(el) => (refs.current[i] = el)}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1}`}
              maxLength={length}
              disabled={disabled}
              value={filled ? d : ''}
              onChange={(e) => handleInput(i, e)}
              onKeyDown={(e) => handleKey(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={`peer h-14 w-11 rounded-xl border bg-white/80 text-center font-mono text-2xl text-ink caret-transparent outline-none transition-[border-color,transform] duration-200 focus:-translate-y-0.5 focus:border-ink sm:h-16 sm:w-13 ${
                error ? 'border-rust' : filled ? 'border-ink-3' : 'border-line'
              }`}
            />
            <motion.span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-3 bottom-2 h-0.5 rounded-full ${error ? 'bg-rust' : 'bg-leaf'}`}
              initial={false}
              animate={{ scaleX: filled ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        )
      })}
    </motion.div>
  )
}

/* ---------- counting number ----------
   Counts up once it is on screen. The number itself moves, nothing fades. */

export function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1.6, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()
  const [val, setVal] = useState(reduce ? to : 0)

  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setVal })
    return () => controls.stop()
  }, [inView, to, duration, reduce])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}

/* ---------- headline that rises line by line out of a mask ---------- */

export function MaskLines({ lines, className = '', delay = 0, as = 'h1' }) {
  const Tag = as
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className="block"
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: delay + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/* ---------- animated tide line ---------- */

export function TideLine({ className = '', color = 'var(--color-tide)', opacity = 0.5, speed = 14 }) {
  const wave = 'M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10 T 250 10 T 300 10 T 350 10 T 400 10'
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <motion.svg
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
        className="h-full w-[200%]"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
      >
        <path d={wave} stroke={color} strokeOpacity={opacity} strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
      </motion.svg>
    </div>
  )
}

/* ---------- status pill ---------- */

const tones = {
  leaf: 'bg-leaf-pale text-leaf',
  tide: 'bg-tide-pale text-tide',
  rust: 'bg-rust-pale text-rust',
  ink: 'bg-ink text-paper',
  muted: 'bg-paper-2 text-muted',
}
export function Pill({ tone = 'muted', children, dot = true }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

export function Avatar({ name = '', className = 'h-10 w-10 text-sm', src }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
  if (src) return <img src={src} alt="" className={`${className} rounded-full object-cover`} />
  return (
    <span className={`${className} inline-flex shrink-0 items-center justify-center rounded-full bg-ink-2 font-medium text-paper`}>
      {initials || 'T'}
    </span>
  )
}
