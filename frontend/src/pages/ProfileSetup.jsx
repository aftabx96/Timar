import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Avatar, Button, Field, Logo } from '../components/ui'
import { useAuth } from '../lib/auth'
import { PHOTOS, src } from '../lib/fieldPhotos'

const ROLES = [
  {
    key: 'visitor',
    title: 'Visit, learn and adopt',
    body: 'Book trips and read about mangroves. Adopt one whenever you like; once you pay, you can follow the plot it goes into.',
    gets: 'Trip bookings, articles, adopting mangroves',
    photo: PHOTOS.propagules,
  },
  {
    key: 'volunteer',
    title: 'Volunteer in the field',
    body: 'Join drives and survey visits. Saltwater Marina reviews volunteer requests before field work is assigned.',
    gets: 'Field tasks, hours log, survey tools',
    photo: PHOTOS.wading,
  },
  {
    key: 'company',
    title: 'Run a carbon project as a company',
    body: 'Fund whole plots, plant them with your team and get a checked photo record of every plot for carbon and ESG reporting.',
    gets: 'Portfolio, plot health, reports',
    photo: PHOTOS.rows,
  },
]

const AREAS = ['Rehri Goth', 'Kaderu Island', 'Buddo Island', 'Kairi Creek', 'Ibrahim Hyderi', 'Keti Bandar']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const INTERESTS = ['Adopting mangroves', 'Trips', 'Awareness articles', 'Reporting cutting', 'Community posts']
const INDUSTRIES = ['Manufacturing', 'Banking and finance', 'Telecom', 'Energy', 'Retail', 'Education', 'Other']
const SIZES = ['1 to 50', '51 to 200', '201 to 500', '500+']
const STEPS = ['How you will use Timar', 'A few details', 'Photo and updates', 'Check and finish']

const ease = [0.22, 1, 0.36, 1]

