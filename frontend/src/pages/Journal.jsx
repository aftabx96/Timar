import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Navbar, Footer } from '../components/SiteChrome'
import { Arrow, Button, MaskLines } from '../components/ui'
import { ApiError, formatDate, get, parseBody } from '../lib/api'

/*
  The Journal: past drives and awareness articles, all managed by Saltwater Marina staff
  from the admin Content screen. Everything here is read from the API, published items only.
*/

const ease = [0.22, 1, 0.36, 1]

// field photos come in two sizes; use the small one in grids
export const thumb = (src) => (src?.endsWith('-1600.webp') ? src.replace('-1600.webp', '-800.webp') : src)

function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  useEffect(() => {
    let live = true
    setState({ data: null, error: null, loading: true })
    get(path)
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((error) => live && setState({ data: null, error, loading: false }))
    return () => {
      live = false
    }
  }, [path])
  return state
}

function Shell({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-32">{children}</main>
      <Footer />
    </>
  )
}

function Problem({ error }) {
  const missing = error instanceof ApiError && error.status === 404
  return (
    <div className="container-x py-24">
      <h1 className="font-display text-4xl">{missing ? 'We could not find that.' : 'Something went wrong.'}</h1>
      <p className="mt-3 text-ink-2">{missing ? 'It may have been taken down, or the link is wrong.' : error.message}</p>
      <Button to="/journal" className="mt-8" arrow>
        Back to the journal
      </Button>
    </div>
  )
}

