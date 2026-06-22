import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { EmptyState } from '../components/ui'
import { IconMessage, IconBack, IconCheck, IconSpinner } from '../components/Icons'
import { fmt, fmtDate, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'
import { useBackPath } from '../hooks/useBackPath'
import { usePathParams } from '../hooks/usePathParams'

const ROLE_PILL_STYLES = {
  user:      { background:'rgba(124,106,255,0.15)',border:'1px solid rgba(124,106,255,0.3)',color:'var(--accent)' },
  assistant: { background:'rgba(106,255,212,0.1)',border:'1px solid rgba(106,255,212,0.25)',color:'var(--accent3)' },
  system:    { background:'rgba(255,106,142,0.1)',border:'1px solid rgba(255,106,142,0.25)',color:'var(--accent2)' },
}

const STATUS_STYLES = {
  pending:   { color:'#ffc445',       bg:'rgba(255,196,69,0.1)',  border:'rgba(255,196,69,0.25)' },
  approved:  { color:'var(--accent3)',bg:'rgba(106,255,212,0.08)',border:'rgba(106,255,212,0.2)' },
  moderated: { color:'#5b9aff',       bg:'rgba(91,154,255,0.1)', border:'rgba(91,154,255,0.25)' },
  rejected:  { color:'var(--accent2)',bg:'rgba(255,106,142,0.1)',border:'rgba(255,106,142,0.25)' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5,fontSize:10,fontFamily:"'Syne', sans-serif",fontWeight:700,letterSpacing:'0.6px',textTransform:'uppercase',padding:'3px 9px',borderRadius:100,color:s.color,background:s.bg,border:`1px solid ${s.border}` }}>
      <span style={{ width:6,height:6,borderRadius:'50%',background:s.color,flexShrink:0 }} />
      {status ?? 'pending'}
    </span>
  )
}

