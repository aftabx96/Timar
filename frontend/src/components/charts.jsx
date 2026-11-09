import { useRef, useState } from 'react'
import { motion } from 'motion/react'

/*
  Small hand drawn SVG charts. Single series each, so no legends; the card title names the series.
  Every chart has a hover readout, and lines draw themselves the first time they scroll into view.
*/

const ease = [0.22, 1, 0.36, 1]

function nearestIndex(e, el, xs) {
  const r = el.getBoundingClientRect()
  const px = ((e.clientX - r.left) / r.width) * 520
  let best = 0
  xs.forEach((x, i) => {
    if (Math.abs(x - px) < Math.abs(xs[best] - px)) best = i
  })
  return best
}

/* Survival percentage against months since planting. */
export function SurvivalCurve({ data, dark = false, className = '', yMin = 50, xLabel = (x) => `${x}m`, unit = '%' }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)
  const [drawn, setDrawn] = useState(false)
  const W = 520
  const H = 240
  const P = { l: 36, r: 16, t: 14, b: 30 }
  const maxX = Math.max(...data.map((d) => d.x))
  const sx = (x) => P.l + (x / maxX) * (W - P.l - P.r)
  const sy = (y) => P.t + (1 - (y - yMin) / (100 - yMin)) * (H - P.t - P.b)
  const pts = data.map((d) => [sx(d.x), sy(d.y)])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ')
  const area = `${line} L${pts.at(-1)[0]} ${H - P.b} L${pts[0][0]} ${H - P.b} Z`

  const ink = dark ? 'var(--color-paper)' : 'var(--color-ink)'
  const stroke = dark ? '#a8cf86' : 'var(--color-leaf)'
  const grid = dark ? 'rgba(246,243,236,.14)' : 'rgba(19,41,29,.1)'
  const ticks = [yMin, yMin + (100 - yMin) / 2, 100]

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full touch-none"
        onPointerMove={(e) => setHover(nearestIndex(e, ref.current, pts.map((p) => p[0])))}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Survival curve: ${data.map((d) => `${xLabel(d.x)} ${d.y}${unit}`).join(', ')}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={sy(t)} y2={sy(t)} stroke={grid} />
            <text x={P.l - 8} y={sy(t) + 4} textAnchor="end" fontSize="11" className="font-mono" fill={ink} opacity=".6">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {data.map((d) => (
          <text key={d.x} x={sx(d.x)} y={H - 8} textAnchor="middle" fontSize="11" className="font-mono" fill={ink} opacity=".6">
            {xLabel(d.x)}
          </text>
        ))}
        <motion.path
          d={area}
          fill={stroke}
          fillOpacity={dark ? 0.14 : 0.12}
          // wipes in behind the line as it draws, left to right (triggered by the line, which is never clipped)
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: drawn ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
          transition={{ duration: 1.6, ease }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          onViewportEnter={() => setDrawn(true)}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 1.6, ease }}
        />
        {hover !== null ? (
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1={P.t} y2={H - P.b} stroke={ink} strokeOpacity=".35" strokeDasharray="3 3" />
        ) : null}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={hover === i ? 6 : 4}
            fill={dark ? 'var(--color-ink)' : 'var(--color-paper)'}
            stroke={stroke}
            strokeWidth="2"
            style={{ transition: 'r .2s' }}
          />
        ))}
      </svg>
      {hover !== null ? (
        <div
          className={`pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg px-2.5 py-1.5 text-xs shadow-lg ${
            dark ? 'bg-paper text-ink' : 'bg-ink text-paper'
          }`}
          style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100 - 4}%` }}
        >
          <span className="font-mono">{xLabel(data[hover].x)}</span>
          <span className="ml-2 font-medium">
            {data[hover].y}
            {unit}
          </span>
        </div>
      ) : null}
    </div>
  )
}

/* Horizontal bars, one row per item. value is 0 to 100. */
export function BarRows({ items, target, format = (v) => `${v}%`, tone = 'leaf' }) {
  const [hover, setHover] = useState(null)
  const color = { leaf: 'bg-leaf', tide: 'bg-tide', ink: 'bg-ink' }[tone]
  return (
    <ul className="space-y-3.5">
      {items.map((it, i) => (
        <li key={it.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} className="group">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-2">
              <span className="font-mono text-xs text-muted">{it.label}</span>
              {it.sub ? <span className="ml-2">{it.sub}</span> : null}
            </span>
            <span className="shrink-0 font-medium tabular-nums">{format(it.value)}</span>
          </div>
          <div className="relative h-2.5 rounded-full bg-paper-2">
            <motion.div
              className={`h-full rounded-full ${it.warn ? 'bg-silt' : color}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${it.value}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: i * 0.08, ease }}
              style={{ opacity: hover === null || hover === i ? 1 : 0.45 }}
            />
            {target ? (
              <span className="absolute -top-1 h-[18px] w-0.5 rounded bg-ink/60" style={{ left: `${target}%` }} title={`Target ${target}%`} />
            ) : null}
          </div>
          {hover === i && it.note ? <p className="mt-1.5 text-xs text-muted">{it.note}</p> : null}
        </li>
      ))}
    </ul>
  )
}

