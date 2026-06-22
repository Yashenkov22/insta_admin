import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SearchBox, EmptyState } from '../components/ui'
import { IconThread, IconBack, IconArrowRight, IconSpinner } from '../components/Icons'
import { fmt, fmtDate, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'
import { useBackPath } from '../hooks/useBackPath'
import { usePathParams } from '../hooks/usePathParams'

const COLUMNS = [
  { key: 'green',  label: 'Green',  color: '#6affd4', bg: 'rgba(106,255,212,0.06)', border: 'rgba(106,255,212,0.2)', dot: 'var(--accent3)' },
  { key: 'yellow', label: 'Yellow', color: '#ffc445', bg: 'rgba(255,196,69,0.06)',   border: 'rgba(255,196,69,0.2)',   dot: '#ffc445' },
  { key: 'red',    label: 'Red',    color: '#ff6a8e', bg: 'rgba(255,106,142,0.06)',  border: 'rgba(255,106,142,0.2)',  dot: 'var(--accent2)' },
  { key: 'grey',   label: 'Grey',   color: '#6b6b88', bg: 'rgba(107,107,136,0.06)',  border: 'rgba(107,107,136,0.2)',  dot: 'var(--text-muted)' },
]

function ThreadCard({ thread, onNavigate, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(thread.id))
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(thread.id)
      }}
      onClick={() => onNavigate(thread.id)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '12px 14px',
        cursor: 'grab',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,106,255,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>
          {thread.user_name}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace" }}>
          #{thread.id}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          {fmtDate(thread.last_activity)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {thread.has_unread && (
            <span style={{
              fontSize: 8, padding: '1px 6px', borderRadius: 4,
              background: 'rgba(255,106,142,0.12)', border: '1px solid rgba(255,106,142,0.3)',
              color: 'var(--accent2)', fontWeight: 700, fontFamily: "'Syne', sans-serif",
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>unread</span>
          )}
          <div style={{ width: 14, height: 14, color: 'var(--text-dim)', flexShrink: 0 }}>
            <IconArrowRight />
          </div>
        </div>
      </div>
    </div>
  )
}

function KanbanColumn({ col, threads, onNavigate, onDragStart, onDrop, isDragOver, onDragOver, onDragLeave }) {
  const count = threads.length
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); onDrop(id); }}
      style={{
        flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column',
        background: isDragOver ? col.bg : 'transparent',
        borderRadius: 10,
        border: `1px solid ${isDragOver ? col.border : 'var(--border)'}`,
        transition: 'background 0.2s, border-color 0.2s',
        overflow: 'hidden',
      }}
    >
      {/* Column header */}
      <div style={{
        padding: '10px 14px',
        background: col.bg,
        borderBottom: `1px solid ${col.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
          color: col.color, fontFamily: "'Syne', sans-serif", flex: 1,
        }}>
          {col.label}
        </span>
        <span style={{
          fontSize: 9, padding: '1px 7px', borderRadius: 8,
          background: col.bg, border: `1px solid ${col.border}`,
          color: col.color, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
        }}>
          {count}
        </span>
      </div>

      {/* Cards */}
      <div style={{
        flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6,
        overflowY: 'auto', minHeight: 80,
      }}>
        {threads.map((t) => (
          <ThreadCard key={t.id} thread={t} onNavigate={onNavigate} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  )
}

export function ThreadsPage() {
  const { account: accountId } = usePathParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = useBackPath()
  const currentPath = location.pathname.replace(/\/$/, '')

  const [search, setSearch] = useState('')
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragOverCol, setDragOverCol] = useState(null)
  const [draggingId, setDraggingId] = useState(null)

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/threads/${accountId}/threads`)
      if (res.ok) setThreads(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [accountId])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  const handleDrop = async (threadIdStr, newColor) => {
    const threadId = parseInt(threadIdStr)
    setDragOverCol(null)
    setDraggingId(null)

    const thread = threads.find(t => t.id === threadId)
    if (!thread || thread.color_level === newColor) return

    const oldColor = thread.color_level
    // Optimistic update
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, color_level: newColor } : t))

    try {
      const res = await apiFetch(`${API_BASE}/threads/edit_color_level`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, color_level: newColor }),
      })
      if (!res.ok) {
        // Revert
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, color_level: oldColor } : t))
      }
    } catch {
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, color_level: oldColor } : t))
    }
  }

  const handleNavigate = (threadId) => {
    navigate(`${currentPath}/thread_${threadId}`)
  }

  const filtered = threads.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [t.user_name, t.account_name, String(t.id)].some((v) => String(v ?? '').toLowerCase().includes(q))
  })

  if (loading) {
    return (<div className="page"><div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'var(--text-muted)',fontSize:12 }}><IconSpinner size={28} />Loading threads…</div></div>)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">
              {threads[0]?.account_name ?? `Account #${accountId}`}{' '}
              <span className="entity-tag">threads</span>
            </div>
            <div className="page-subtitle">Drag cards between columns to change status</div>
          </div>
          <button className="btn btn-back" onClick={() => navigate(backPath)}><IconBack /> Back</button>
        </div>
      </div>

      <div className="toolbar">
        <SearchBox placeholder="Search threads…" value={search} onChange={setSearch} />
        <div className="toolbar-spacer" />
        <div className="count-badge"><strong>{filtered.length}</strong> threads</div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState icon={<IconThread />} title="No threads found" />
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', gap: 10, padding: '0 16px 16px',
          overflowX: 'auto', overflowY: 'hidden', minHeight: 0,
        }}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              threads={filtered.filter(t => t.color_level === col.key)}
              onNavigate={handleNavigate}
              onDragStart={setDraggingId}
              onDrop={(id) => handleDrop(id, col.key)}
              isDragOver={dragOverCol === col.key}
              onDragOver={() => setDragOverCol(col.key)}
              onDragLeave={() => setDragOverCol(null)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
