import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePagination } from '../hooks/usePagination'
import { SearchBox, Pagination, EmptyState, ModBadge } from '../components/ui'
import { IconMessage, IconArrowRight, IconSpinner } from '../components/Icons'
import { fmt, fmtDate, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'

export function AllMessagesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [translationText, setTranslationText] = useState(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/messages/list`)
      if (res.ok) setMessages(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const filtered = messages.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return [m.content, m.role, String(m.id), m.account_name, m.thread_name].some(
      (v) => String(v ?? '').toLowerCase().includes(q)
    )
  })

  const { page, setPage, totalPages, slice, total } = usePagination(filtered)

  if (loading) {
    return (<div className="page"><div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'var(--text-muted)',fontSize:12 }}><IconSpinner size={28} />Loading messages…</div></div>)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">Messages <span className="entity-tag">table</span></div>
            <div className="page-subtitle">All messages across all threads and accounts</div>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <SearchBox placeholder="Search messages…" value={search} onChange={setSearch} />
        <div className="toolbar-spacer" />
        <div className="count-badge"><strong>{total}</strong> messages</div>
      </div>

      <div className="table-wrap">
        {slice.length === 0 ? (
          <EmptyState icon={<IconMessage />} title="No messages" desc="No messages found." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Content</th>
                <th>Role</th>
                <th>Thread</th>
                <th>Account</th>
                <th>Timestamp</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {slice.map((msg) => (
                <tr key={msg.id} onClick={() => navigate(`/messages/message_${msg.id}`)}>
                  <td><span className="cell-id">#{msg.id}</span></td>
                  <td>
                    {(() => {
                      const atts = msg.attachments || msg.attachment || []
                      if (atts.length > 0) {
                        const types = atts.map(a => ['text','photo','video','audio'].includes(a.media_type) ? a.media_type : 'undefined type')
                        const label = types.length === 1 ? types[0] : `${types.length} files`
                        return (
                          <span style={{ display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:6,background:'rgba(91,154,255,0.12)',border:'1px solid rgba(91,154,255,0.3)',color:'#5b9aff',fontSize:10,fontWeight:700,fontFamily:"'Syne', sans-serif",letterSpacing:'0.5px',textTransform:'uppercase' }}>
                            {label}
                          </span>
                        )
                      }
                      return <span className="cell-text" style={{ display:'block',maxWidth:320,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{msg.content}</span>
                    })()}
                  </td>
                  <td>
                    {msg.role === 'assistant' ? (
                      <ModBadge status={msg.modStatus ?? 'pending'} />
                    ) : (
                      <span className="mod-badge" style={{ color:'var(--text-muted)',background:'rgba(107,107,136,0.1)',border:'1px solid rgba(107,107,136,0.25)' }}>{msg.role}</span>
                    )}
                  </td>
                  <td><span className="cell-text" style={{ fontSize:12 }}>{msg.thread_name ?? '—'}</span></td>
                  <td>{fmt(msg.account_name)}</td>
                  <td><span style={{ fontSize:11 }}>{fmtDate(msg.ts)}</span></td>
                  <td>
                    {msg.translated_content && (
                      <button onClick={(e) => { e.stopPropagation(); setTranslationText(msg.translated_content) }}
                        style={{ padding:'3px 10px',background:'rgba(91,154,255,0.08)',border:'1px solid rgba(91,154,255,0.25)',borderRadius:5,color:'#5b9aff',fontSize:9,fontWeight:600,fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',whiteSpace:'nowrap' }}>
                        Перевод
                      </button>
                    )}
                  </td>
                  <td className="arrow-cell"><IconArrowRight /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} total={total} />

      {translationText && (
        <div className="modal-overlay" onClick={() => setTranslationText(null)}>
          <div className="modal" style={{ width:560,maxHeight:'80vh',display:'flex',flexDirection:'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Перевод</div><button className="modal-close" onClick={() => setTranslationText(null)}>✕</button></div>
            <div className="modal-body" style={{ flex:1,overflowY:'auto' }}>
              <div style={{ fontSize:13,color:'var(--text)',lineHeight:1.7,fontFamily:"'IBM Plex Mono', monospace",whiteSpace:'pre-wrap',wordBreak:'break-word' }}>{translationText}</div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setTranslationText(null)}>Закрыть</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
