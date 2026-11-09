import { useEffect, useState } from 'react'
import { api } from './api'

// Plot codes start with the site they are on: KD-014 is plot 14 on Kaderu Island.
const SITE_OF = { KD: 'Kaderu Island', BU: 'Buddo Island', KR: 'Kairi Creek', RG: 'Rehri Goth' }

export const plotSite = (code) => (code ? (SITE_OF[code.split('-')[0]] ?? 'Saltwater Marina site') : null)

/** The signed in user's adoptions from /api/me/adoptions, newest first. null while loading. */
export function useAdoptions() {
  const [state, setState] = useState({ adoptions: null, error: '' })
  useEffect(() => {
    api('GET', '/me/adoptions')
      .then((d) => setState({ adoptions: d.adoptions, error: '' }))
      .catch((e) => setState({ adoptions: [], error: e.message }))
  }, [])
  return state
}

/** Paid adoptions grouped by plot: [{ plot, site, quantity, amount, since }] with the largest first. */
export function byPlot(adoptions) {
  const plots = new Map()
  for (const a of adoptions.filter((x) => x.status === 'paid' && x.plot)) {
    const p = plots.get(a.plot) ?? { plot: a.plot, site: plotSite(a.plot), quantity: 0, amount: 0, since: a.createdAt }
    p.quantity += a.quantity
    p.amount += a.amount
    if (a.createdAt < p.since) p.since = a.createdAt
    plots.set(a.plot, p)
  }
  return [...plots.values()].sort((a, b) => b.quantity - a.quantity)
}
