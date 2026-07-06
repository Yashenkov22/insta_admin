import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/ui'
import { IconThread, IconArrowRight, IconSpinner } from '../components/Icons'
import { fmt, fmtDate, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'
import { useWsEvent } from '../hooks/useWebSocket'

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
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(thread.id)); e.dataTransfer.effectAllowed = 'move'; onDragStart(thread.id) }}
      onClick={() => onNavigate(thread.id)}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '10px 12px', cursor: 'grab', transition: 'border-color 0.15s, box-shadow 0.15s', userSelect: 'none',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,106,255,0.15)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>{thread.user_name}</span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace" }}>#{thread.id}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>{thread.account_name}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>{fmtDate(thread.last_activity)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {thread.has_unread && (
            <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,106,142,0.12)', border: '1px solid rgba(255,106,142,0.3)', color: 'var(--accent2)', fontWeight: 700, fontFamily: "'Syne', sans-serif", letterSpacing: '0.5px', textTransform: 'uppercase' }}>unread</span>
          )}
          <div style={{ width: 14, height: 14, color: 'var(--text-dim)', flexShrink: 0 }}><IconArrowRight /></div>
        </div>
      </div>
    </div>
  )
}

function KanbanColumn({ col, threads, onNavigate, onDragStart, onDrop, isDragOver, onDragOver, onDragLeave }) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.getData('text/plain')) }}
      style={{
        flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column',
        background: isDragOver ? col.bg : 'transparent', borderRadius: 10,
        border: `1px solid ${isDragOver ? col.border : 'var(--border)'}`,
        transition: 'background 0.2s, border-color 0.2s', overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 14px', background: col.bg, borderBottom: `1px solid ${col.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: col.color, fontFamily: "'Syne', sans-serif", flex: 1 }}>{col.label}</span>
        <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 8, background: col.bg, border: `1px solid ${col.border}`, color: col.color, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{threads.length}</span>
      </div>
      <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', minHeight: 80 }}>
        {threads.map((t) => <ThreadCard key={t.id} thread={t} onNavigate={onNavigate} onDragStart={onDragStart} />)}
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
      fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer', border: 'none',
      background: active ? (color ?? 'rgba(124,106,255,0.15)') : 'var(--surface2)',
      color: active ? 'var(--text)' : 'var(--text-muted)',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

export function AllThreadsPage() {
  const navigate = useNavigate()
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragOverCol, setDragOverCol] = useState(null)

  const [filterColors, setFilterColors] = useState(new Set())
  const [filterAccount, setFilterAccount] = useState('')
  const [filterGuest, setFilterGuest] = useState('')

  const fetchThreads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/threads/list`)
      if (res.ok) setThreads(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  // Listen for new threads via WebSocket
  useWsEvent('Thread for list updated', (data) => {
    const t = data.payload
    if (!t || !t.id) return
    setThreads(prev => {
      if (prev.some(th => th.id === t.id)) return prev
      return [...prev, t]
    })
  })

  // Listen for thread detail updates via WebSocket
  useWsEvent('Thread detail updated', (data) => {
    const thread = data.payload?.thread
    if (!thread || !thread.id) return
    setThreads(prev => prev.map(t =>
      t.id === thread.id
        ? { ...t, has_unread: thread.has_unread, last_activity: thread.last_activity }
        : t
    ))
  })

  const toggleColor = (c) => {
    setFilterColors(prev => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  const accounts = [...new Set(threads.map(t => t.account_name))].sort()
  const guests = [...new Set(threads.map(t => t.user_name))].sort()

  const filtered = threads.filter((t) => {
    if (filterColors.size > 0 && !filterColors.has(t.color_level)) return false
    if (filterAccount && t.account_name !== filterAccount) return false
    if (filterGuest && t.user_name !== filterGuest) return false
    return true
  })

  const handleDrop = async (threadIdStr, newColor) => {
    const threadId = parseInt(threadIdStr)
    setDragOverCol(null)
    const thread = threads.find(t => t.id === threadId)
    if (!thread || thread.color_level === newColor) return
    const oldColor = thread.color_level
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, color_level: newColor } : t))
    try {
      const res = await apiFetch(`${API_BASE}/threads/edit_color_level`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, color_level: newColor }),
      })
      if (!res.ok) setThreads(prev => prev.map(t => t.id === threadId ? { ...t, color_level: oldColor } : t))
    } catch { setThreads(prev => prev.map(t => t.id === threadId ? { ...t, color_level: oldColor } : t)) }
  }

  if (loading) {
    return (<div className="page"><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: 'var(--text-muted)', fontSize: 12 }}><IconSpinner size={28} />Loading threads…</div></div>)
  }

  const hasFilters = filterColors.size > 0 || filterAccount || filterGuest

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">Threads <span className="entity-tag">table</span></div>
            <div className="page-subtitle">All threads · {filtered.length} of {threads.length}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0,
      }}>
        {/* Color filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginRight: 4 }}>Color:</span>
          {COLUMNS.map(c => (
            <FilterChip key={c.key} label={c.label} active={filterColors.has(c.key)} color={c.bg} onClick={() => toggleColor(c.key)} />
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Account filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Account:</span>
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            style={{
              padding: '3px 8px', background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 5, color: 'var(--text)', fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace", outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All</option>
            {accounts.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* User filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>User:</span>
          <select
            value={filterGuest}
            onChange={(e) => setFilterGuest(e.target.value)}
            style={{
              padding: '3px 8px', background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 5, color: 'var(--text)', fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace", outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All</option>
            {guests.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {hasFilters && (
          <button onClick={() => { setFilterColors(new Set()); setFilterAccount(''); setFilterGuest('') }}
            style={{ padding: '3px 10px', background: 'rgba(255,106,142,0.08)', border: '1px solid rgba(255,106,142,0.25)', borderRadius: 5, color: 'var(--accent2)', fontSize: 10, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer' }}>
            Сбросить
          </button>
        )}
      </div>

      {/* Kanban */}
      {filtered.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState icon={<IconThread />} title="No threads found" />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', gap: 10, padding: '12px 16px', overflowX: 'auto', overflowY: 'hidden', minHeight: 0 }}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              threads={filtered.filter(t => t.color_level === col.key)}
              onNavigate={(id) => navigate(`/threads/thread_${id}`)}
              onDragStart={() => {}}
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
