import { useCallback, useEffect, useMemo, useState } from 'react'
import { Panel } from '../DashboardShell'
import { Avatar, Pill, Spinner } from '../ui'
import { api, formatDate } from '../../lib/api'
import { useAuth } from '../../lib/auth'

/*
  Admin: every account, with search and a role filter. Admins can change a person's role;
  coordinators can look but not change. Nobody can change their own role.
*/

const ROLES = [
  ['visitor', 'Visitor'],
  ['volunteer', 'Volunteer'],
  ['company', 'Company'],
  ['coordinator', 'Coordinator'],
  ['admin', 'Admin'],
]
const roleName = Object.fromEntries(ROLES)

export default function UsersManager({ onChanged }) {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setUsers((await api('GET', '/admin/users')).users)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (users ?? []).filter(
      (u) => (role === 'all' || u.role === role) && (!q || `${u.name} ${u.email} ${u.company ?? ''}`.toLowerCase().includes(q)),
    )
  }, [users, search, role])

  const changeRole = async (u, next) => {
    if (!window.confirm(`Change ${u.name} from ${roleName[u.role]} to ${roleName[next]}?`)) return
    setError('')
    try {
      await api('PUT', `/admin/users/${u.id}/role`, { role: next })
      await load()
      onChanged?.()
    } catch (e) {
      setError(`${u.name}: ${e.message}`)
    }
  }

  const canEdit = me.role === 'admin'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or company"
          aria-label="Search users"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-5 text-sm outline-none focus:border-ink sm:max-w-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Filter by role"
          className="h-11 rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-ink"
        >
          <option value="all">Every role {users ? `(${users.length})` : ''}</option>
          {ROLES.map(([k, label]) => (
            <option key={k} value={k}>
              {label} {users ? `(${users.filter((u) => u.role === k).length})` : ''}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-rust">{error}</p> : null}
      {!canEdit ? <p className="text-sm text-muted">Only an admin can change roles.</p> : null}

      <Panel pad={false}>
        {!users ? (
          <div className="flex justify-center py-16 text-ink-3">
            <Spinner className="h-6 w-6" />
          </div>
        ) : shown.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-muted">No one matches that.</p>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((u) => (
              <li key={u.id} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 px-5 py-4 sm:grid-cols-[auto_1.4fr_1fr_8rem] sm:items-center sm:px-6">
                <Avatar name={u.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {u.name}
                    {u.id === me.id ? <span className="ml-2 font-mono text-[0.68rem] text-muted">you</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>
                <div className="col-start-2 text-xs text-muted sm:col-start-auto">
                  <p>Joined {formatDate(u.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p>
                    {u.company ? `${u.company} / ` : ''}
                    {u.adopted ? `${u.adopted.toLocaleString()} adopted` : u.verified ? 'Email verified' : 'Email not verified'}
                  </p>
                </div>
                <div className="col-start-2 sm:col-start-auto">
                  {canEdit && u.id !== me.id ? (
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value)}
                      aria-label={`Role for ${u.name}`}
                      className="h-9 rounded-full border border-line bg-white px-3 text-xs outline-none focus:border-ink"
                    >
                      {ROLES.map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Pill tone={u.role === 'admin' || u.role === 'coordinator' ? 'ink' : 'muted'} dot={false}>
                      {roleName[u.role]}
                    </Pill>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