export function MessageDetailPage() {
  const { message: messageId, account: accountId } = usePathParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = useBackPath()
  const currentPath = location.pathname.replace(/\/$/, '')

  // Show "To thread" only on /messages/message_X pages
  const showToThread = /^\/messages\/message_\d+$/.test(currentPath)

  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editText, setEditText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  const fetchMessage = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/messages/${messageId}`)
      if (res.ok) setMsg(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [messageId])

  useEffect(() => { fetchMessage() }, [fetchMessage])

  if (loading) {
    return (<div className="page"><div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'var(--text-muted)',fontSize:12 }}><IconSpinner size={28} />Loading…</div></div>)
  }
  if (!msg) {
    return (<div className="page"><EmptyState icon={<IconMessage />} title="Message not found" /></div>)
  }

  const pillStyle = ROLE_PILL_STYLES[msg.role] ?? {}
  const isPending = msg.role === 'assistant' && (msg.modStatus === 'pending' || msg.modStatus == null)
  const canDelete = msg.role === 'assistant' && (msg.modStatus === 'pending' || msg.modStatus == null || msg.modStatus === 'rejected')
  const realThreadId = msg.thread_id

  const handleBack = () => navigate(backPath)

  const openModal = () => { setEditText(msg.content); setModalOpen(true) }

  const handleSaveAndSend = async () => {
    setSending(true); setSendError(false)
    try {
      const res = await apiFetch(
        `${API_BASE}/utils/run_background_send_message?account_id=${parseInt(accountId ?? 0)}&message_id=${parseInt(messageId)}&message_text=${encodeURIComponent(editText)}`
      )
      if (res.ok) { setModalOpen(false); fetchMessage() } else setSendError(true)
    } catch { setSendError(true) } finally { setSending(false) }
  }

  const handleDelete = async () => {
    setDeleting(true); setDeleteError(false)
    try {
      const res = await apiFetch(`${API_BASE}/messages/delete?message_id=${parseInt(messageId)}`, { method:'DELETE' })
      if (res.ok) { setDeleteConfirmOpen(false); handleBack() }
      else { setDeleteConfirmOpen(false); setDeleteError(true) }
    } catch { setDeleteConfirmOpen(false); setDeleteError(true) } finally { setDeleting(false) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">Message <span className="entity-tag">record</span></div>
            <div className="page-subtitle">Thread: {msg.thread_name ?? realThreadId} · Account: {msg.account_name ?? '—'}</div>
          </div>
          <div style={{ display:'flex',gap:8,flexWrap:'wrap',flexShrink:0 }}>
            <button className="btn btn-back" onClick={handleBack}><IconBack /> Back</button>
            {showToThread && realThreadId && (
              <button className="btn btn-ghost" onClick={() => navigate(`${currentPath}/thread_${realThreadId}`)}>
                <IconMessage /> To thread
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="msg-detail-wrap">
        <div className={`msg-detail-card role-${msg.role}`}>
          <div className="msg-detail-header">
            <span className="msg-detail-role-pill" style={pillStyle}>{msg.role}</span>
            <span style={{ fontSize:11,color:'var(--text-dim)' }}>#{msg.id}</span>
            <StatusBadge status={msg.modStatus ?? 'pending'} />
            <span style={{ marginLeft:'auto',fontSize:11,color:'var(--text-muted)' }}>{fmtDate(msg.ts)}</span>
          </div>
          <div className="msg-detail-body">
            {msg.content}
            {(msg.attachments || msg.attachment || []).map((att, i) => (
              att?.media_url && att.media_type === 'photo' ? (
                <div key={i} style={{ marginTop:12 }}><img src={att.media_url} alt="photo" style={{ maxWidth:420,maxHeight:420,borderRadius:8,border:'1px solid var(--border)',display:'block' }} /></div>
              ) : att?.media_url ? (
                <div key={i} style={{ marginTop:12 }}>
                  <a href={att.media_url} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex',alignItems:'center',padding:'5px 14px',borderRadius:6,background:'rgba(91,154,255,0.12)',border:'1px solid rgba(91,154,255,0.3)',color:'#5b9aff',fontSize:11,fontWeight:700,fontFamily:"'Syne', sans-serif",letterSpacing:'0.5px',textTransform:'uppercase',textDecoration:'none' }}>
                    {['text','photo','video','audio'].includes(att.media_type) ? att.media_type : 'undefined type'}
                  </a>
                </div>
              ) : null
            ))}
          </div>
          <div className="msg-detail-meta">
            {[{ label:'Message ID', value:msg.id },{ label:'Thread', value:msg.thread_name ?? realThreadId },{ label:'Account', value:msg.account_name ?? '—' }].map(({ label, value }) => (
              <div key={label} className="msg-detail-meta-item"><div className="msg-detail-meta-label">{label}</div><div className="msg-detail-meta-value">{fmt(value)}</div></div>
            ))}
          </div>
          {(isPending || canDelete || msg.translated_content) && (
            <div style={{ padding:'14px 20px 20px',display:'flex',gap:8,flexWrap:'wrap' }}>
              {isPending && <button onClick={openModal} style={{ display:'inline-flex',alignItems:'center',gap:7,padding:'7px 16px',background:'rgba(124,106,255,0.1)',border:'1px solid rgba(124,106,255,0.3)',borderRadius:6,color:'var(--accent)',fontSize:11,fontWeight:600,fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer' }}>Редактировать и отправить</button>}
              {msg.translated_content && <button onClick={() => setShowTranslation(true)} style={{ display:'inline-flex',alignItems:'center',gap:7,padding:'7px 16px',background:'rgba(91,154,255,0.1)',border:'1px solid rgba(91,154,255,0.3)',borderRadius:6,color:'#5b9aff',fontSize:11,fontWeight:600,fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer' }}>Перевод</button>}
              {canDelete && <button onClick={() => setDeleteConfirmOpen(true)} style={{ display:'inline-flex',alignItems:'center',gap:7,padding:'7px 16px',background:'rgba(255,106,142,0.1)',border:'1px solid rgba(255,106,142,0.3)',borderRadius:6,color:'var(--accent2)',fontSize:11,fontWeight:600,fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer' }}>Удалить</button>}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}><div className="modal" style={{ width:560 }} onClick={e=>e.stopPropagation()}>
          <div className="modal-header"><div className="modal-title">{(msg.attachments||msg.attachment||[]).some(a=>a.media_type==='photo')?'Отправить фото':'Редактировать сообщение'}</div><button className="modal-close" onClick={() => setModalOpen(false)}>✕</button></div>
          <div className="modal-body">
            {(msg.attachments||msg.attachment||[]).some(a=>a.media_type==='photo') ? (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12 }}>
                {(msg.attachments||msg.attachment||[]).filter(a=>a.media_type==='photo').map((att,i)=>(
                  <img key={i} src={att.media_url} alt="preview" style={{ maxWidth:'100%',maxHeight:360,borderRadius:8,border:'1px solid var(--border)' }} />
                ))}
                <div style={{ fontSize:12,color:'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace" }}>Подтвердите отправку</div>
              </div>
            ) : (
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width:'100%',minHeight:160,background:'var(--bg)',border:'1px solid var(--accent)',borderRadius:6,padding:'10px 12px',fontFamily:"'IBM Plex Mono', monospace",fontSize:13,color:'var(--text)',lineHeight:1.65,resize:'vertical',outline:'none' }} autoFocus />
            )}
          </div>
          <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Отмена</button><button className="btn btn-primary" onClick={handleSaveAndSend} disabled={sending}><IconCheck /> {sending?'Отправка…':'Отправить'}</button></div>
        </div></div>
      )}

      {showTranslation && msg.translated_content && (
        <div className="modal-overlay" onClick={() => setShowTranslation(false)}>
          <div className="modal" style={{ width:560,maxHeight:'80vh',display:'flex',flexDirection:'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Перевод</div><button className="modal-close" onClick={() => setShowTranslation(false)}>✕</button></div>
            <div className="modal-body" style={{ flex:1,overflowY:'auto' }}>
              <div style={{ fontSize:13,color:'var(--text)',lineHeight:1.7,fontFamily:"'IBM Plex Mono', monospace",whiteSpace:'pre-wrap',wordBreak:'break-word' }}>{msg.translated_content}</div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowTranslation(false)}>Закрыть</button></div>
          </div>
        </div>
      )}

      {sendError && <div className="modal-overlay" onClick={()=>setSendError(false)}><div className="modal" style={{width:360,textAlign:'center'}} onClick={e=>e.stopPropagation()}><div style={{padding:'32px 24px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}><div style={{fontSize:22,color:'var(--accent2)'}}>✕</div><div style={{fontFamily:"'Syne', sans-serif",fontWeight:700,fontSize:16}}>Ошибка</div><div style={{fontSize:12,color:'var(--text-muted)'}}>Не удалось отправить.</div><button className="btn btn-ghost" onClick={()=>setSendError(false)}>Закрыть</button></div></div></div>}
      {deleteConfirmOpen && <div className="modal-overlay" onClick={()=>setDeleteConfirmOpen(false)}><div className="modal" style={{width:400,textAlign:'center'}} onClick={e=>e.stopPropagation()}><div style={{padding:'32px 24px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}><div style={{fontSize:22,color:'var(--accent2)'}}>🗑</div><div style={{fontFamily:"'Syne', sans-serif",fontWeight:700,fontSize:16}}>Удалить?</div><div style={{fontSize:12,color:'var(--text-muted)'}}>Сообщение #{messageId} будет удалено.</div><div style={{display:'flex',gap:8,marginTop:4}}><button className="btn btn-ghost" onClick={()=>setDeleteConfirmOpen(false)}>Отмена</button><button onClick={handleDelete} disabled={deleting} style={{padding:'6px 16px',background:'rgba(255,106,142,0.15)',border:'1px solid rgba(255,106,142,0.4)',borderRadius:6,color:'var(--accent2)',fontSize:11,fontWeight:600,cursor:'pointer'}}>{deleting?'Удаление…':'Удалить'}</button></div></div></div></div>}
      {deleteError && <div className="modal-overlay" onClick={()=>setDeleteError(false)}><div className="modal" style={{width:360,textAlign:'center'}} onClick={e=>e.stopPropagation()}><div style={{padding:'32px 24px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}><div style={{fontSize:22,color:'var(--accent2)'}}>✕</div><div style={{fontFamily:"'Syne', sans-serif",fontWeight:700,fontSize:16}}>Ошибка</div><div style={{fontSize:12,color:'var(--text-muted)'}}>Не удалось удалить.</div><button className="btn btn-ghost" onClick={()=>setDeleteError(false)}>Закрыть</button></div></div></div>}
    </div>
  )
}
