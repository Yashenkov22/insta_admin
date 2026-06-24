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
    if (composeType === 'text' && !composeText.trim()) return
    if (composeType !== 'text' && !uploadedAttachment) return
    setSending(true); setSendError(false)
    try {
      const res = await apiFetch(`${API_BASE}/messages/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_type: composeType, account_id: parseInt(accountId || 0), text: composeType === 'text' ? composeText.trim() : `${composeType} message`, thread_id: threadId, attachment: composeType !== 'text' ? uploadedAttachment : null }),
      })
      if (res.ok) { resetCompose(); fetchData() } else setSendError(true)
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
            <div className="page-title">{threadInfo?.thread_name ?? `Thread #${threadId}`} <span className="entity-tag">thread</span></div>
            <div className="page-subtitle">thread_id: {fmt(threadId)} · messages: {threadInfo?.message_count ?? 0}</div>
          </div>
          <button className="btn btn-back" onClick={() => navigate(backPath)}><IconBack /> Back</button>
        </div>
      </div>
      {/* Info bar: photo + buttons horizontal */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        flexShrink: 0,
      }}>
        {threadInfo?.account_information?.photo_url ? (
          <img src={threadInfo.account_information.photo_url} alt="account" style={{
            width: 42, height: 42, borderRadius: 10, objectFit: 'cover',
            border: '1px solid var(--border)', flexShrink: 0,
          }} />
        ) : (
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: 'var(--text-dim)', flexShrink: 0,
          }}>👤</div>
        )}
        <InfoButton label="Информация об аккаунте" onClick={() => setActiveModal('account')} disabled={!threadInfo?.account_information} />
        <InfoButton label="Информация о собеседнике" onClick={() => setActiveModal('user')} disabled={!threadInfo?.user_information} />
        <InfoButton label="Контекст чата" onClick={() => setActiveModal('context')} disabled={!threadInfo?.context} />
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={handleParse}
            disabled={parsing || !threadInfo?.account_information?.account_id}
            style={{
              padding: '8px 14px', whiteSpace: 'nowrap',
              background: 'rgba(106,255,212,0.08)',
              border: '1px solid rgba(106,255,212,0.25)',
              borderRadius: 8, color: 'var(--accent3)',
              fontSize: 10, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
              cursor: parsing ? 'wait' : 'pointer',
              opacity: parsing ? 0.6 : 1,
              transition: 'background 0.15s',
            }}
          >
            {parsing ? 'Запрос…' : 'Прочитать новые сообщения'}
          </button>
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
                  onDetail={(id) => navigate(`${currentPath}/message_${id}`)}
                  onDelete={(id) => setDeleteTarget(id)}
                  onTranslate={(id) => handleTranslate(id)}
                />
              ))
            )}
          </div>

          {/* Compose bar */}
          <div className="compose-bar">
            <div className="compose-header">
              <span className="compose-label">New message · assistant · <ModBadge status="pending" /></span>
              <button className="compose-toggle" onClick={() => { if (composeOpen) resetCompose(); else setComposeOpen(true) }}>
                <IconPlus /> {composeOpen ? 'Cancel' : 'New message'}
              </button>
            </div>
            {composeOpen && (
              <div>
                <div style={{ display: 'flex', gap: 4, padding: '10px 0 8px', borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
                  {[{ type: 'text', label: '✏️ Текст' }, { type: 'photo', label: '🖼 Фото' }].map(({ type, label }) => (
                    <button key={type} onClick={() => { setComposeType(type); setComposeFile(null); setUploadedAttachment(null); setUploadError(false) }}
                      style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer', border: 'none', background: composeType === type ? 'rgba(124,106,255,0.15)' : 'transparent', color: composeType === type ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</button>
                  ))}
                </div>
                {composeType === 'text' && <textarea className="compose-textarea" value={composeText} onChange={(e) => setComposeText(e.target.value)} placeholder="Type assistant message…" autoFocus />}
                {composeType === 'photo' && (
                  <div style={{ padding: '8px 0' }}>
                    {!uploadedAttachment && !uploading && (
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 16px', borderRadius: 8, border: '2px dashed var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>
                        <span style={{ fontSize: 28 }}>🖼</span><span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>Нажмите для загрузки фото</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0]) }} />
                      </label>
                    )}
                    {uploading && <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>Загрузка…</div>}
                    {uploadError && <div style={{ padding: '12px 16px', borderRadius: 6, background: 'rgba(255,106,142,0.08)', border: '1px solid rgba(255,106,142,0.25)', color: 'var(--accent2)', fontSize: 11 }}>✕ Ошибка загрузки</div>}
                    {uploadedAttachment && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8, background: 'rgba(91,154,255,0.06)', border: '1px solid rgba(91,154,255,0.25)' }}>
                        <img src={uploadedAttachment.media_preview} alt="preview" style={{ width: 80, height: 80, borderRadius: 6, border: '1px solid var(--border)', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace" }}>✓ Фото загружено</span>
                          <button onClick={() => { setUploadedAttachment(null); setComposeFile(null) }} style={{ alignSelf: 'flex-start', padding: '3px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Заменить</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="compose-footer">
                  <button className="btn-save-edit" onClick={handleSend} disabled={sending || (composeType === 'text' ? !composeText.trim() : !uploadedAttachment)}><IconCheck /> {sending ? 'Saving…' : 'Create message'}</button>
                  <button className="btn-cancel-edit" onClick={resetCompose}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Info modals */}
      {activeModal === 'account' && threadInfo?.account_information && (() => {
        const ai = threadInfo.account_information
        return (
          <InfoModal title="Информация об аккаунте" onClose={() => setActiveModal(null)}>
            <div style={{ display:'flex',gap:16,alignItems:'flex-start',marginBottom:16 }}>
              {ai.photo_url ? (
                <img src={ai.photo_url} alt="account" style={{ width:72,height:72,borderRadius:12,objectFit:'cover',border:'1px solid var(--border)',flexShrink:0 }} />
              ) : (
                <div style={{ width:72,height:72,borderRadius:12,background:'var(--surface2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:'var(--text-dim)',flexShrink:0 }}>👤</div>
              )}
              <div style={{ flex:1,minWidth:0 }}>
                {ai.full_name && <div style={{ fontSize:16,fontWeight:700,color:'var(--text)',fontFamily:"'Syne', sans-serif" }}>{ai.full_name}</div>}
                {ai.username && <div style={{ fontSize:12,color:'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",marginTop:2 }}>@{ai.username}</div>}
                {!ai.full_name && !ai.username && <div style={{ fontSize:14,color:'var(--text)',fontFamily:"'Syne', sans-serif" }}>{(threadInfo.thread_name ?? '').split(' - ')[0] || '—'}</div>}
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
            <div style={{ display:'flex',gap:16,alignItems:'flex-start',marginBottom:16 }}>
              {ui.photo_url ? (
                <img src={ui.photo_url} alt="user" style={{ width:72,height:72,borderRadius:12,objectFit:'cover',border:'1px solid var(--border)',flexShrink:0 }} />
              ) : (
                <div style={{ width:72,height:72,borderRadius:12,background:'var(--surface2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:'var(--text-dim)',flexShrink:0 }}>👤</div>
              )}
              <div style={{ flex:1,minWidth:0 }}>
                {ui.full_name && <div style={{ fontSize:16,fontWeight:700,color:'var(--text)',fontFamily:"'Syne', sans-serif" }}>{ui.full_name}</div>}
                {ui.username && <div style={{ fontSize:12,color:'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",marginTop:2 }}>@{ui.username}</div>}
                {ui.insta_link && (
                  <a href={ui.insta_link} target="_blank" rel="noopener noreferrer" style={{ fontSize:12,color:'var(--accent)',fontFamily:"'IBM Plex Mono', monospace",textDecoration:'none',marginTop:4,display:'inline-block' }}>
                    {ui.insta_link}
                  </a>
                )}
                <div style={{ marginTop:10 }}>
                  <button
                    onClick={() => setShowDetailedInfo(v => !v)}
                    style={{
                      padding:'6px 14px',background: showDetailedInfo ? 'rgba(124,106,255,0.15)' : 'rgba(124,106,255,0.08)',
                      border:'1px solid rgba(124,106,255,0.25)',borderRadius:6,
                      color:'var(--accent)',fontSize:10,fontWeight:600,fontFamily:"'IBM Plex Mono', monospace",
                      cursor:'pointer',transition:'background 0.15s',
                    }}
                  >
                    {showDetailedInfo ? 'Скрыть информацию' : 'Подробная информация'}
                  </button>
                </div>
              </div>
            </div>

            {showDetailedInfo && ui.information && (
              <div style={{ display:'flex',flexDirection:'column',gap:0,borderRadius:8,border:'1px solid var(--border)',overflow:'hidden',background:'var(--bg)' }}>
                {Object.entries(ui.information).map(([key, value], i, arr) => (
                  <div key={key} style={{ display:'flex',gap:12,padding:'10px 16px',borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width:140,fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,flexShrink:0 }}>
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize:12,color:'var(--text)',fontFamily:"'IBM Plex Mono', monospace",wordBreak:'break-word' }}>
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '—')}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showDetailedInfo && !ui.information && (
              <div style={{ padding:16,borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',color:'var(--text-muted)',fontSize:12,fontFamily:"'IBM Plex Mono', monospace",textAlign:'center' }}>Подробная информация отсутствует</div>
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
