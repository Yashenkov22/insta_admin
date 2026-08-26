import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { EmptyState } from '../components/ui'
import { MessageBubble } from '../components/messages/MessageBubble'
import { ChatInfoBar } from '../components/messages/ChatInfoBar'
import { ComposeBar } from '../components/messages/ComposeBar'
import { AccountInfoModal, UserInfoModal, ContextModal, NotesModal, AttachmentsModal } from '../components/messages/ChatInfoModals'
import { ThreadSettingsModal } from '../components/messages/ThreadSettingsModal'
import { TranslationModal } from '../components/modals/TranslationModal'
import { ConfirmModal } from '../components/modals/ConfirmModal'
import { ErrorModal } from '../components/modals/ErrorModal'
import { IconMessage, IconBack, IconSpinner } from '../components/Icons'
import { API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'
import { useBackPath } from '../hooks/useBackPath'
import { usePathParams } from '../hooks/usePathParams'
import { useWsEvent } from '../hooks/useWebSocket'

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
  const [oldestMessageId, setOldestMessageId] = useState(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const [activeModal, setActiveModal] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseNotification, setParseNotification] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const [translationText, setTranslationText] = useState(null)
  const [translating, setTranslating] = useState(false)

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
        setOldestMessageId(data.oldest_message_id ?? null)
        setHasMore(data.oldest_message_id != null)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [threadId])

  useEffect(() => { fetchData() }, [fetchData])

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore || !oldestMessageId) return
    setLoadingOlder(true)
    try {
      const res = await apiFetch(`${API_BASE}/threads/${threadId}/pagination?oldest_message_id=${oldestMessageId}`)
      if (res.ok) {
        const data = await res.json()
        const older = data.messages
        if (!older || older.length === 0) {
          setHasMore(false)
        } else {
          const container = containerRef.current
          const prevHeight = container?.scrollHeight ?? 0
          setMessages(prev => [...older, ...prev])
          setOldestMessageId(data.oldest_message_id)
          setHasMore(data.oldest_message_id != null)
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevHeight
            }
          })
        }
      }
    } catch (e) { console.error(e) }
    finally { setLoadingOlder(false) }
  }, [loadingOlder, hasMore, oldestMessageId, threadId])

  // Scroll to saved message or bottom after initial load
  const initialScrollDone = useRef(false)
  useEffect(() => {
    if (!messages.length || !containerRef.current || initialScrollDone.current) return
    initialScrollDone.current = true
    const savedId = sessionStorage.getItem(`scroll_msg_${currentPath}`)
    if (savedId) {
      sessionStorage.removeItem(`scroll_msg_${currentPath}`)
      requestAnimationFrame(() => {
        const el = containerRef.current?.querySelector(`[data-msg-id="${savedId}"]`)
        if (el) {
          el.scrollIntoView({ block: 'center' })
          el.style.transition = 'box-shadow 0.3s'
          el.style.boxShadow = '0 0 0 2px var(--accent)'
          setTimeout(() => { el.style.boxShadow = 'none' }, 1500)
          return
        }
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

  // Infinite scroll: load older messages when scrolled near top
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMore && !loadingOlder) {
        loadOlderMessages()
      }
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingOlder, loadOlderMessages])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    })
  }

  // WebSocket listeners
  useWsEvent('message created', (data) => {
    const payload = data.payload
    if (!payload || String(payload.thread_id) !== String(threadId)) return
    const newMsg = payload.message
    if (!newMsg) return
    setMessages(prev => {
      if (prev.some(m => String(m.id) === String(newMsg.id))) return prev
      return [...prev, newMsg]
    })
    scrollToBottom()
  })

  useWsEvent('message deleted', (data) => {
    const payload = data.payload
    if (!payload || String(payload.thread_id) !== String(threadId)) return
    const deletedId = payload.message?.id
    if (!deletedId) return
    setMessages(prev => prev.filter(m => String(m.id) !== String(deletedId)))
  })

  useWsEvent('Thread detail updated', (data) => {
    const thread = data.payload?.thread
    if (!thread || String(thread.id) !== String(threadId)) return
    if (thread.context !== undefined || thread.is_approved !== undefined || thread.is_pinned !== undefined) {
      setThreadInfo(prev => {
        if (!prev) return prev
        const updates = {}
        if (thread.context !== undefined) updates.context = thread.context
        if (thread.is_approved !== undefined) updates.is_approved = thread.is_approved
        if (thread.is_pinned !== undefined) updates.is_pinned = thread.is_pinned
        return { ...prev, ...updates }
      })
    }
    const newMsgs = thread.messages ?? []
    if (newMsgs.length > 0) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => String(m.id)))
        const toAdd = newMsgs.filter(m => !existingIds.has(String(m.id)))
        if (toAdd.length === 0) return prev
        return [...prev, ...toAdd]
      })
      scrollToBottom()
    }
  })

  useWsEvent('Message updated', (data) => {
    const payload = data.payload
    if (!payload || String(payload.thread_id) !== String(threadId)) return
    const updated = payload.message
    if (!updated?.id) return
    setMessages(prev => prev.map(m =>
      String(m.id) === String(updated.id) ? { ...m, modStatus: updated.modStatus } : m
    ))
  })

  useWsEvent('Message send count updated', (data) => {
    const payload = data.payload
    if (!payload || String(payload.thread_id) !== String(threadId)) return
    const updated = payload.message
    if (!updated?.id) return
    setMessages(prev => prev.map(m =>
      String(m.id) === String(updated.id) ? { ...m, retry_send_count: updated.retry_send_count } : m
    ))
  })

  const handleNavigateToMessage = (msgId) => {
    sessionStorage.setItem(`scroll_msg_${currentPath}`, String(msgId))
    navigate(`${currentPath}/message_${msgId}`)
  }

  const handleDelete = async (msgId) => {
    setDeleting(true); setDeleteError(false)
    try {
      const res = await apiFetch(`${API_BASE}/messages/delete?message_id=${parseInt(msgId)}`, { method: 'DELETE' })
      if (res.ok) { setDeleteTarget(null) } else { setDeleteTarget(null); setDeleteError(true) }
    } catch { setDeleteTarget(null); setDeleteError(true) } finally { setDeleting(false) }
  }

  const handleOpenModal = (type) => {
    setActiveModal(type)
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
            <button className="btn btn-back" onClick={() => navigate(backPath)}><IconBack /> Back</button>
          </div>
        </div>
      </div>

      <ChatInfoBar threadInfo={threadInfo} threadId={threadId} onOpenModal={handleOpenModal} />

      {parseNotification && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(106,255,212,0.1)',
          borderBottom: '1px solid rgba(106,255,212,0.25)',
          color: 'var(--accent3)',
          fontSize: 11, fontWeight: 600,
          fontFamily: "'IBM Plex Mono', monospace",
          textAlign: 'center', flexShrink: 0,
          animation: 'fadeIn 0.3s ease',
        }}>
          ✓ Чат читается...
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="messages-container" ref={containerRef} style={{ flex: 1 }}>
          {loadingOlder && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              <IconSpinner size={18} />
            </div>
          )}
          {!hasMore && messages.length > 0 && (
            <div style={{
              textAlign: 'center', padding: '12px 0', fontSize: 10,
              color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace",
            }}>
              начало переписки
            </div>
          )}
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

        <ComposeBar
          threadId={threadId}
          accountId={threadInfo?.account_information?.account_id || accountId}
          onSendError={() => setSendError(true)}
        />
      </div>

      {/* Info modals */}
      {activeModal === 'account' && (
        <AccountInfoModal info={threadInfo?.account_information} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'user' && (
        <UserInfoModal info={threadInfo?.user_information} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'context' && threadInfo?.context && (
        <ContextModal context={threadInfo.context} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'notes' && (
        <NotesModal initialNotes={threadInfo?.notes} threadId={threadId} onClose={() => setActiveModal(null)} onSaved={fetchData} />
      )}
      {activeModal === 'attachments' && (
        <AttachmentsModal threadId={threadId} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'settings' && (
        <ThreadSettingsModal
          threadId={threadId}
          aiModel={threadInfo?.ai_model}
          aiTemperature={threadInfo?.ai_temperature}
          onClose={() => setActiveModal(null)}
          onUpdated={(fields) => setThreadInfo(prev => prev ? { ...prev, ...fields } : prev)}
        />
      )}

      {/* Translation */}
      {(translationText || translating) && (
        <TranslationModal text={translationText} loading={translating} onClose={() => { setTranslationText(null); setTranslating(false) }} />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Удалить сообщение?"
          message={`Сообщение #${deleteTarget} будет удалено.`}
          loading={deleting}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Errors */}
      {sendError && <ErrorModal message="Не удалось создать сообщение." onClose={() => setSendError(false)} />}
      {deleteError && <ErrorModal message="Не удалось удалить." onClose={() => setDeleteError(false)} />}
    </div>
  )
}
