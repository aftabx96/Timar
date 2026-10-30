import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAPPED_SITES, SITES } from '../lib/sites'

/*
  Real satellite map of the coast. Imagery is Sentinel-2 cloudless (EOX), the same satellite family
  the change detection model (M4) will read, so what you see here is what the model sees.
  The map opens on the whole coast, then flies to Kaderu Island the first time it scrolls into view.
*/

const TILES = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg'
const ATTRIBUTION =
  '<a href="https://s2maps.eu" target="_blank" rel="noreferrer">Sentinel-2 cloudless</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2021)'

const statusLabel = { active: 'Planting', base: 'Home base', later: 'Not surveyed yet' }

function pinIcon(site, selected) {
  return L.divIcon({
    className: '',
    iconSize: [0, 0],
    html: `<span class="site-pin site-pin--${site.status}${selected ? ' is-selected' : ''}">
      <span class="site-pin__dot"></span>
      <span class="site-pin__label">${site.name}</span>
    </span>`,
  })
}

export default function SitesMap() {
  const el = useRef(null)
  const map = useRef(null)
  const markers = useRef({})
  const [selected, setSelected] = useState('kaderu')

  // build the map once
  useEffect(() => {
    const m = L.map(el.current, {
      zoomControl: false,
      scrollWheelZoom: false, // the page scrolls, the map does not hijack it
      attributionControl: true,
      maxZoom: 15,
      minZoom: 8,
    })
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    m.attributionControl.setPrefix(false)
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxNativeZoom: 15 }).addTo(m)
    m.fitBounds(L.latLngBounds(MAPPED_SITES.map((s) => [s.lat, s.lng])), { padding: [40, 40] })

    MAPPED_SITES.forEach((s) => {
      markers.current[s.id] = L.marker([s.lat, s.lng], { icon: pinIcon(s, s.id === 'kaderu'), keyboard: false })
        .addTo(m)
        .on('click', () => setSelected(s.id))
    })
    map.current = m

    // first time the map is on screen, travel from the whole coast to Kaderu
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        setTimeout(() => m.flyTo([SITES[0].lat, SITES[0].lng], SITES[0].zoom - 1, { duration: 2.4 }), 500)
      },
      { threshold: 0.5 },
    )
    io.observe(el.current)

    return () => {
      io.disconnect()
      m.remove()
      map.current = null
      markers.current = {}
    }
  }, [])

  const go = (id) => {
    setSelected(id)
    const s = SITES.find((x) => x.id === id)
    if (s.lat !== null) map.current?.flyTo([s.lat, s.lng], s.zoom, { duration: 1.6 })
  }

  // keep pin styling in step with the selection
  useEffect(() => {
    MAPPED_SITES.forEach((s) => markers.current[s.id]?.setIcon(pinIcon(s, s.id === selected)))
  }, [selected])

  const showCoast = () => map.current?.flyToBounds(L.latLngBounds(MAPPED_SITES.map((s) => [s.lat, s.lng])), { padding: [40, 40], duration: 1.6 })
  const site = SITES.find((s) => s.id === selected)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
      <div className="relative overflow-hidden rounded-[24px] bg-ink">
        <div ref={el} className="sites-map h-[420px] w-full sm:h-[520px]" role="region" aria-label="Satellite map of mangrove sites on the Karachi coast" />
        <button
          onClick={showCoast}
          className="absolute left-3 top-3 z-[500] rounded-full bg-paper px-3.5 py-2 text-xs font-medium text-ink transition-transform active:scale-95"
        >
          Whole coast
        </button>
      </div>

      <div className="flex flex-col">
        <ul className="border-t border-ink">
          {SITES.map((s) => {
            const on = s.id === selected
            return (
              <li key={s.id} className="border-b border-line">
                <button onClick={() => go(s.id)} aria-pressed={on} className="group flex w-full items-center gap-3 py-3.5 text-left">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.status === 'active' ? 'bg-leaf' : s.status === 'base' ? 'bg-tide' : 'border border-ink-3'}`}
                  />
                  <span className={`flex-1 font-display text-lg transition-transform duration-300 group-hover:translate-x-1 ${on ? 'text-ink' : 'text-ink-2'}`}>
                    {s.name}
                  </span>
                  <span className="font-mono text-[0.68rem] text-muted">{s.lat === null ? 'No pin yet' : statusLabel[s.status]}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div key={site.id} className="site-detail mt-5 rounded-2xl bg-paper-2 p-5">
          <p className="font-mono text-[0.7rem] text-muted">
            {site.lat === null ? 'Location to be pinned' : `${site.lat.toFixed(4)}°N, ${site.lng.toFixed(4)}°E`}
          </p>
          <p className="mt-1 font-display text-2xl">{site.name}</p>
          <p className={`mt-1 text-sm font-medium ${site.status === 'active' ? 'text-leaf' : 'text-ink-2'}`}>{site.statusText}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{site.note}</p>
        </div>
      </div>
    </div>
  )
}
