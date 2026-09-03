import { useState, useEffect, useRef } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'
import EmojiPicker from 'emoji-picker-react'

export function ComposeBar({ threadId, accountId, onSendError, pendingMessage, onClearPending }) {
  const [composeText, setComposeText] = useState('')
  const [uploadedAttachment, setUploadedAttachment] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [sending, setSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [mediaType, setMediaType] = useState('photo')
  const inputRef = useRef(null)
  const photoInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const audioInputRef = useRef(null)

  useEffect(() => {
    if (pendingMessage) {
      setComposeText(pendingMessage.content || '')
      setUploadedAttachment(null)
      inputRef.current?.focus()
    }
  }, [pendingMessage])

  const handleFileUpload = async (file, type) => {
    if (!file) return
    setMediaType(type)
    setUploading(true); setUploadError(false); setUploadedAttachment(null)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await apiFetch(`${API_BASE}/utils/upload_file`, { method: 'POST', body: formData })
      if (res.ok) setUploadedAttachment(await res.json()); else setUploadError(true)
    } catch { setUploadError(true) } finally { setUploading(false) }
  }

  const handleMediaSelect = (type) => {
    setShowMediaPicker(false)
    const refs = { photo: photoInputRef, video: videoInputRef, audio: audioInputRef }
    refs[type]?.current?.click()
  }

  const handleSend = async () => {
    if (pendingMessage) {
      if (!composeText.trim()) return
      setSending(true)
      try {
        const res = await apiFetch(
          `${API_BASE}/utils/run_background_send_message?account_id=${parseInt(pendingMessage.account_id || accountId)}&message_id=${parseInt(pendingMessage.id)}&message_text=${encodeURIComponent(composeText.trim())}`
        )
        if (res.ok) {
          setComposeText('')
          onClearPending()
        } else onSendError()
      } catch { onSendError() } finally { setSending(false) }
      return
    }

    const hasAttachment = !!uploadedAttachment
    if (!hasAttachment && !composeText.trim()) return
    setSending(true)
    try {
      const res = await apiFetch(`${API_BASE}/messages/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_type: hasAttachment ? mediaType : 'text',
          account_id: parseInt(accountId || 0),
          text: hasAttachment ? `${mediaType} message` : composeText.trim(),
          thread_id: threadId,
          attachment: hasAttachment ? uploadedAttachment : null,
        }),
      })
      if (res.ok) {
        setComposeText('')
        setUploadedAttachment(null)
      } else onSendError()
    } catch { onSendError() } finally { setSending(false) }
  }

  const handleCancelPending = () => {
    setComposeText('')
    onClearPending()
  }

  const hasContent = composeText.trim() || uploadedAttachment

  return (
    <div style={{
      flexShrink: 0, padding: '10px 16px',
      borderTop: '1px solid var(--border)', background: 'var(--surface)',
    }}>
      {pendingMessage && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
          padding: '6px 10px', borderRadius: 8,
          background: 'rgba(255,196,69,0.06)', border: '1px solid rgba(255,196,69,0.25)',
        }}>
          <span style={{ fontSize: 10, color: '#ffc445', fontFamily: "'IBM Plex Mono', monospace", flex: 1 }}>
            Редактирование #{pendingMessage.id}
          </span>
          <button onClick={handleCancelPending} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 14, padding: '2px 6px',
          }}>✕</button>
        </div>
      )}
      {!pendingMessage && uploadedAttachment && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(91,154,255,0.06)', border: '1px solid rgba(91,154,255,0.25)' }}>
          {mediaType === 'photo' && uploadedAttachment.media_preview ? (
            <img src={uploadedAttachment.media_preview} alt="preview" style={{ width: 48, height: 48, borderRadius: 6, border: '1px solid var(--border)', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {mediaType === 'video' ? '🎬' : '🎵'}
            </div>
          )}
          <span style={{ fontSize: 10, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace", flex: 1, textTransform: 'uppercase' }}>✓ {mediaType}</span>
          <button onClick={() => setUploadedAttachment(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}>✕</button>
        </div>
      )}
      {uploading && (
        <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>Загрузка файла…</div>
      )}
      {uploadError && (
        <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace" }}>✕ Ошибка загрузки</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Media picker */}
        {!pendingMessage && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setShowMediaPicker(v => !v)}
              type="button"
              style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: showMediaPicker ? 'rgba(124,106,255,0.15)' : 'var(--surface2)',
                border: `1px solid ${showMediaPicker ? 'rgba(124,106,255,0.4)' : 'var(--border)'}`,
                cursor: 'pointer', color: showMediaPicker ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            {showMediaPicker && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowMediaPicker(false)} />
                <div style={{
                  position: 'absolute', bottom: 44, left: 0, zIndex: 100,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  overflow: 'hidden', minWidth: 140,
                }}>
                  {[
                    { type: 'photo', label: 'Фото', icon: '📷' },
                    { type: 'video', label: 'Видео', icon: '🎬' },
                    { type: 'audio', label: 'Аудио', icon: '🎵' },
                  ].map(({ type, label, icon }) => (
                    <button
                      key={type}
                      onClick={() => handleMediaSelect(type)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 14px',
                        background: 'transparent', border: 'none',
                        color: 'var(--text)', fontSize: 12, fontWeight: 600,
                        fontFamily: "'IBM Plex Mono', monospace",
                        cursor: 'pointer', textAlign: 'left',
                        borderBottom: type !== 'audio' ? '1px solid var(--border)' : 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0], 'photo'); e.target.value = '' }} />
            <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0], 'video'); e.target.value = '' }} />
            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0], 'audio'); e.target.value = '' }} />
          </div>
        )}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={composeText}
          onChange={(e) => setComposeText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={pendingMessage ? 'Редактируйте и отправьте…' : 'Введите сообщение…'}
          style={{
            flex: 1, height: 36, padding: '0 12px',
            background: 'var(--bg)',
            border: `1px solid ${pendingMessage ? 'rgba(255,196,69,0.4)' : 'var(--border)'}`,
            borderRadius: 10, color: 'var(--text)',
            fontSize: 12, fontFamily: "'IBM Plex Mono', monospace",
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={(e) => e.target.style.borderColor = pendingMessage ? 'rgba(255,196,69,0.6)' : 'var(--accent)'}
          onBlur={(e) => e.target.style.borderColor = pendingMessage ? 'rgba(255,196,69,0.4)' : 'var(--border)'}
        />

        {/* Emoji button */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowEmojiPicker(v => !v)}
            type="button"
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showEmojiPicker ? 'rgba(124,106,255,0.15)' : 'transparent',
              border: '1px solid var(--border)', cursor: 'pointer',
              color: showEmojiPicker ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          {showEmojiPicker && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowEmojiPicker(false)} />
              <div style={{
                position: 'absolute', bottom: 44, right: 0, zIndex: 100,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setComposeText(prev => prev + emojiData.emoji)
                    setShowEmojiPicker(false)
                  }}
                  theme={document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'}
                  width={320}
                  height={400}
                  searchPlaceholder="Поиск…"
                  previewConfig={{ showPreview: false }}
                />
              </div>
            </>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !hasContent}
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: !hasContent ? 'var(--surface2)' : pendingMessage ? '#ffc445' : 'var(--accent)',
            border: 'none', cursor: !hasContent ? 'not-allowed' : 'pointer',
            color: !hasContent ? 'var(--text-dim)' : pendingMessage ? '#1a1a2e' : '#fff',
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
  )
}
