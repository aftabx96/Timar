import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button, Field, Pill, Spinner } from '../ui'
import { api, formatDate, uploadImage } from '../../lib/api'
import { PHOTOS, src as photoSrc } from '../../lib/fieldPhotos'
import { SITES } from '../../lib/sites'
import { thumb } from '../../pages/Journal'

/*
  Admin Content screen: create, read, update and delete the Journal's drives and articles.
  Lists show drafts too. The editor slides in from the right on a solid panel.
*/

const ease = [0.22, 1, 0.36, 1]
const today = () => new Date().toISOString().slice(0, 10)

const EMPTY_DRIVE = {
  title: '',
  date: today(),
  startTime: '',
  endTime: '',
  site: 'Kaderu Island',
  departedFrom: 'Rehri Goth',
  people: '',
  saplings: '',
  summary: '',
  photos: [],
  published: false,
}
const EMPTY_ARTICLE = { title: '', slug: '', kind: 'awareness', summary: '', body: '', cover: '', published: false }

export default function ContentManager() {
  const [tab, setTab] = useState('drives')
  const [items, setItems] = useState({ drives: null, articles: null })
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // { kind: 'drive'|'article', value }
  const [confirming, setConfirming] = useState(null)
  const [flash, setFlash] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [d, a] = await Promise.all([api('GET', '/admin/drives'), api('GET', '/admin/articles')])
      setItems({ drives: d.drives, articles: a.articles })
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(''), 3200)
    return () => clearTimeout(t)
  }, [flash])

  const remove = async (kind, item) => {
    try {
      await api('DELETE', `/admin/${kind}s/${item.id}`)
      setConfirming(null)
      setFlash(`Deleted “${item.title}”.`)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const list = tab === 'drives' ? items.drives : items.articles

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-full bg-paper-2 p-1" role="tablist" aria-label="Content type">
          {[
            ['drives', 'Drives', items.drives?.length],
            ['articles', 'Articles', items.articles?.length],
          ].map(([k, label, n]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="relative rounded-full px-5 py-2.5 text-sm font-medium">
              {tab === k ? <motion.span layoutId="content-tab" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} /> : null}
              <span className={`relative ${tab === k ? 'text-paper' : 'text-ink-2'}`}>
                {label} {n != null ? <span className="ml-1 font-mono text-xs opacity-70">{n}</span> : null}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="/journal" target="_blank" rel="noreferrer" className="link-grow pb-0.5 text-sm text-ink-2">
            View the journal
          </a>
          <Button
            size="sm"
            arrow
            onClick={() => setEditing(tab === 'drives' ? { kind: 'drive', value: { ...EMPTY_DRIVE } } : { kind: 'article', value: { ...EMPTY_ARTICLE } })}
          >
            {tab === 'drives' ? 'New drive' : 'New article'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {flash ? (
          <motion.p
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(100% 0 0 0)' }}
            className="mt-5 rounded-xl bg-leaf-pale px-4 py-3 text-sm text-leaf"
          >
            {flash}
          </motion.p>
        ) : null}
      </AnimatePresence>
      {error ? <p className="mt-5 rounded-xl bg-rust-pale px-4 py-3 text-sm text-rust">{error}</p> : null}

      <section className="mt-6 overflow-hidden rounded-[22px] border border-line bg-white/60">
        {!list ? (
          <div className="flex items-center gap-3 p-6 text-sm text-muted">
            <Spinner /> Loading
          </div>
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Nothing yet. Start with “{tab === 'drives' ? 'New drive' : 'New article'}”.</p>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {list.map((item) => {
                const kind = tab === 'drives' ? 'drive' : 'article'
                const cover = kind === 'drive' ? item.photos[0]?.src : item.cover
                return (
                  <motion.li
                    key={item.id}
                    layout
                    exit={{ x: -40, opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease }}
                    className="grid grid-cols-[4.5rem_1fr] items-center gap-4 px-4 py-4 sm:grid-cols-[5.5rem_1fr_auto] sm:px-5"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-paper-3">
                      {cover ? <img src={thumb(cover)} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={item.published ? 'leaf' : 'muted'}>{item.published ? 'Published' : 'Draft'}</Pill>
                        <span className="font-mono text-xs text-muted">
                          {kind === 'drive'
                            ? `${formatDate(item.date, { day: 'numeric', month: 'short', year: 'numeric' })} / ${item.site} / ${item.photos.length} photos`
                            : `${item.kind === 'awareness' ? 'Awareness' : 'Article'} / ${item.minutes} min / ${item.slug}`}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-medium">{item.title}</p>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 sm:col-span-1">
                      {confirming === item.id ? (
                        <>
                          <span className="self-center text-sm text-rust">Delete for good?</span>
                          <button onClick={() => setConfirming(null)} className="h-9 rounded-full px-3.5 text-sm ring-1 ring-line hover:bg-paper-2">
                            Keep
                          </button>
                          <button onClick={() => remove(kind, item)} className="h-9 rounded-full bg-rust px-3.5 text-sm text-paper">
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditing({ kind, value: toForm(kind, item) })} className="h-9 rounded-full bg-ink px-4 text-sm text-paper transition-colors hover:bg-leaf">
                            Edit
                          </button>
                          <button onClick={() => setConfirming(item.id)} className="h-9 rounded-full px-3.5 text-sm text-ink-2 ring-1 ring-line transition-colors hover:bg-rust hover:text-paper hover:ring-rust">
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <AnimatePresence>
        {editing ? (
          <Editor
            key={editing.value.id ?? 'new'}
            kind={editing.kind}
            initial={editing.value}
            onClose={() => setEditing(null)}
            onSaved={(title, created) => {
              setEditing(null)
              setFlash(created ? `Created “${title}”.` : `Saved “${title}”.`)
              load()
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

const toForm = (kind, item) =>
  kind === 'drive'
    ? { ...item, people: item.people ?? '', saplings: item.saplings ?? '' }
    : { id: item.id, title: item.title, slug: item.slug, kind: item.kind, summary: item.summary, body: item.body, cover: item.cover ?? '', published: item.published }

/* ---------------------------------------------------------------- editor */

function Editor({ kind, initial, onClose, onSaved }) {
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [picker, setPicker] = useState(false)
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e?.target ? e.target.value : e }))
  const isNew = !v.id

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const save = async () => {
    setBusy(true)
    setErrors({})
    setMessage('')
    const body =
      kind === 'drive'
        ? { ...v, people: v.people === '' ? null : Number(v.people), saplings: v.saplings === '' ? null : Number(v.saplings) }
        : v
    try {
      const path = `/admin/${kind}s${isNew ? '' : `/${v.id}`}`
      await api(isNew ? 'POST' : 'PUT', path, body)
      onSaved(v.title, isNew)
    } catch (e) {
      setErrors(e.fields ?? {})
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  const addPhoto = (src, caption = '', time = '') => {
    if (kind === 'drive') setV((x) => ({ ...x, photos: [...x.photos, { src, caption, time }] }))
    else setV((x) => ({ ...x, cover: src }))
    setPicker(false)
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button className="absolute inset-0 bg-ink/50" onClick={onClose} aria-label="Close editor" />
      <motion.section
        role="dialog"
        aria-label={isNew ? `New ${kind}` : `Edit ${kind}`}
        className="relative flex h-full w-full max-w-2xl flex-col bg-paper shadow-[-30px_0_60px_-30px_rgba(19,41,29,.5)]"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.45, ease }}
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <p className="font-display text-2xl">{isNew ? `New ${kind}` : `Edit ${kind}`}</p>
          <button onClick={onClose} className="rounded-full px-3 py-1.5 text-sm text-ink-2 ring-1 ring-line hover:bg-paper-2">
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Field label="Title" value={v.title} onChange={set('title')} error={errors.title} touched />

          {kind === 'drive' ? (
            <>
              <div className="grid gap-x-4 sm:grid-cols-3">
                <Field label="Date" type="date" value={v.date} onChange={set('date')} error={errors.date} touched />
                <Field label="Started" type="time" value={v.startTime} onChange={set('startTime')} error={errors.startTime} touched />
                <Field label="Finished" type="time" value={v.endTime} onChange={set('endTime')} error={errors.endTime} touched />
              </div>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium" htmlFor="site">
                    Site
                  </label>
                  <select
                    id="site"
                    value={v.site}
                    onChange={set('site')}
                    className="h-12 w-full rounded-xl border border-line bg-white/70 px-3 text-[0.95rem] outline-none focus:border-ink"
                  >
                    {[...new Set([...SITES.map((s) => s.name.replace(' & Creek', '')), v.site])].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <p className="min-h-[1.375rem] pt-1 text-[0.8rem] text-rust">{errors.site}</p>
                </div>
                <Field label="Boats left from" value={v.departedFrom} onChange={set('departedFrom')} error={errors.departedFrom} touched />
              </div>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label="People on the drive" type="number" min="0" value={v.people} onChange={set('people')} error={errors.people} touched hint="Leave empty if not logged." />
                <Field label="Saplings planted" type="number" min="0" value={v.saplings} onChange={set('saplings')} error={errors.saplings} touched hint="Leave empty if not logged." />
              </div>
              <TextArea label="What happened" rows={4} value={v.summary} onChange={set('summary')} error={errors.summary} />

              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-sm font-medium">Photos</p>
                <p className="text-xs text-muted">The first photo is the cover.</p>
              </div>
              <ul className="mt-3 space-y-2">
                <AnimatePresence initial={false}>
                  {v.photos.map((ph, i) => (
                    <motion.li key={ph.src + i} layout exit={{ opacity: 0, height: 0 }} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 rounded-xl bg-paper-2 p-2">
                      <img src={thumb(ph.src)} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                      <div className="grid gap-1.5 sm:grid-cols-[1fr_5rem]">
                        <input
                          value={ph.caption}
                          placeholder="Caption"
                          onChange={(e) => setV((x) => ({ ...x, photos: x.photos.map((p, k) => (k === i ? { ...p, caption: e.target.value } : p)) }))}
                          className="h-9 rounded-lg border border-line bg-white px-2.5 text-sm outline-none focus:border-ink"
                        />
                        <input
                          value={ph.time}
                          placeholder="Time"
                          onChange={(e) => setV((x) => ({ ...x, photos: x.photos.map((p, k) => (k === i ? { ...p, time: e.target.value } : p)) }))}
                          className="h-9 rounded-lg border border-line bg-white px-2.5 font-mono text-xs outline-none focus:border-ink"
                        />
                      </div>
                      <div className="flex gap-1">
                        <IconBtn label="Move up" disabled={i === 0} onClick={() => setV((x) => ({ ...x, photos: move(x.photos, i, i - 1) }))}>
                          ↑
                        </IconBtn>
                        <IconBtn label="Move down" disabled={i === v.photos.length - 1} onClick={() => setV((x) => ({ ...x, photos: move(x.photos, i, i + 1) }))}>
                          ↓
                        </IconBtn>
                        <IconBtn label="Remove" onClick={() => setV((x) => ({ ...x, photos: x.photos.filter((_, k) => k !== i) }))}>
                          ×
                        </IconBtn>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <p className="min-h-[1.375rem] pt-1 text-[0.8rem] text-rust">{errors.photos}</p>
            </>
          ) : (
            <>
              <div className="mb-5">
                <p className="mb-2 text-sm font-medium">Type</p>
                <div className="flex gap-2">
                  {[
                    ['awareness', 'Awareness'],
                    ['article', 'Article'],
                  ].map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => set('kind')(k)}
                      aria-pressed={v.kind === k}
                      className={`rounded-full px-4 py-2 text-sm ring-1 ring-inset transition-colors ${v.kind === k ? 'bg-ink text-paper ring-ink' : 'text-ink-2 ring-line hover:ring-ink/50'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <Field
                label="Web address"
                value={v.slug}
                onChange={set('slug')}
                error={errors.slug}
                touched
                placeholder="made from the title if left empty"
                hint={v.slug ? `timar /journal/${v.slug}` : 'Lowercase words joined by dashes.'}
              />
              <TextArea label="Short summary" rows={2} value={v.summary} onChange={set('summary')} error={errors.summary} />
              <TextArea
                label="Body"
                rows={14}
                value={v.body}
                onChange={set('body')}
                error={errors.body}
                hint="Leave a blank line between paragraphs. Start a line with ## for a subheading."
                mono
              />
              <p className="text-sm font-medium">Cover photo</p>
              {v.cover ? (
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-paper-2 p-2">
                  <img src={thumb(v.cover)} alt="" className="aspect-[4/3] w-24 rounded-lg object-cover" />
                  <button onClick={() => set('cover')('')} className="rounded-full px-3 py-1.5 text-sm ring-1 ring-line hover:bg-paper">
                    Remove
                  </button>
                </div>
              ) : null}
              <p className="min-h-[1.375rem] pt-1 text-[0.8rem] text-rust">{errors.cover}</p>
            </>
          )}

          <PhotoAdder open={picker} setOpen={setPicker} onPick={addPhoto} label={kind === 'drive' ? 'Add photos' : v.cover ? 'Change cover' : 'Choose a cover'} />

          <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line px-5 py-4">
            <span>
              <span className="block text-sm font-medium">Published</span>
              <span className="text-xs text-muted">{v.published ? 'Visible on the public journal.' : 'Saved as a draft, only staff can see it.'}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={v.published}
              onClick={() => set('published')(!v.published)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${v.published ? 'bg-leaf' : 'bg-paper-3'}`}
            >
              <motion.span className="absolute top-1 h-5 w-5 rounded-full bg-paper shadow" initial={false} animate={{ left: v.published ? 24 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }} />
            </button>
          </label>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p className="text-sm text-rust" role="alert">
            {message}
          </p>
          <div className="flex shrink-0 gap-2">
            <button onClick={onClose} className="h-11 rounded-full px-5 text-sm ring-1 ring-line hover:bg-paper-2">
              Cancel
            </button>
            <Button onClick={save} loading={busy}>
              {isNew ? `Create ${kind}` : 'Save changes'}
            </Button>
          </div>
        </footer>
      </motion.section>
    </motion.div>
  )
}

const move = (arr, from, to) => {
  const next = arr.slice()
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x)
  return next
}

function IconBtn({ label, children, ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className="h-8 w-8 rounded-full text-ink-2 ring-1 ring-line transition-colors hover:bg-ink hover:text-paper disabled:opacity-30" {...props}>
      {children}
    </button>
  )
}

function TextArea({ label, error, hint, mono = false, ...props }) {
  return (
    <div className="mb-1">
      <label className="mb-1.5 block text-sm font-medium">
        {label}
        <textarea
          className={`mt-1.5 block w-full resize-y rounded-xl border bg-white/70 px-4 py-3 text-[0.95rem] font-normal leading-relaxed outline-none focus:bg-white ${
            mono ? 'font-mono text-[0.85rem]' : ''
          } ${error ? 'border-rust' : 'border-line focus:border-ink'}`}
          {...props}
        />
      </label>
      <p className={`min-h-[1.375rem] pt-1 text-[0.8rem] ${error ? 'text-rust' : 'text-muted'}`}>{error || hint}</p>
    </div>
  )
}

/* Photo source: the field library already on the site, or an upload from the computer. */
function PhotoAdder({ open, setOpen, onPick, label }) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  const upload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErr('')
    setUploading(true)
    try {
      onPick(await uploadImage(file))
    } catch (x) {
      setErr(x.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="h-10 rounded-full px-4 text-sm ring-1 ring-ink hover:bg-ink hover:text-paper">
          {open ? 'Hide library' : `${label} from the field library`}
        </button>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-ink px-4 text-sm text-paper">
          {uploading ? <Spinner /> : null}
          Upload a photo
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={upload} />
        </label>
      </div>
      {err ? <p className="mt-2 text-[0.8rem] text-rust">{err}</p> : null}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.35, ease }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Object.values(PHOTOS).map((p) => (
                <button
                  key={p.file}
                  type="button"
                  onClick={() => onPick(photoSrc(p), p.alt, p.time)}
                  className="group overflow-hidden rounded-lg ring-1 ring-line hover:ring-ink"
                  title={p.alt}
                >
                  <img src={photoSrc(p, 800)} alt={p.alt} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
