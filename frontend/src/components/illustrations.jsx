import { motion } from 'motion/react'

/*
  A strip of mangrove forest standing in the water. Two kinds of tree, drawn the way they grow:
  Rhizophora on arching stilt roots, and grey mangrove (timar) on a straight trunk with pencil roots
  poking up out of the mud around it. Trunks and roots draw in, then the canopy grows, once on screen.
  The water band is ink coloured so it runs straight into the footer below.
*/
const WATER = 196

// small seeded random so the forest looks the same on every render
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const TREES = [
  { x: 60, h: 120, kind: 'avicennia' },
  { x: 190, h: 168, kind: 'rhizophora' },
  { x: 300, h: 132, kind: 'avicennia' },
  { x: 420, h: 150, kind: 'rhizophora' },
  { x: 560, h: 112, kind: 'avicennia' },
  { x: 690, h: 176, kind: 'rhizophora' },
  { x: 820, h: 128, kind: 'avicennia' },
  { x: 940, h: 156, kind: 'rhizophora' },
  { x: 1070, h: 138, kind: 'avicennia' },
  { x: 1170, h: 104, kind: 'rhizophora' },
]

function buildTree(t, i) {
  const r = rng(i * 97 + 13)
  const top = WATER - t.h
  const lines = []
  const blobs = []

  if (t.kind === 'rhizophora') {
    const knee = WATER - t.h * 0.42
    lines.push(`M${t.x} ${knee} C${t.x - 2} ${knee - t.h * 0.2}, ${t.x + 4} ${top + 36}, ${t.x + 2} ${top + 24}`)
    // stilt roots: leave the trunk at different heights, bow outward, then drop into the water
    for (let k = -3; k <= 3; k++) {
      if (k === 0) continue
      const reach = Math.sign(k) * (16 + Math.abs(k) * 19 + r() * 8)
      const startY = knee + (3 - Math.abs(k)) * 9 + r() * 4
      lines.push(
        `M${t.x} ${startY} C${t.x + reach * 0.55} ${startY - 10 - r() * 6}, ${t.x + reach * 0.98} ${startY + (WATER - startY) * 0.15}, ${t.x + reach} ${WATER}`,
      )
    }
  } else {
    lines.push(`M${t.x} ${WATER} C${t.x + 1} ${WATER - t.h * 0.4}, ${t.x - 3} ${top + 34}, ${t.x} ${top + 16}`)
    lines.push(`M${t.x} ${WATER - t.h * 0.45} C${t.x + 10} ${WATER - t.h * 0.55}, ${t.x + 18} ${top + 40}, ${t.x + 24} ${top + 30}`)
    // pencil roots (pneumatophores) standing in the shallows
    for (let k = 0; k < 9; k++) {
      const px = t.x - 40 + k * 10 + r() * 4
      if (Math.abs(px - t.x) < 6) continue
      const ph = 4 + r() * 7
      lines.push(`M${px} ${WATER} L${px + (r() - 0.5) * 2} ${WATER - ph}`)
    }
  }

  // canopy: a broad, low dome of leaf clumps, wider than tall, flat underneath like a real mangrove crown
  const half = t.kind === 'rhizophora' ? t.h * 0.62 : t.h * 0.5
  const crown = top + 26
  // Two passes: a shaded lower layer first, then lighter clumps on top, so the crown has depth.
  for (const layer of [0, 1]) {
    const count = 12 + Math.round(r() * 5)
    for (let k = 0; k < count; k++) {
      const u = (k / (count - 1)) * 2 - 1 // -1 at the left edge, 1 at the right
      const lift = Math.sqrt(1 - u * u) // dome profile
      blobs.push({
        cx: t.x + u * half * (layer ? 0.85 : 1) + (r() - 0.5) * 10,
        cy: crown - lift * (layer ? 30 : 16) - r() * 8 + (layer ? 0 : 6),
        rx: 11 + r() * 9 + lift * 7,
        ry: 8 + r() * 6,
        tone: layer ? (r() < 0.5 ? 0 : 2) : 1,
      })
    }
  }
  return { lines, blobs }
}

const FOREST = TREES.map(buildTree)
const TONES = ['var(--color-leaf)', 'var(--color-ink-2)', 'var(--color-leaf-2)']

