import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { EmptyState, ModBadge } from '../components/ui'
import { MessageBubble } from '../components/messages/MessageBubble'
import { IconMessage, IconBack, IconPlus, IconCheck, IconSpinner } from '../components/Icons'
import { API_BASE, fmt } from '../utils'
import { apiFetch } from '../utils/auth'
import { useBackPath } from '../hooks/useBackPath'
import { usePathParams } from '../hooks/usePathParams'

function InfoButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 14px', textAlign: 'center', whiteSpace: 'nowrap',
        background: disabled ? 'var(--surface2)' : 'rgba(124,106,255,0.08)',
        border: `1px solid ${disabled ? 'var(--border)' : 'rgba(124,106,255,0.25)'}`,
        borderRadius: 8, color: disabled ? 'var(--text-dim)' : 'var(--accent)',
        fontSize: 10, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'rgba(124,106,255,0.15)' }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = 'rgba(124,106,255,0.08)' }}
    >
      {label}
    </button>
  )
}

function InfoModal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}

export function MessagesPage() {
  const { thread: threadId, account: accountId } = usePathParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = useBackPath()
  const currentPath = location.pathname.replace(/\/$/, '')
  const containerRef = useRef(null)

  const [threadInfo, setThreadInfo] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeModal, setActiveModal] = useState(null) // 'account' | 'user' | 'context'
  const [showDetailedInfo, setShowDetailedInfo] = useState(false)

  const [composeOpen, setComposeOpen] = useState(false)
  const [composeText, setComposeText] = useState('')
  const [composeType, setComposeType] = useState('text')
  const [composeFile, setComposeFile] = useState(null)
  const [uploadedAttachment, setUploadedAttachment] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const [translationText, setTranslationText] = useState(null)
  const [translating, setTranslating] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseNotification, setParseNotification] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)

  const handleTranslate = async (messageId) => {
    setTranslating(true)
    setTranslationText(null)
    try {
      const res = await apiFetch(`${API_BASE}/utils/translate?message_id=${messageId}`)
      if (res.ok) {
        const text = await res.text()
        setTranslationText(text.replace(/^"|"$/g, ''))
      } else {
        setTranslationText('Ошибка перевода')
      }
    } catch { setTranslationText('Ошибка перевода') }
    finally { setTranslating(false) }
  }

  const handleParse = async () => {
    const accId = threadInfo?.account_information?.account_id
    if (!accId || parsing) return
    setParsing(true)
    try {
      const res = await apiFetch(`${API_BASE}/utils/run_background_parse_thread?account_id=${accId}&thread_id=${threadId}`)
      if (res.ok) {
        setParseNotification(true)
        setTimeout(() => setParseNotification(false), 4000)
      }
    } catch {}
    finally { setParsing(false) }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/threads/${threadId}`)
      if (res.ok) {
        const data = await res.json()
        setThreadInfo(data)
        setMessages(data.messages ?? [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [threadId])

  useEffect(() => { fetchData() }, [fetchData])

  // Scroll to saved message or bottom after messages load
  useEffect(() => {
    if (!messages.length || !containerRef.current) return
    const savedId = sessionStorage.getItem(`scroll_msg_${currentPath}`)
    if (savedId) {
      sessionStorage.removeItem(`scroll_msg_${currentPath}`)
      // Wait for DOM render
      requestAnimationFrame(() => {
        const el = containerRef.current?.querySelector(`[data-msg-id="${savedId}"]`)
        if (el) {
          el.scrollIntoView({ block: 'center' })
          el.style.transition = 'box-shadow 0.3s'
          el.style.boxShadow = '0 0 0 2px var(--accent)'
          setTimeout(() => { el.style.boxShadow = 'none' }, 1500)
          return
        }
        // Fallback: scroll to bottom
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      })
    } else {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      })
    }
  }, [messages, currentPath])

  const handleNavigateToMessage = (msgId) => {
    sessionStorage.setItem(`scroll_msg_${currentPath}`, String(msgId))
    navigate(`${currentPath}/message_${msgId}`)
  }

  const resetCompose = () => { setComposeText(''); setComposeType('text'); setComposeFile(null); setUploadedAttachment(null); setUploadError(false); setComposeOpen(false) }

  const handleFileUpload = async (file) => {
    if (!file) return
    setComposeFile(file); setUploading(true); setUploadError(false); setUploadedAttachment(null)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await apiFetch(`${API_BASE}/utils/upload_file`, { method: 'POST', body: formData })
      if (res.ok) setUploadedAttachment(await res.json()); else setUploadError(true)
    } catch { setUploadError(true) } finally { setUploading(false) }
  }

  const handleSend = async () => {
    const isPhoto = !!uploadedAttachment
    if (!isPhoto && !composeText.trim()) return
    setSending(true); setSendError(false)
    try {
      const res = await apiFetch(`${API_BASE}/messages/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_type: isPhoto ? 'photo' : 'text',
          account_id: parseInt(accountId || 0),
          text: isPhoto ? 'photo message' : composeText.trim(),
          thread_id: threadId,
          attachment: isPhoto ? uploadedAttachment : null,
        }),
      })
      if (res.ok) {
        setComposeText('')
        setUploadedAttachment(null)
        setComposeFile(null)
        fetchData()
      } else setSendError(true)
    } catch { setSendError(true) } finally { setSending(false) }
  }

  const handleDelete = async (msgId) => {
    setDeleting(true); setDeleteError(false)
    try {
      const res = await apiFetch(`${API_BASE}/messages/delete?message_id=${parseInt(msgId)}`, { method: 'DELETE' })
      if (res.ok) { setDeleteTarget(null); fetchData() } else { setDeleteTarget(null); setDeleteError(true) }
    } catch { setDeleteTarget(null); setDeleteError(true) } finally { setDeleting(false) }
  }

  if (loading) {
    return (<div className="page"><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: 'var(--text-muted)', fontSize: 12 }}><IconSpinner size={28} />Loading…</div></div>)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">{threadInfo?.thread_name ?? `Thread #${threadId}`} <span className="entity-tag">{threadInfo?.message_count ?? 0} messages</span></div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={handleParse}
              disabled={parsing || !threadInfo?.account_information?.account_id}
              style={{
                padding: '5px 12px', whiteSpace: 'nowrap',
                background: 'rgba(106,255,212,0.08)',
                border: '1px solid rgba(106,255,212,0.25)',
                borderRadius: 6, color: 'var(--accent3)',
                fontSize: 10, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
                cursor: parsing ? 'wait' : 'pointer',
                opacity: parsing ? 0.6 : 1,
              }}
            >
              {parsing ? '…' : '↻ Обновить'}
            </button>
            <button className="btn btn-back" onClick={() => navigate(backPath)}><IconBack /> Back</button>
          </div>
        </div>
      </div>

      {/* Info bar: user photo | center buttons | account photo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        flexShrink: 0,
      }}>
        {/* Left: user photo */}
        <div
          onClick={() => setActiveModal('user')}
          style={{ flexShrink: 0, cursor: 'pointer', position: 'relative' }}
          title={threadInfo?.user_information?.username || 'Собеседник'}
        >
          {threadInfo?.user_information?.photo_url ? (
            <img src={threadInfo.user_information.photo_url} alt="user" style={{
              width: 40, height: 40, borderRadius: 12, objectFit: 'cover',
              border: '2px solid #2d8f5e', transition: 'border-color 0.15s',
            }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: 'var(--surface2)',
              border: '2px solid #2d8f5e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'var(--text-dim)',
            }}>👤</div>
          )}
        </div>

        {/* Center: buttons */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <InfoButton label="Контекст" onClick={() => setActiveModal('context')} disabled={!threadInfo?.context} />
          <InfoButton label="Заметки" onClick={() => {}} disabled={true} />
          <InfoButton label="Вложения" onClick={() => setActiveModal('attachments')} disabled={false} />
        </div>

        {/* Right: account photo */}
        <div
          onClick={() => setActiveModal('account')}
          style={{ flexShrink: 0, cursor: 'pointer', position: 'relative' }}
          title={threadInfo?.account_information?.username || 'Аккаунт'}
        >
          {threadInfo?.account_information?.photo_url ? (
            <img src={threadInfo.account_information.photo_url} alt="account" style={{
              width: 40, height: 40, borderRadius: 12, objectFit: 'cover',
              border: '2px solid var(--accent)', transition: 'border-color 0.15s',
            }} />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: 'var(--surface2)',
              border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'var(--text-dim)',
            }}>👤</div>
          )}
        </div>
      </div>

      {/* Parse notification */}
      {parseNotification && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(106,255,212,0.1)',
          borderBottom: '1px solid rgba(106,255,212,0.25)',
          color: 'var(--accent3)',
          fontSize: 11, fontWeight: 600,
          fontFamily: "'IBM Plex Mono', monospace",
          textAlign: 'center',
          flexShrink: 0,
          animation: 'fadeIn 0.3s ease',
        }}>
          ✓ Чат читается...
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          <div className="messages-container" ref={containerRef} style={{ flex: 1 }}>
            {messages.length === 0 ? (
              <EmptyState icon={<IconMessage />} title="No messages" />
            ) : (
              messages.map((msg, i) => (
                <MessageBubble key={msg.id ?? `sys-${i}`} msg={msg} index={i}
                  onDetail={(id) => handleNavigateToMessage(id)}
                  onDelete={(id) => setDeleteTarget(id)}
                  onTranslate={(id) => handleTranslate(id)}
                />
              ))
            )}
          </div>

          {/* Compose bar — always visible */}
          <div style={{
            flexShrink: 0, padding: '10px 16px',
            borderTop: '1px solid var(--border)', background: 'var(--surface)',
          }}>
            {/* Photo preview */}
            {uploadedAttachment && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(91,154,255,0.06)', border: '1px solid rgba(91,154,255,0.25)' }}>
                <img src={uploadedAttachment.media_preview} alt="preview" style={{ width: 48, height: 48, borderRadius: 6, border: '1px solid var(--border)', objectFit: 'cover', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace", flex: 1 }}>✓ Фото</span>
                <button onClick={() => { setUploadedAttachment(null); setComposeFile(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>✕</button>
              </div>
            )}
            {uploading && (
              <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>Загрузка файла…</div>
            )}
            {uploadError && (
              <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace" }}>✕ Ошибка загрузки</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Photo button */}
              <label style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                cursor: 'pointer', color: 'var(--text-muted)', transition: 'border-color 0.15s, color 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0]) }} />
              </label>

              {/* Text input */}
              <input
                type="text"
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Введите сообщение…"
                style={{
                  flex: 1, height: 36, padding: '0 12px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text)',
                  fontSize: 12, fontFamily: "'IBM Plex Mono', monospace",
                  outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending || (!composeText.trim() && !uploadedAttachment)}
                style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: (!composeText.trim() && !uploadedAttachment) ? 'var(--surface2)' : 'var(--accent)',
                  border: 'none', cursor: (!composeText.trim() && !uploadedAttachment) ? 'not-allowed' : 'pointer',
                  color: (!composeText.trim() && !uploadedAttachment) ? 'var(--text-dim)' : '#fff',
                  transition: 'background 0.15s, color 0.15s',
                  opacity: sending ? 0.6 : 1,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

      {/* Info modals */}
      {activeModal === 'account' && threadInfo?.account_information && (() => {
        const ai = threadInfo.account_information
        return (
          <InfoModal title="Информация об аккаунте" onClose={() => setActiveModal(null)}>
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:14,marginBottom:16 }}>
              {ai.photo_url ? (
                <img src={ai.photo_url} alt="account" style={{ width:140,height:140,borderRadius:16,objectFit:'cover',border:'2px solid var(--accent)' }} />
              ) : (
                <div style={{ width:140,height:140,borderRadius:16,background:'var(--surface2)',border:'2px solid var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,color:'var(--text-dim)' }}>👤</div>
              )}
              <div style={{ textAlign:'center' }}>
                {ai.full_name && <div style={{ fontSize:18,fontWeight:700,color:'var(--text)',fontFamily:"'Syne', sans-serif" }}>{ai.full_name}</div>}
                {ai.username && <div style={{ fontSize:12,color:'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",marginTop:2 }}>@{ai.username}</div>}
              </div>
            </div>
            {ai.information ? (
              <div style={{ fontSize:13,color:'var(--text)',lineHeight:1.7,fontFamily:"'IBM Plex Mono', monospace",whiteSpace:'pre-wrap',wordBreak:'break-word',padding:'12px 16px',borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)' }}>
                {ai.information}
              </div>
            ) : (
              <div style={{ padding:16,borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text-muted)',fontSize:12,fontFamily:"'IBM Plex Mono', monospace",textAlign:'center' }}>Информация не установлена</div>
            )}
          </InfoModal>
        )
      })()}

      {activeModal === 'user' && threadInfo?.user_information && (() => {
        const ui = threadInfo.user_information
        return (
          <InfoModal title="Информация о собеседнике" onClose={() => { setActiveModal(null); setShowDetailedInfo(false) }}>
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:14,marginBottom:16 }}>
              {ui.photo_url ? (
                <img src={ui.photo_url} alt="user" style={{ width:140,height:140,borderRadius:16,objectFit:'cover',border:'2px solid #2d8f5e' }} />
              ) : (
                <div style={{ width:140,height:140,borderRadius:16,background:'var(--surface2)',border:'2px solid #2d8f5e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,color:'var(--text-dim)' }}>👤</div>
              )}
              <div style={{ textAlign:'center' }}>
                {ui.full_name && <div style={{ fontSize:18,fontWeight:700,color:'var(--text)',fontFamily:"'Syne', sans-serif" }}>{ui.full_name}</div>}
                {ui.username && <div style={{ fontSize:12,color:'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",marginTop:2 }}>@{ui.username}</div>}
                {ui.insta_link && (
                  <a href={ui.insta_link} target="_blank" rel="noopener noreferrer" style={{ fontSize:11,color:'var(--accent)',fontFamily:"'IBM Plex Mono', monospace",textDecoration:'none',marginTop:4,display:'inline-block' }}>
                    {ui.insta_link}
                  </a>
                )}
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <button onClick={() => setShowDetailedInfo(v => !v)} style={{
                padding:'6px 14px',background: showDetailedInfo ? 'rgba(124,106,255,0.15)' : 'rgba(124,106,255,0.08)',
                border:'1px solid rgba(124,106,255,0.25)',borderRadius:6,
                color:'var(--accent)',fontSize:10,fontWeight:600,fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',
              }}>
                {showDetailedInfo ? 'Скрыть информацию' : 'Подробная информация'}
              </button>
            </div>
            {showDetailedInfo && ui.information && (
              <div style={{ display:'flex',flexDirection:'column',gap:0,borderRadius:8,border:'1px solid var(--border)',overflow:'hidden',background:'var(--bg)' }}>
                {Object.entries(ui.information).map(([key, value], i, arr) => (
                  <div key={key} style={{ display:'flex',gap:12,padding:'10px 16px',borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width:140,fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,flexShrink:0 }}>{key.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize:12,color:'var(--text)',fontFamily:"'IBM Plex Mono', monospace",wordBreak:'break-word' }}>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '—')}</div>
                  </div>
                ))}
              </div>
            )}
            {showDetailedInfo && !ui.information && (
              <div style={{ padding:16,borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text-muted)',fontSize:12,textAlign:'center' }}>Подробная информация отсутствует</div>
            )}
          </InfoModal>
        )
      })()}

      {activeModal === 'context' && threadInfo?.context && (
        <InfoModal title="Контекст чата" onClose={() => setActiveModal(null)}>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {threadInfo.context}
          </div>
        </InfoModal>
      )}

      {activeModal === 'attachments' && (() => {
        const userAtts = messages.filter(m => m.role === 'user').flatMap(m => (m.attachments || m.attachment || []).map(a => ({ ...a, msgId: m.id })))
        const botAtts = messages.filter(m => m.role === 'assistant').flatMap(m => (m.attachments || m.attachment || []).map(a => ({ ...a, msgId: m.id })))
        return (
          <InfoModal title="Вложения" onClose={() => setActiveModal(null)}>
            <div style={{ display: 'flex', gap: 20, minHeight: 200 }}>
              {/* User media */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#2d8f5e', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 10 }}>
                  User · {userAtts.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {userAtts.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Нет вложений</div>}
                  {userAtts.map((att, i) => (
                    att.media_type === 'photo' ? (
                      <img key={i} src={att.media_url} alt="" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => setPhotoPreview(att.media_url)} />
                    ) : (
                      <a key={i} href={att.media_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 6, background: 'rgba(91,154,255,0.1)', border: '1px solid rgba(91,154,255,0.25)', color: '#5b9aff', fontSize: 9, fontWeight: 700, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', textDecoration: 'none' }}>
                        {att.media_type}
                      </a>
                    )
                  ))}
                </div>
              </div>
              <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
              {/* Account media */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent)', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 10 }}>
                  Account · {botAtts.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {botAtts.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Нет вложений</div>}
                  {botAtts.map((att, i) => (
                    att.media_type === 'photo' ? (
                      <img key={i} src={att.media_url} alt="" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => setPhotoPreview(att.media_url)} />
                    ) : (
                      <a key={i} href={att.media_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 6, background: 'rgba(91,154,255,0.1)', border: '1px solid rgba(91,154,255,0.25)', color: '#5b9aff', fontSize: 9, fontWeight: 700, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', textDecoration: 'none' }}>
                        {att.media_type}
                      </a>
                    )
                  ))}
                </div>
              </div>
            </div>
          </InfoModal>
        )
      })()}

      {/* Translation modal */}
      {(translationText || translating) && (
        <div className="modal-overlay" onClick={() => { if (!translating) setTranslationText(null) }}>
          <div className="modal" style={{ width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Перевод</div>
              <button className="modal-close" onClick={() => { setTranslationText(null); setTranslating(false) }}>✕</button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              {translating ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Переводим…</div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {translationText}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setTranslationText(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Error modals */}
      {sendError && <div className="modal-overlay" onClick={() => setSendError(false)}><div className="modal" style={{ width: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}><div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}><div style={{ fontSize: 22, color: 'var(--accent2)' }}>✕</div><div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Ошибка</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Не удалось создать сообщение.</div><button className="btn btn-ghost" onClick={() => setSendError(false)}>Закрыть</button></div></div></div>}
      {deleteTarget && <div className="modal-overlay" onClick={() => setDeleteTarget(null)}><div className="modal" style={{ width: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}><div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}><div style={{ fontSize: 22, color: 'var(--accent2)' }}>🗑</div><div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Удалить сообщение?</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Сообщение #{deleteTarget} будет удалено.</div><div style={{ display: 'flex', gap: 8, marginTop: 4 }}><button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Отмена</button><button onClick={() => handleDelete(deleteTarget)} disabled={deleting} style={{ padding: '6px 16px', background: 'rgba(255,106,142,0.15)', border: '1px solid rgba(255,106,142,0.4)', borderRadius: 6, color: 'var(--accent2)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{deleting ? 'Удаление…' : 'Удалить'}</button></div></div></div></div>}
      {deleteError && <div className="modal-overlay" onClick={() => setDeleteError(false)}><div className="modal" style={{ width: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}><div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}><div style={{ fontSize: 22, color: 'var(--accent2)' }}>✕</div><div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Ошибка</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Не удалось удалить.</div><button className="btn btn-ghost" onClick={() => setDeleteError(false)}>Закрыть</button></div></div></div>}
    </div>
  )
}
