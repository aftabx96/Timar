import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Panel } from '../DashboardShell'
import { Pill, Spinner } from '../ui'
import { api, formatDate } from '../../lib/api'
import { plotSite } from '../../lib/adoptions'

/*
  Admin: every adoption. Staff record payments and give each paid adoption the plot it was
  planted in. A visitor becomes an adopter once one of their adoptions is marked paid.
*/

const FILTERS = [
  ['all', 'All', () => true],
  ['pending', 'Waiting for payment', (a) => a.status === 'pending'],
  ['needs-plot', 'Needs a plot', (a) => a.status === 'paid' && !a.plot],
  ['planted', 'Planted', (a) => a.status === 'paid' && a.plot],
]

const STATUS = { paid: ['leaf', 'Paid'], pending: ['muted', 'Waiting for payment'], refunded: ['rust', 'Refunded'] }

export default function AdoptionsManager({ start = 'all', onChanged }) {
  const [adoptions, setAdoptions] = useState(null)
  const [filter, setFilter] = useState(start)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setAdoptions((await api('GET', '/admin/adoptions')).adoptions)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const changed = () => {
    load()
    onChanged?.()
  }

  const shown = adoptions?.filter(FILTERS.find((f) => f[0] === filter)[2]) ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-[22px] bg-paper-2 p-1 sm:inline-flex sm:rounded-full" role="tablist" aria-label="Show adoptions">
        {FILTERS.map(([k, label, test]) => (
          <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className="relative rounded-full px-4 py-2 text-sm font-medium">
            {filter === k ? <motion.span layoutId="adoption-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} /> : null}
            <span className={`relative ${filter === k ? 'text-paper' : 'text-ink-2'}`}>
              {label} {adoptions ? <span className="ml-1 font-mono text-xs opacity-70">{adoptions.filter(test).length}</span> : null}
            </span>
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-rust">{error}</p> : null}

      <Panel pad={false}>
        {!adoptions ? (
          <div className="flex justify-center py-16 text-ink-3">
            <Spinner className="h-6 w-6" />
          </div>
        ) : shown.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-muted">Nothing here.</p>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {shown.map((a) => (
                <motion.li key={a.id} layout exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <AdoptionRow a={a} onChanged={changed} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Panel>
    </div>
  )
}

function AdoptionRow({ a, onChanged }) {
  const [plot, setPlot] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const markPaid = () => run(() => api('POST', `/admin/adoptions/${a.id}/paid`))
  const savePlot = (e) => {
    e.preventDefault()
    run(() => api('PUT', `/admin/adoptions/${a.id}/plot`, { plot }))
  }

  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[1.4fr_0.7fr_1fr_16rem] sm:items-center sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {a.user.name}
          {a.user.role === 'company' ? <span className="ml-2 font-mono text-[0.68rem] text-muted">company</span> : null}
        </p>
        <p className="truncate text-xs text-muted">
          {a.user.email} / {formatDate(a.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div>
        <p className="text-sm tabular-nums">{a.quantity.toLocaleString()} mangroves</p>
        <p className="text-xs tabular-nums text-muted">Rs. {a.amount.toLocaleString()}</p>
      </div>
      <div className="text-sm">
        {a.plot ? (
          <span>
            <span className="font-mono text-xs">{a.plot}</span> <span className="text-muted">{plotSite(a.plot)}</span>
          </span>
        ) : a.status === 'paid' ? (
          <form onSubmit={savePlot} className="flex gap-2">
            <input
              value={plot}
              onChange={(e) => setPlot(e.target.value)}
              placeholder="KD-014"
              aria-label={`Plot for ${a.user.name}'s adoption`}
              className="h-9 w-24 rounded-lg border border-line bg-white px-2.5 font-mono text-xs uppercase outline-none focus:border-ink"
            />
            <button disabled={busy || !plot.trim()} className="h-9 rounded-full bg-ink px-3.5 text-xs text-paper transition-colors hover:bg-leaf disabled:opacity-50">
              Save plot
            </button>
          </form>
        ) : (
          <span className="text-muted">Plot after payment</span>
        )}
        {error ? <p className="mt-1 text-xs text-rust">{error}</p> : null}
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        {a.status === 'pending' ? (
          <button onClick={markPaid} disabled={busy} className="h-9 rounded-full px-3.5 text-xs text-ink ring-1 ring-line transition-colors hover:bg-leaf hover:text-paper hover:ring-leaf disabled:opacity-50">
            Mark as paid
          </button>
        ) : null}
        <Pill tone={STATUS[a.status][0]}>{STATUS[a.status][1]}</Pill>
      </div>
    </div>
  )
}