export function MangroveForest({ className = '' }) {
  return (
    <motion.svg
      viewBox="0 0 1200 220"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      aria-hidden="true"
    >
      {FOREST.map((tree, i) => (
        <g key={i}>
          {tree.lines.map((d, k) => (
            <motion.path
              key={k}
              d={d}
              fill="none"
              stroke="var(--color-ink)"
              strokeWidth={k === 0 ? 3.4 : 1.6}
              strokeLinecap="round"
              variants={{
                hidden: { pathLength: 0 },
                show: { pathLength: 1, transition: { duration: 1.2, delay: i * 0.08 + k * 0.03, ease: [0.22, 1, 0.36, 1] } },
              }}
            />
          ))}
          {tree.blobs.map((b, k) => (
            <motion.ellipse
              key={`b${k}`}
              cx={b.cx}
              cy={b.cy}
              rx={b.rx}
              ry={b.ry}
              fill={TONES[b.tone]}
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              variants={{
                hidden: { scale: 0 },
                show: { scale: 1, transition: { type: 'spring', stiffness: 220, damping: 18, delay: 0.7 + i * 0.08 + k * 0.025 } },
              }}
            />
          ))}
        </g>
      ))}
      <path
        d={`M0 ${WATER} Q 50 ${WATER - 4} 100 ${WATER} T 200 ${WATER} T 300 ${WATER} T 400 ${WATER} T 500 ${WATER} T 600 ${WATER} T 700 ${WATER} T 800 ${WATER} T 900 ${WATER} T 1000 ${WATER} T 1100 ${WATER} T 1200 ${WATER} V 220 H 0 Z`}
        fill="var(--color-ink)"
      />
    </motion.svg>
  )
}

/*
  Drawn stand ins for field photos until real survey images exist.
  stage 0 is a fresh propagule, stage 3 a six month sapling, stage 4 a future visit.
*/
export function Seedling({ stage = 0, className = '' }) {
  const future = stage >= 4
  const height = [18, 30, 42, 56, 66][stage]
  const leaves = [1, 2, 4, 6, 7][stage]
  const baseY = 92
  const topY = baseY - height
  const pairs = Array.from({ length: Math.ceil(leaves / 2) }, (_, i) => i)

  return (
    <svg viewBox="0 0 160 120" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="120" fill="#dbe7ec" />
      <rect y="86" width="160" height="34" fill="#c8b597" />
      <path d="M0 86 Q 20 82 40 86 T 80 86 T 120 86 T 160 86 V 94 H0 Z" fill="#a9c6d3" opacity=".7" />
      {/* survey stake, same spot in every photo */}
      <rect x="122" y="56" width="3" height="38" fill="#7a6040" />
      <rect x="120" y="54" width="7" height="5" fill="#b4532a" />
      {/* neighbouring pencil roots */}
      {[18, 30, 44, 100, 140].map((x, i) => (
        <rect key={x} x={x} y={88 - (i % 2 ? 5 : 3)} width="1.6" height={i % 2 ? 6 : 4} fill="#6f5a3c" />
      ))}
      <g opacity={future ? 0.35 : 1} strokeDasharray={future ? '3 3' : undefined}>
        <path d={`M78 ${baseY} C 79 ${baseY - height * 0.5}, 81 ${topY + 8}, 80 ${topY}`} stroke="#4a5a3a" strokeWidth={2 + stage * 0.4} fill="none" strokeLinecap="round" />
        {pairs.map((i) => {
          const y = topY + 6 + i * 9
          const s = 1 - i * 0.12
          return (
            <g key={i} fill={future ? 'none' : i % 2 ? '#74a554' : '#3f7a34'} stroke={future ? '#3f7a34' : 'none'}>
              <path d={`M80 ${y} c -6 -${7 * s} -16 -${7 * s} -${20 * s} -${2 * s} c 6 ${5 * s} 14 ${6 * s} ${20 * s} ${2 * s} z`} />
              {i * 2 + 1 < leaves ? <path d={`M80 ${y} c 6 -${7 * s} 16 -${7 * s} ${20 * s} -${2 * s} c -6 ${5 * s} -14 ${6 * s} -${20 * s} ${2 * s} z`} /> : null}
            </g>
          )
        })}
      </g>
      {future ? (
        <text x="80" y="58" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#4b6b57">
          next visit
        </text>
      ) : null}
    </svg>
  )
}