export default function ProfileSetup() {
  const { user, completeProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [data, setData] = useState({
    role: '',
    city: 'Karachi',
    area: '',
    interests: [],
    days: [],
    boat: '',
    emergency: '',
    company: '',
    industry: '',
    size: '',
    designation: '',
    bio: '',
    photo: '',
    notify: { surveys: true, trips: true, news: false },
  })

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }))
  const toggleIn = (k, v) => setData((d) => ({ ...d, [k]: d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v] }))

  const stepErrors = () => {
    if (step === 0) return data.role ? {} : { role: 'Choose one to continue.' }
    if (step === 1) {
      const e = {}
      if (data.role === 'volunteer') {
        if (!data.area) e.area = 'Pick the area closest to you.'
        if (!data.days.length) e.days = 'Pick at least one day.'
        if (!/\d{10,}/.test(data.emergency.replace(/\D/g, ''))) e.emergency = 'Enter a phone number for emergencies.'
      }
      if (data.role === 'company') {
        if (data.company.trim().length < 2) e.company = 'Enter the company name.'
        if (!data.industry) e.industry = 'Choose an industry.'
        if (!data.size) e.size = 'Choose a size.'
      }
      if (data.role === 'visitor' && !data.city.trim()) e.city = 'Enter your city.'
      return e
    }
    return {}
  }
  const errors = stepErrors()

  const go = (n) => {
    setDir(n > step ? 1 : -1)
    setTouched(false)
    setStep(n)
  }
  const next = () => {
    setTouched(true)
    if (Object.keys(errors).length) return
    go(step + 1)
  }

  // Shape expected by PUT /api/me/profile: shared fields plus the answers for the chosen role.
  const detailsFor = {
    visitor: () => ({ city: data.city, interests: data.interests }),
    volunteer: () => ({ area: data.area, days: data.days, emergency: data.emergency, ...(data.boat ? { boat: data.boat } : {}) }),
    company: () => ({ company: data.company, designation: data.designation, industry: data.industry, size: data.size }),
  }

  const finish = async () => {
    setBusy(true)
    setSaveError('')
    try {
      await completeProfile({ role: data.role, bio: data.bio, photo: data.photo, notify: data.notify, details: detailsFor[data.role]() })
      navigate('/dashboard', { replace: true })
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return alert('Please use an image under 2 MB.')
    const reader = new FileReader()
    reader.onload = () => set('photo', reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo />
          <button
            onClick={() => {
              navigate('/')
              logout()
            }}
            className="link-grow pb-0.5 text-sm text-ink-2"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[320px_1fr] lg:gap-20 lg:py-16">
        {/* progress: the seedling grows a pair of leaves per finished step */}
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <div className="flex items-center gap-5 lg:block">
            <GrowingSapling step={step} />
            <div className="lg:mt-8">
              <p className="eyebrow">
                Step {step + 1} of {STEPS.length}
              </p>
              <p className="mt-1 font-display text-2xl lg:hidden">{STEPS[step]}</p>
            </div>
          </div>
          <ol className="mt-6 hidden space-y-1 lg:block">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  disabled={i > step}
                  onClick={() => go(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    i === step ? 'bg-paper-2 font-medium text-ink' : i < step ? 'text-ink-2 hover:bg-paper-2/70' : 'text-muted'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${i < step ? 'bg-leaf' : i === step ? 'bg-ink' : 'bg-line'}`} />
                  {s}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <main className="max-w-2xl">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.section
              key={step}
              custom={dir}
              initial={{ x: dir * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir * -40, opacity: 0 }}
              transition={{ duration: 0.4, ease }}
            >
              {step === 0 ? (
                <>
                  <Heading title={`Hello ${user?.name?.split(' ')[0] || ''}. How will you use Timar?`} sub="You can change this later from your profile. Coordinator and admin accounts are created by Saltwater Marina." />
                  <div className="mt-8 space-y-3" role="radiogroup" aria-label="Account type">
                    {ROLES.map((r) => {
                      const on = data.role === r.key
                      return (
                        <button
                          key={r.key}
                          role="radio"
                          aria-checked={on}
                          onClick={() => set('role', r.key)}
                          className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-[border-color,transform] duration-300 hover:-translate-y-0.5 sm:p-6 ${
                            on ? 'border-ink' : 'border-line hover:border-ink/50'
                          }`}
                        >
                          {on ? <motion.span layoutId="role-bg" className="absolute inset-0 bg-paper-2" transition={{ type: 'spring', stiffness: 380, damping: 34 }} /> : null}
                          <div className="relative flex items-start gap-4">
                            <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-ink' : 'border-line'}`}>
                              <motion.span className="h-2.5 w-2.5 rounded-full bg-ink" initial={false} animate={{ scale: on ? 1 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }} />
                            </span>
                            <div className="flex-1">
                              <p className="font-display text-xl">{r.title}</p>
                              <p className="mt-1 text-sm leading-relaxed text-ink-2">{r.body}</p>
                              <p className="mt-3 font-mono text-xs text-muted">{r.gets}</p>
                            </div>
                            <img
                              src={src(r.photo, 800)}
                              alt=""
                              loading="lazy"
                              className={`hidden h-24 w-24 shrink-0 rounded-xl object-cover transition-[transform,filter] duration-500 sm:block ${on ? 'scale-100 grayscale-0' : 'scale-95 grayscale-[60%]'}`}
                              style={{ objectPosition: r.photo.focus }}
                            />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {touched && errors.role ? <p className="mt-3 text-sm text-rust">{errors.role}</p> : null}
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <Heading
                    title={data.role === 'company' ? 'About the company' : data.role === 'volunteer' ? 'When and where you can help' : 'Where you are'}
                    sub={
                      data.role === 'volunteer'
                        ? 'Coordinators use this to put you on visits near you, on days you are free.'
                        : data.role === 'company'
                          ? 'This shows on your portfolio and on the impact reports we generate.'
                          : 'So we can suggest trips and plots close to you.'
                    }
                  />
                  <div className="mt-8">
                    {data.role === 'visitor' ? (
                      <>
                        <Field label="City" value={data.city} onChange={(e) => set('city', e.target.value)} error={errors.city} touched={touched} />
                        <ChipGroup label="What are you interested in?" options={INTERESTS} value={data.interests} onToggle={(v) => toggleIn('interests', v)} />
                      </>
                    ) : null}

                    {data.role === 'volunteer' ? (
                      <>
                        <ChipGroup label="Nearest area" options={AREAS} value={data.area ? [data.area] : []} onToggle={(v) => set('area', v)} error={touched && errors.area} />
                        <ChipGroup label="Days you are usually free" options={DAYS} value={data.days} onToggle={(v) => toggleIn('days', v)} error={touched && errors.days} mono />
                        <ChipGroup
                          label="Have you been out on a boat in the creeks before?"
                          options={['Yes', 'No', 'A few times']}
                          value={data.boat ? [data.boat] : []}
                          onToggle={(v) => set('boat', v)}
                        />
                        <Field
                          label="Emergency contact number"
                          type="tel"
                          placeholder="0300 1234567"
                          value={data.emergency}
                          onChange={(e) => set('emergency', e.target.value)}
                          error={errors.emergency}
                          touched={touched}
                          hint="Only shared with the coordinator on the day of a visit."
                        />
                      </>
                    ) : null}

                    {data.role === 'company' ? (
                      <>
                        <Field label="Company name" value={data.company} onChange={(e) => set('company', e.target.value)} error={errors.company} touched={touched} />
                        <Field label="Your designation" placeholder="CSR manager" value={data.designation} onChange={(e) => set('designation', e.target.value)} />
                        <ChipGroup label="Industry" options={INDUSTRIES} value={data.industry ? [data.industry] : []} onToggle={(v) => set('industry', v)} error={touched && errors.industry} />
                        <ChipGroup label="Number of employees" options={SIZES} value={data.size ? [data.size] : []} onToggle={(v) => set('size', v)} error={touched && errors.size} mono />
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <Heading title="A photo and how we reach you" sub="Both are optional. Your photo shows on community posts and on the volunteer roster." />
                  <div className="mt-8 flex items-center gap-5">
                    <motion.div key={data.photo} initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                      <Avatar name={data.role === 'company' && data.company ? data.company : user?.name} src={data.photo} className="h-20 w-20 text-xl" />
                    </motion.div>
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-transform active:scale-95">
                        {data.photo ? 'Change photo' : 'Upload photo'}
                        <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
                      </label>
                      {data.photo ? (
                        <button onClick={() => set('photo', '')} className="rounded-full px-4 py-2 text-sm text-ink-2 ring-1 ring-line">
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-8">
                    <label htmlFor="bio" className="mb-1.5 block text-sm font-medium">
                      A line about you
                    </label>
                    <textarea
                      id="bio"
                      rows={3}
                      maxLength={160}
                      value={data.bio}
                      onChange={(e) => set('bio', e.target.value)}
                      placeholder="Marine biology student, out in the creeks most weekends."
                      className="w-full resize-none rounded-xl border border-line bg-white/70 px-4 py-3 text-[0.95rem] outline-none transition-[border-color,box-shadow] focus:border-ink focus:bg-white focus:shadow-[0_0_0_4px_var(--color-tide-pale)]"
                    />
                    <p className="mt-1 text-right font-mono text-xs text-muted">{data.bio.length}/160</p>
                  </div>

                  <p className="mt-6 text-sm font-medium">Email me about</p>
                  <div className="mt-3 divide-y divide-line rounded-2xl border border-line">
                    {[
                      ['surveys', data.role === 'volunteer' ? 'New field tasks assigned to me' : 'New photos and survey results for my plots'],
                      ['trips', 'Trip confirmations and changes'],
                      ['news', 'Articles and monthly updates'],
                    ].map(([k, label]) => (
                      <Toggle key={k} label={label} on={data.notify[k]} onChange={(v) => set('notify', { ...data.notify, [k]: v })} />
                    ))}
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <Heading title="Check everything looks right" sub="You can edit any of this later from your profile." />
                  <div className="mt-8 overflow-hidden rounded-2xl border border-line">
                    <div className="flex items-center gap-4 bg-paper-2 px-5 py-5">
                      <Avatar name={user?.name} src={data.photo} className="h-14 w-14 text-lg" />
                      <div>
                        <p className="font-display text-xl">{user?.name}</p>
                        <p className="text-sm text-muted">{user?.email}</p>
                      </div>
                    </div>
                    <dl className="divide-y divide-line">
                      <Row k="Account type" v={ROLES.find((r) => r.key === data.role)?.title} onEdit={() => go(0)} />
                      {data.role === 'visitor' ? (
                        <>
                          <Row k="City" v={data.city} onEdit={() => go(1)} />
                          <Row k="Interests" v={data.interests.join(', ') || 'None picked'} onEdit={() => go(1)} />
                        </>
                      ) : null}
                      {data.role === 'volunteer' ? (
                        <>
                          <Row k="Area" v={data.area} onEdit={() => go(1)} />
                          <Row k="Free on" v={data.days.join(', ')} onEdit={() => go(1)} />
                          <Row k="Boat experience" v={data.boat || 'Not answered'} onEdit={() => go(1)} />
                        </>
                      ) : null}
                      {data.role === 'company' ? (
                        <>
                          <Row k="Company" v={data.company} onEdit={() => go(1)} />
                          <Row k="Industry" v={data.industry} onEdit={() => go(1)} />
                          <Row k="Employees" v={data.size} onEdit={() => go(1)} />
                        </>
                      ) : null}
                      <Row k="About" v={data.bio || 'Left blank'} onEdit={() => go(2)} />
                    </dl>
                  </div>
                  {saveError ? (
                    <p className="mt-4 rounded-xl bg-rust-pale px-4 py-3 text-sm text-rust" role="alert">
                      {saveError}
                    </p>
                  ) : null}
                  {data.role === 'volunteer' ? (
                    <p className="mt-4 rounded-xl bg-tide-pale px-4 py-3 text-sm text-ink-2">
                      Your volunteer request goes to Saltwater Marina for review. You can browse trips and tasks while you wait.
                    </p>
                  ) : null}
                </>
              ) : null}
            </motion.section>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
            {step > 0 ? (
              <button onClick={() => go(step - 1)} className="link-grow pb-0.5 text-sm font-medium text-ink-2">
                Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={next} arrow>
                Continue
              </Button>
            ) : (
              <Button variant="leaf" onClick={finish} loading={busy} arrow>
                Go to my dashboard
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Heading({ title, sub }) {
  return (
    <div>
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.08]">{title}</h1>
      <p className="mt-3 max-w-lg leading-relaxed text-ink-2">{sub}</p>
    </div>
  )
}

function ChipGroup({ label, options, value, onToggle, error, mono = false }) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-2.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o)
          return (
            <motion.button
              type="button"
              key={o}
              onClick={() => onToggle(o)}
              whileTap={{ scale: 0.94 }}
              aria-pressed={on}
              className={`relative overflow-hidden rounded-full px-4 py-2 text-sm ring-1 ring-inset transition-colors duration-200 ${mono ? 'font-mono' : ''} ${
                on ? 'text-paper ring-ink' : 'text-ink-2 ring-line hover:ring-ink/50'
              }`}
            >
              <motion.span className="absolute inset-0 bg-ink" initial={false} animate={{ y: on ? '0%' : '101%' }} transition={{ duration: 0.3, ease }} />
              <span className="relative">{o}</span>
            </motion.button>
          )
        })}
      </div>
      {error ? <p className="mt-2 text-[0.8rem] text-rust">{error}</p> : null}
    </fieldset>
  )
}

function Toggle({ label, on, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm">
      <span className="text-ink-2">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? 'bg-leaf' : 'bg-paper-3'}`}
      >
        <motion.span
          className="absolute top-1 h-5 w-5 rounded-full bg-paper shadow"
          initial={false}
          animate={{ left: on ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      </button>
    </label>
  )
}

function Row({ k, v, onEdit }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div>
        <dt className="eyebrow">{k}</dt>
        <dd className="mt-1 text-sm">{v}</dd>
      </div>
      <button onClick={onEdit} className="link-grow pb-0.5 text-sm text-ink-2">
        Edit
      </button>
    </div>
  )
}

function GrowingSapling({ step }) {
  const leaves = [
    'M60 96 c -8 -6 -20 -6 -26 0 c 8 5 18 5 26 0 z',
    'M60 96 c 8 -6 20 -6 26 0 c -8 5 -18 5 -26 0 z',
    'M61 74 c -9 -7 -22 -7 -28 0 c 8 6 20 6 28 0 z',
    'M61 74 c 9 -7 22 -7 28 0 c -8 6 -20 6 -28 0 z',
    'M62 52 c -8 -7 -19 -7 -24 0 c 7 5 17 5 24 0 z',
    'M62 52 c 8 -7 19 -7 24 0 c -7 5 -17 5 -24 0 z',
    'M63 34 c -2 -10 2 -18 8 -20 c 1 8 -2 16 -8 20 z',
  ]
  const shown = [2, 4, 6, 7][step]
  const stemTop = [92, 70, 48, 32][step]
  return (
    <svg viewBox="0 0 120 150" className="h-24 w-20 shrink-0 lg:h-56 lg:w-44" aria-hidden="true">
      <rect x="0" y="122" width="120" height="28" rx="6" fill="var(--color-paper-3)" />
      <path d="M0 124 Q 15 119 30 124 T 60 124 T 90 124 T 120 124" stroke="var(--color-tide)" strokeWidth="1.6" fill="none" />
      <motion.path
        d={`M58 124 C 59 ${124 - (124 - stemTop) * 0.5}, 62 ${stemTop + 10}, 63 ${stemTop}`}
        stroke="var(--color-ink)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={false}
        animate={{ d: `M58 124 C 59 ${124 - (124 - stemTop) * 0.5}, 62 ${stemTop + 10}, 63 ${stemTop}` }}
        transition={{ duration: 0.8, ease }}
      />
      {leaves.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill={i % 2 ? 'var(--color-leaf-2)' : 'var(--color-leaf)'}
          style={{ transformOrigin: i % 2 ? '0% 50%' : '100% 50%', transformBox: 'fill-box' }}
          initial={false}
          animate={{ scale: i < shown ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: i < shown ? 0.25 + (i % 2) * 0.08 : 0 }}
        />
      ))}
    </svg>
  )
}
