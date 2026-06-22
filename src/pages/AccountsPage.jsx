import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { usePagination } from '../hooks/usePagination'
import { SearchBox, Pagination, EmptyState } from '../components/ui'
import { IconUser, IconPlus, IconArrowRight, IconSpinner } from '../components/Icons'
import { fmt, fmtDate, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'

function ActiveBadge({ active }) {
  return active
    ? <span className="badge badge-green">● active</span>
    : <span className="badge badge-red">● inactive</span>
}

function ErrorBadge({ hasError }) {
  return hasError
    ? <span className="badge badge-red">! error</span>
    : <span className="badge badge-green">✓ ok</span>
}

export function AccountsPage() {
  const { openNewAccountModal } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/account/list`)
      if (res.ok) setAccounts(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  useEffect(() => {
    const handler = () => fetchAccounts()
    window.addEventListener('app:account-created', handler)
    return () => window.removeEventListener('app:account-created', handler)
  }, [fetchAccounts])

  const filtered = accounts.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [a.username, a.insta_id, String(a.id)].some((v) =>
      String(v ?? '').toLowerCase().includes(q)
    )
  })

  const { page, setPage, totalPages, slice, total } = usePagination(filtered)

  if (loading) {
    return (
      <div className="page">
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'var(--text-muted)',fontSize:12 }}>
          <IconSpinner size={28} /> Loading accounts…
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">Accounts <span className="entity-tag">table</span></div>
            <div className="page-subtitle">All registered user accounts</div>
          </div>
          <button className="btn btn-primary" onClick={openNewAccountModal}>
            <IconPlus /> New Account
          </button>
        </div>
      </div>

      <div className="toolbar">
        <SearchBox placeholder="Search accounts…" value={search} onChange={setSearch} />
        <div className="toolbar-spacer" />
        <div className="count-badge"><strong>{total}</strong> records</div>
      </div>

      <div className="table-wrap">
        {slice.length === 0 ? (
          <EmptyState icon={<IconUser />} title="No accounts found" desc={search ? 'Try a different search.' : 'Create your first account.'} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Updated At</th>
                <th>Active</th>
                <th>Error</th>
                <th>Threads</th>
                <th>Unread</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {slice.map((acc) => (
                <tr key={acc.id} onClick={() => navigate(`/accounts/account_${acc.id}`)}>
                  <td><span className="cell-id">#{fmt(acc.id)}</span></td>
                  <td><span className="cell-text">{fmt(acc.username)}</span></td>
                  <td><span style={{ fontSize: 11 }}>{fmtDate(acc.updated_at)}</span></td>
                  <td><ActiveBadge active={acc.is_active} /></td>
                  <td><ErrorBadge hasError={acc.has_error} /></td>
                  <td>{acc.thread_count ?? 0}</td>
                  <td>
                    {acc.has_unread
                      ? <span className="badge badge-red">unread</span>
                      : <span className="badge badge-green">✓ clear</span>
                    }
                  </td>
                  <td className="arrow-cell"><IconArrowRight /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} total={total} />
    </div>
  )
}
