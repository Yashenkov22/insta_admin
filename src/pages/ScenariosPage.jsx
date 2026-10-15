import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePagination } from '../hooks/usePagination'
import { SearchBox, Pagination, EmptyState } from '../components/ui'
import { IconScenario, IconPlus, IconArrowRight, IconSpinner } from '../components/Icons'
import { fmt, fmtDate, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'

export function ScenariosPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchScenarios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/scenario/list`)
      if (res.ok) setScenarios(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchScenarios() }, [fetchScenarios])

  const filtered = scenarios.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [s.name, String(s.id)].some((v) =>
      String(v ?? '').toLowerCase().includes(q)
    )
  })

  const { page, setPage, totalPages, slice, total } = usePagination(filtered)

  if (loading) {
    return (
      <div className="page">
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'var(--text-muted)',fontSize:12 }}>
          <IconSpinner size={28} /> Loading scenarios…
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">Scenarios <span className="entity-tag">table</span></div>
            <div className="page-subtitle">All configured scenarios</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/scenarios/new')}>
            <IconPlus /> New Scenario
          </button>
        </div>
      </div>

      <div className="toolbar">
        <SearchBox placeholder="Search scenarios…" value={search} onChange={setSearch} />
        <div className="toolbar-spacer" />
        <div className="count-badge"><strong>{total}</strong> records</div>
      </div>

      <div className="table-wrap">
        {slice.length === 0 ? (
          <EmptyState icon={<IconScenario />} title="No scenarios found" desc={search ? 'Try a different search.' : 'Create your first scenario.'} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {slice.map((sc) => (
                <tr key={sc.id} onClick={() => navigate(`/scenarios/scenario_${sc.id}`)}>
                  <td><span className="cell-id">#{fmt(sc.id)}</span></td>
                  <td><span className="cell-text">{fmt(sc.name)}</span></td>
                  <td><span style={{ fontSize: 11 }}>{fmtDate(sc.created_at)}</span></td>
                  <td><span style={{ fontSize: 11 }}>{fmtDate(sc.updated_at)}</span></td>
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