/* Tide height through a day, with the low water window shaded. Field visits are planned around it. */
export function TideChart({ hours, lowFrom, lowTo, now }) {
  const ref = useRef(null)
  const [hover, setHover] = useState(null)
  const W = 520
  const H = 160
  const P = { l: 10, r: 10, t: 16, b: 26 }
  const max = Math.max(...hours)
  const min = Math.min(...hours)
  const sx = (i) => P.l + (i / (hours.length - 1)) * (W - P.l - P.r)
  const sy = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b)
  const pts = hours.map((v, i) => [sx(i), sy(v)])
  // smooth through the points with simple cubic segments
  const d = pts.reduce((acc, p, i) => {
    if (!i) return `M${p[0]} ${p[1]}`
    const prev = pts[i - 1]
    const mx = (prev[0] + p[0]) / 2
    return `${acc} C${mx} ${prev[1]} ${mx} ${p[1]} ${p[0]} ${p[1]}`
  }, '')

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full touch-none"
        onPointerMove={(e) => setHover(nearestIndex(e, ref.current, pts.map((p) => p[0])))}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Tide height over the day. Low water from ${lowFrom}:00 to ${lowTo}:00.`}
      >
        <rect x={sx(lowFrom)} y={P.t - 6} width={sx(lowTo) - sx(lowFrom)} height={H - P.t - P.b + 6} rx="8" fill="var(--color-leaf-pale)" />
        <text x={(sx(lowFrom) + sx(lowTo)) / 2} y={P.t + 6} textAnchor="middle" fontSize="10.5" className="font-mono" fill="var(--color-leaf)">
          field window
        </text>
        <motion.path
          d={`${d} L${W - P.r} ${H - P.b} L${P.l} ${H - P.b} Z`}
          fill="var(--color-tide)"
          fillOpacity={0.12}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 1.5, ease }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke="var(--color-tide)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease }}
        />
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} x={sx(h)} y={H - 6} textAnchor={h === 0 ? 'start' : h === 23 ? 'end' : 'middle'} fontSize="10.5" className="font-mono" fill="var(--color-muted)">
            {String(h).padStart(2, '0')}:00
          </text>
        ))}
        {now !== undefined ? (
          <g>
            <line x1={sx(now)} x2={sx(now)} y1={P.t - 6} y2={H - P.b} stroke="var(--color-ink)" strokeWidth="1.5" />
            <circle cx={sx(now)} cy={sy(hours[now])} r="5" fill="var(--color-ink)" stroke="var(--color-paper)" strokeWidth="2" />
          </g>
        ) : null}
        {hover !== null ? <circle cx={pts[hover][0]} cy={pts[hover][1]} r="5" fill="var(--color-paper)" stroke="var(--color-tide)" strokeWidth="2" /> : null}
      </svg>
      {hover !== null ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-xs text-paper"
          style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100 - 6}%` }}
        >
          <span className="font-mono">{String(hover).padStart(2, '0')}:00</span>
          <span className="ml-2 font-medium">{hours[hover].toFixed(1)} m</span>
        </div>
      ) : null}
    </div>
  )
}

/* Column chart for counts over time (hours, seedlings, bookings). */
export function Columns({ data, unit = '', highlightLast = true }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.value)) // at least 1, so empty months do not divide by zero
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5 sm:gap-2.5">
        {data.map((d, i) => {
          const isLast = highlightLast && i === data.length - 1
          return (
            <div
              key={d.label}
              className="relative flex h-full flex-1 flex-col justify-end"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              {hover === i ? (
                <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[0.7rem] text-paper">
                  {d.value.toLocaleString()} {unit}
                </span>
              ) : null}
              <motion.div
                className={`w-full rounded-t-[4px] ${isLast ? 'bg-leaf' : hover === i ? 'bg-ink-2' : 'bg-ink-3/45'}`}
                initial={{ height: 0 }}
                whileInView={{ height: `${(d.value / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.05, ease }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center font-mono text-[0.65rem] text-muted">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* Ring meter for a single percentage. */
export function Ring({ value, size = 120, stroke = 10, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-paper-2)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-leaf)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.4, ease }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-3xl leading-none">{value}%</p>
        {label ? <p className="mt-1 text-[0.7rem] text-muted">{label}</p> : null}
      </div>
    </div>
  )
}
