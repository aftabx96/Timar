import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel } from './DashboardShell'
import { formatDate, get } from '../lib/api'
import { thumb } from '../pages/Journal'

/*
  Dashboard panels filled from the public Journal: the latest drive on record and
  the newest articles. Shared by the visitor, adopter and volunteer dashboards.
*/

function useJournal(path, pick) {
  const [data, setData] = useState(null)
  useEffect(() => {
    get(path)
      .then((d) => setData(pick(d)))
      .catch(() => setData([]))
  }, [path]) // eslint-disable-line react-hooks/exhaustive-deps
  return data
}

export function LatestDrive({ className = '', dark = false }) {
  const drives = useJournal('/drives', (d) => d.drives)
  const d = drives?.[0]
  if (drives && !d) return null
  return (
    <Link
      to={d ? `/journal/drives/${d.id}` : '/journal'}
      className={`group block overflow-hidden rounded-[22px] ${dark ? 'bg-ink text-paper' : 'bg-paper-2'} ${className}`}
    >
      <div className="h-36 overflow-hidden bg-paper-3">
        {d?.photos[0] ? (
          <img
            src={thumb(d.photos[0].src)}
            alt={d.photos[0].caption}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-tide)] group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="p-6">
        <p className={`eyebrow ${dark ? '!text-paper/70' : ''}`}>Latest drive</p>
        <p className="mt-2 font-display text-2xl leading-tight">{d?.title ?? ' '}</p>
        {d ? (
          <p className={`mt-2 text-sm ${dark ? 'text-paper/80' : 'text-ink-2'}`}>
            {formatDate(d.date)}, {d.site}
            {d.people != null ? ` / ${d.people} people` : ''}
            {d.saplings != null ? ` / ${d.saplings.toLocaleString()} planted` : ''}
          </p>
        ) : null}
        <p className="mt-4 text-sm font-medium">
          Read the drive record <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
        </p>
      </div>
    </Link>
  )
}

export function WorthReading({ className = '' }) {
  const articles = useJournal('/articles', (d) => d.articles.slice(0, 3))
  return (
    <Panel
      className={className}
      title="Worth reading"
      action={
        <Link to="/journal" className="link-grow shrink-0 pb-0.5 text-sm font-medium text-ink">
          All articles
        </Link>
      }
    >
      {articles && articles.length === 0 ? <p className="text-sm text-muted">Nothing published yet.</p> : null}
      <ul className="-my-3 divide-y divide-line">
        {(articles ?? []).map((a) => (
          <li key={a.id}>
            <Link to={`/journal/${a.slug}`} className="group flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-sm font-medium group-hover:underline">{a.title}</span>
                <span className="font-mono text-xs text-muted">{a.minutes} min read</span>
              </span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
