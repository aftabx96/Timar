import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import COAST from '../lib/coastShapes'
import { SITES } from '../lib/sites'

/*
  Drawn map of where Saltwater Marina's drives go: the Rehri Goth shore, Kaderu Island and Buddo Island.
  Shapes are the real coastline and mangrove cover from OpenStreetMap (see scripts/build-coast.cjs),
  redrawn in the site's own style. Plot boundaries and survival figures come later, with the plot registry.
*/

const W = COAST.width
const H = COAST.height
const [RX, RY] = COAST.sites.rehri
const [KX, KY] = COAST.sites.kaderu

// the boat's way out: west along the shore, round the big island, down to the tip of Kaderu
const ROUTE = `M${RX} ${RY} C285 97 250 100 232 118 C214 140 222 170 240 190 C258 210 300 222 330 248 C345 262 355 274 ${KX} ${KY}`

const PINS = [
  { id: 'rehri', label: 'Rehri Goth', at: COAST.sites.rehri, dx: 12, dy: -10, kind: 'base' },
  { id: 'kaderu', label: 'Kaderu Island', at: COAST.sites.kaderu, dx: 14, dy: 22, kind: 'main' },
  { id: 'buddo', label: 'Buddo Island', at: COAST.sites.buddo, dx: 12, dy: -12, kind: 'site' },
]

const ease = [0.22, 1, 0.36, 1]