/*
  Image that uncovers with a wipe once it has loaded, so slow photos never pop in half drawn.
  The wipe is a panel sliding off the image, not a clip on the image itself: browsers skip
  lazy loading an image they think is fully clipped, so it would never arrive.
*/
function Cover({ src, alt = '', className = '', imgClassName = '' }) {
  const [ready, setReady] = useState(false)
  return (
    <div className={`relative overflow-hidden bg-paper-3 ${className}`}>
      {src ? (
        <>
          <motion.img
            src={src}
            alt={alt}
            loading="lazy"
            ref={(el) => el?.complete && el.naturalWidth && !ready && setReady(true)}
            onLoad={() => setReady(true)}
            className={`h-full w-full object-cover ${imgClassName}`}
            initial={{ scale: 1.08 }}
            animate={ready ? { scale: 1 } : {}}
            transition={{ duration: 1.1, ease }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 origin-top bg-paper-3"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: ready ? 0 : 1 }}
            transition={{ duration: 0.8, ease }}
          />
        </>
      ) : null}
    </div>
  )
}

const facts = (d) =>
  [d.site, d.people != null ? `${d.people} people` : null, d.saplings != null ? `${d.saplings.toLocaleString()} planted` : null].filter(Boolean)

/* ---------------------------------------------------------------- index */

export function Journal() {
  const drives = useApi('/drives')
  const [kind, setKind] = useState('all')
  const articles = useApi(kind === 'all' ? '/articles' : `/articles?kind=${kind}`)

  return (
    <Shell>
      <section className="container-x">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
          <MaskLines lines={['From the creeks.']} as="h1" className="font-display text-[clamp(2.6rem,6.5vw,5rem)] leading-[1] tracking-[-0.02em]" />
          <p className="max-w-md text-lg leading-relaxed text-ink-2">
            Every drive Saltwater Marina runs, and what we have learned about the forest along the way.
          </p>
        </div>
      </section>

      {/* drives */}
      <section className="container-x mt-16 md:mt-20">
        <div className="flex items-baseline justify-between border-b border-ink pb-4">
          <h2 className="font-display text-3xl">Past drives</h2>
          {drives.data ? <p className="font-mono text-xs text-muted">{drives.data.drives.length} on record</p> : null}
        </div>
        {drives.loading ? <div className="mt-8 aspect-[16/7] rounded-[24px] bg-paper-2" /> : null}
        {drives.error ? <p className="mt-6 text-rust">{drives.error.message}</p> : null}
        {drives.data?.drives.length === 0 ? <p className="mt-8 text-ink-2">No drives published yet.</p> : null}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {drives.data?.drives.map((d, i) => (
            <Link key={d.id} to={`/journal/drives/${d.id}`} className={`group block ${i === 0 ? 'md:col-span-2' : ''}`}>
              <Cover
                src={i === 0 ? d.photos[0]?.src : thumb(d.photos[0]?.src)}
                alt={d.photos[0]?.caption}
                className={`rounded-[24px] ${i === 0 ? 'aspect-[4/3] md:aspect-[16/7]' : 'aspect-[3/2]'}`}
                imgClassName="transition-transform duration-[1.2s] ease-[var(--ease-tide)] group-hover:scale-105"
              />
              <div className="mt-4 flex items-start justify-between gap-6">
                <div>
                  <p className="font-mono text-xs text-muted">{formatDate(d.date)}</p>
                  <h3 className={`link-grow mt-1 inline pb-0.5 font-display ${i === 0 ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>{d.title}</h3>
                  <p className="mt-2 text-sm text-ink-2">{facts(d).join(' / ')}</p>
                </div>
                <span className="mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-ink transition-transform duration-500 ease-[var(--ease-tide)] group-hover:-rotate-45">
                  <Arrow />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* articles */}
      <section className="container-x mb-24 mt-24 md:mb-32 md:mt-32">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-4">
          <h2 className="font-display text-3xl">Read</h2>
          <div className="inline-flex rounded-full bg-paper-2 p-1" role="tablist" aria-label="Filter">
            {[
              ['all', 'Everything'],
              ['awareness', 'Awareness'],
              ['article', 'Articles'],
            ].map(([k, label]) => (
              <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className="relative rounded-full px-4 py-2 text-sm">
                {kind === k ? <motion.span layoutId="journal-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} /> : null}
                <span className={`relative ${kind === k ? 'text-paper' : 'text-ink-2'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        {articles.error ? <p className="mt-6 text-rust">{articles.error.message}</p> : null}
        {articles.data?.articles.length === 0 ? <p className="mt-8 text-ink-2">Nothing here yet.</p> : null}
        <ul>
          <AnimatePresence initial={false} mode="popLayout">
            {articles.data?.articles.map((a) => (
              <motion.li
                key={a.id}
                layout
                initial={{ clipPath: 'inset(0 0 100% 0)' }}
                animate={{ clipPath: 'inset(0 0 0% 0)' }}
                exit={{ clipPath: 'inset(0 0 100% 0)' }}
                transition={{ duration: 0.4, ease }}
                className="border-b border-line"
              >
                <Link to={`/journal/${a.slug}`} className="group grid grid-cols-[6rem_1fr] items-center gap-5 py-6 sm:grid-cols-[9rem_1fr_auto] sm:gap-8">
                  <Cover src={thumb(a.cover)} className="aspect-[4/3] rounded-xl" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted">
                      {a.kind === 'awareness' ? 'Awareness' : 'Article'} / {a.minutes} min read
                    </p>
                    <h3 className="mt-1 font-display text-xl leading-tight transition-transform duration-500 ease-[var(--ease-tide)] group-hover:translate-x-1 sm:text-2xl">
                      {a.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 max-w-xl text-sm text-ink-2">{a.summary}</p>
                  </div>
                  <span className="hidden h-11 w-11 items-center justify-center rounded-full ring-1 ring-ink transition-transform duration-500 ease-[var(--ease-tide)] group-hover:-rotate-45 sm:flex">
                    <Arrow />
                  </span>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>
    </Shell>
  )
}

/* ---------------------------------------------------------------- one drive */

export function DrivePage() {
  const { id } = useParams()
  const { data, error, loading } = useApi(`/drives/${id}`)
  const [open, setOpen] = useState(null)
  if (error) return <Shell><Problem error={error} /></Shell>
  if (loading) return <Shell><div className="container-x h-[60vh]" /></Shell>
  const d = data.drive

  return (
    <Shell>
      <article className="container-x pb-24 md:pb-32">
        <Link to="/journal" className="link-grow pb-0.5 text-sm text-ink-2">
          Back to the journal
        </Link>
        <p className="mt-8 font-mono text-xs text-muted">{formatDate(d.date)}</p>
        <MaskLines key={d.id} lines={[d.title]} as="h1" className="mt-2 max-w-4xl font-display text-[clamp(2.4rem,5.5vw,4.4rem)] leading-[1.02] tracking-[-0.02em]" />

        <dl className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-4">
          {[
            ['When', formatDate(d.date, { day: 'numeric', month: 'short', year: 'numeric' }), d.startTime && d.endTime ? `${d.startTime} to ${d.endTime}` : ''],
            ['Where', d.site, `by boat from ${d.departedFrom}`],
            ['People', d.people ?? 'Not logged', d.people != null ? 'on the drive' : ''],
            ['Planted', d.saplings != null ? d.saplings.toLocaleString() : 'Not logged', d.saplings != null ? 'saplings' : ''],
          ].map(([k, v, sub]) => (
            <div key={k}>
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1 font-display text-2xl leading-tight">{v}</dd>
              {sub ? <dd className="text-xs text-muted">{sub}</dd> : null}
            </div>
          ))}
        </dl>

        {d.summary ? <p className="mt-10 max-w-2xl text-lg leading-relaxed text-ink-2">{d.summary}</p> : null}

        {/* photos: the first one wide, the rest in a two column grid */}
        <div className="mt-14 grid gap-x-5 gap-y-10 md:grid-cols-2">
          {d.photos.map((ph, i) => (
            <figure key={ph.src + i} className={i === 0 ? 'md:col-span-2' : ''}>
              <motion.button layoutId={`ph-${i}`} onClick={() => setOpen(i)} className="block w-full overflow-hidden rounded-[20px]" aria-label="Open photo">
                <Cover src={i === 0 ? ph.src : thumb(ph.src)} alt={ph.caption} className={i === 0 ? 'aspect-[16/9]' : 'aspect-[3/2]'} />
              </motion.button>
              {ph.caption || ph.time ? (
                <figcaption className="mt-3 text-sm text-ink-2">
                  {ph.caption} {ph.time ? <span className="ml-1 font-mono text-[0.7rem] text-muted">{ph.time}</span> : null}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </article>

      <AnimatePresence>
        {open !== null ? (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-ink/85" onClick={() => setOpen(null)} aria-label="Close photo" />
            <motion.figure layoutId={`ph-${open}`} className="relative w-full max-w-5xl overflow-hidden rounded-[20px] bg-ink">
              <img src={d.photos[open].src} alt={d.photos[open].caption} className="max-h-[78vh] w-full object-contain" />
              <figcaption className="flex items-center justify-between gap-4 px-5 py-4 text-paper">
                <span className="text-sm">
                  {d.photos[open].caption} <span className="ml-1 font-mono text-[0.7rem] text-paper/70">{d.photos[open].time}</span>
                </span>
                <span className="flex gap-2">
                  <button disabled={open === 0} onClick={() => setOpen(open - 1)} className="h-10 w-10 rounded-full ring-1 ring-paper/40 disabled:opacity-30" aria-label="Previous">
                    ←
                  </button>
                  <button disabled={open === d.photos.length - 1} onClick={() => setOpen(open + 1)} className="h-10 w-10 rounded-full ring-1 ring-paper/40 disabled:opacity-30" aria-label="Next">
                    →
                  </button>
                </span>
              </figcaption>
            </motion.figure>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Shell>
  )
}

/* ---------------------------------------------------------------- one article */

export function ArticlePage() {
  const { slug } = useParams()
  const { data, error, loading } = useApi(`/articles/${slug}`)
  const more = useApi('/articles')
  if (error) return <Shell><Problem error={error} /></Shell>
  if (loading) return <Shell><div className="container-x h-[60vh]" /></Shell>
  const a = data.article
  const others = (more.data?.articles ?? []).filter((x) => x.slug !== a.slug).slice(0, 2)

  return (
    <Shell>
      <article className="pb-24 md:pb-32">
        <div className="container-x">
          <Link to="/journal" className="link-grow pb-0.5 text-sm text-ink-2">
            Back to the journal
          </Link>
          <div className="mx-auto mt-10 max-w-3xl">
            <p className="font-mono text-xs text-muted">
              {a.kind === 'awareness' ? 'Awareness' : 'Article'} / {a.minutes} min read
            </p>
            <MaskLines key={a.slug} lines={[a.title]} as="h1" className="mt-3 font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.04] tracking-[-0.02em]" />
            {a.summary ? <p className="mt-6 text-xl leading-relaxed text-ink-2">{a.summary}</p> : null}
          </div>
        </div>
        {a.cover ? (
          <div className="container-x mt-12">
            <Cover src={a.cover} className="aspect-[16/8] rounded-[24px]" />
          </div>
        ) : null}
        <div className="container-x">
          <div className="mx-auto mt-12 max-w-2xl space-y-5 text-[1.075rem] leading-[1.75] text-ink-2">
            {parseBody(a.body).map((b, i) =>
              b.type === 'h' ? (
                <h2 key={i} className="pt-6 font-display text-2xl leading-tight text-ink">
                  {b.text}
                </h2>
              ) : (
                <p key={i}>{b.text}</p>
              ),
            )}
          </div>
        </div>

        {others.length ? (
          <div className="container-x mt-24">
            <p className="border-b border-ink pb-4 font-display text-2xl">Keep reading</p>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {others.map((o) => (
                <Link key={o.id} to={`/journal/${o.slug}`} className="group">
                  <Cover src={thumb(o.cover)} className="aspect-[3/2] rounded-[20px]" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                  <p className="mt-4 font-mono text-xs text-muted">{o.minutes} min read</p>
                  <p className="mt-1 font-display text-2xl leading-tight">{o.title}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </Shell>
  )
}