export default function CreekMap({ className = '' }) {
  const [active, setActive] = useState(1)
  const [pinned, setPinned] = useState(false)

  // cycle through the three places until someone picks one
  useEffect(() => {
    if (pinned) return
    const t = setInterval(() => setActive((a) => (a + 1) % PINS.length), 4200)
    return () => clearInterval(t)
  }, [pinned])

  const pin = PINS[active]
  const site = SITES.find((s) => s.id === pin.id)
  const pick = (i) => {
    setActive(i)
    setPinned(true)
  }

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-ink/10 bg-tide-pale ${className}`}>
      <div className="flex items-center justify-between border-b border-ink/10 bg-paper/80 px-4 py-2.5">
        <span className="eyebrow !text-ink-2">Where the drives go</span>
        <span className="font-mono text-[0.7rem] text-muted">
          {site.lat.toFixed(3)}°N {site.lng.toFixed(3)}°E
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Map of Rehri Goth, Kaderu Island and Buddo Island with the boat route">
        <defs>
          <pattern id="mangrove" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
            <rect width="9" height="9" fill="#bcd6a5" />
            <circle cx="2.5" cy="2.5" r="1.7" fill="#74a554" />
            <circle cx="7" cy="6.5" r="1.3" fill="#3f7a34" />
          </pattern>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-ink)" strokeOpacity=".12" strokeWidth="2" />
          </pattern>
        </defs>

        {/* faint graticule */}
        {[100, 200, 300, 400, 500].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2={H} stroke="var(--color-ink)" strokeOpacity=".05" />
        ))}
        {[100, 200, 300, 400, 500, 600].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2={W} y2={y} stroke="var(--color-ink)" strokeOpacity=".05" />
        ))}

        {/* Karachi shore and the small sand islands */}
        {COAST.land.map((d, i) => (
          <g key={`l${i}`}>
            <path d={d} fill="var(--color-paper-3)" />
            <path d={d} fill="url(#hatch)" />
          </g>
        ))}
        {COAST.islands.map((d, i) => (
          <path key={`i${i}`} d={d} fill="var(--color-paper)" />
        ))}

        {/* mangrove cover; the outlines draw themselves in */}
        {COAST.mangrove.map((d, i) => (
          <motion.path
            key={`m${i}`}
            d={d}
            fill="url(#mangrove)"
            stroke="var(--color-leaf)"
            strokeWidth="1.2"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, delay: i * 0.06, ease }}
          />
        ))}

        <text x="22" y="40" className="font-mono" fontSize="11" fill="var(--color-muted)" letterSpacing="1.5">
          KARACHI
        </text>

        {/* boat route and the boat on it */}
        <path id="boat-route" d={ROUTE} fill="none" stroke="var(--color-ink)" strokeWidth="1.5" strokeDasharray="4 5" opacity=".6" />
        <circle r="5" fill="var(--color-rust)" stroke="var(--color-paper)" strokeWidth="2">
          <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear">
            <mpath href="#boat-route" />
          </animateMotion>
        </circle>

        {/* places */}
        {PINS.map((p, i) => {
          const on = i === active
          const [x, y] = p.at
          return (
            <g key={p.id} onMouseEnter={() => pick(i)} onClick={() => pick(i)} className="cursor-pointer">
              <circle cx={x} cy={y} r="16" fill="transparent" />
              {p.kind === 'main' ? (
                <motion.circle
                  key={`ripple-${on}`}
                  cx={x}
                  cy={y}
                  fill="none"
                  stroke="var(--color-leaf)"
                  strokeWidth="2"
                  initial={{ r: 6, opacity: 0.9 }}
                  animate={{ r: 24, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                />
              ) : null}
              <circle
                cx={x}
                cy={y}
                r={on ? 7 : 5.5}
                fill={p.kind === 'main' ? 'var(--color-leaf-2)' : p.kind === 'base' ? 'var(--color-paper)' : 'var(--color-paper)'}
                stroke="var(--color-ink)"
                strokeWidth="2.5"
                style={{ transition: 'r .25s' }}
              />
              <g transform={`translate(${x + p.dx} ${y + p.dy})`}>
                <rect
                  x="-4"
                  y="-12"
                  width={p.label.length * 7 + 10}
                  height="18"
                  rx="9"
                  fill={on ? 'var(--color-ink)' : 'var(--color-paper)'}
                  style={{ transition: 'fill .25s' }}
                />
                <text x="2" y="1" fontSize="11.5" fontWeight="500" fill={on ? 'var(--color-paper)' : 'var(--color-ink)'} style={{ transition: 'fill .25s' }}>
                  {p.label}
                </text>
              </g>
            </g>
          )
        })}

        {/* compass and scale, the scale measured from the real projection */}
        <g transform={`translate(${W - 36} 140)`}>
          <circle r="17" fill="var(--color-paper)" stroke="var(--color-ink)" strokeOpacity=".2" />
          <path d="M0 -12 L4 2 L0 -1 L-4 2 Z" fill="var(--color-ink)" />
          <text y="13" textAnchor="middle" fontSize="8" className="font-mono" fill="var(--color-ink)">
            N
          </text>
        </g>
        <g transform={`translate(24 ${H - 24})`}>
          <rect width={COAST.kmPx} height="4" fill="var(--color-ink)" />
          <rect x={COAST.kmPx} width={COAST.kmPx} height="4" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth=".8" />
          <text y="-6" fontSize="8.5" className="font-mono" fill="var(--color-ink)">
            0
          </text>
          <text x={COAST.kmPx * 2 - 12} y="-6" fontSize="8.5" className="font-mono" fill="var(--color-ink)">
            2 km
          </text>
        </g>
        <text x={W - 8} y={H - 8} textAnchor="end" fontSize="8" className="font-mono" fill="var(--color-muted)">
          Shapes © OpenStreetMap contributors
        </text>
      </svg>

      {/* what happens at the highlighted place */}
      <div className="border-t border-ink/10 bg-paper px-4 py-3.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={pin.id}
            initial={{ y: 10, clipPath: 'inset(100% 0 0 0)' }}
            animate={{ y: 0, clipPath: 'inset(0% 0 0 0)' }}
            exit={{ y: -10, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.35, ease }}
          >
            <p className="text-sm font-medium text-ink">{pin.label}</p>
            <p className={`mt-0.5 text-xs ${pin.kind === 'main' ? 'text-leaf' : 'text-muted'}`}>{site.statusText}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 flex gap-1" aria-hidden="true">
          {PINS.map((p, i) => (
            <button key={p.id} tabIndex={-1} onClick={() => pick(i)} className="relative h-1 flex-1 overflow-hidden rounded-full bg-paper-3">
              {i === active ? (
                <motion.span
                  key={`bar-${active}-${pinned}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-ink"
                  initial={{ width: pinned ? '100%' : '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: pinned ? 0 : 4.2, ease: 'linear' }}
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
