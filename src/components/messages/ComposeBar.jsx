import { useState } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'
import EmojiPicker from 'emoji-picker-react'

export function ComposeBar({ threadId, accountId, onSendError }) {
  const [composeText, setComposeText] = useState('')
  const [uploadedAttachment, setUploadedAttachment] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [sending, setSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true); setUploadError(false); setUploadedAttachment(null)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await apiFetch(`${API_BASE}/utils/upload_file`, { method: 'POST', body: formData })
      if (res.ok) setUploadedAttachment(await res.json()); else setUploadError(true)
    } catch { setUploadError(true) } finally { setUploading(false) }
  }

  const handleSend = async () => {
    const isPhoto = !!uploadedAttachment
    if (!isPhoto && !composeText.trim()) return
    setSending(true)
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
      } else onSendError()
    } catch { onSendError() } finally { setSending(false) }
  }

  const hasContent = composeText.trim() || uploadedAttachment

  return (
    <div style={{
      flexShrink: 0, padding: '10px 16px',
      borderTop: '1px solid var(--border)', background: 'var(--surface)',
    }}>
      {uploadedAttachment && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(91,154,255,0.06)', border: '1px solid rgba(91,154,255,0.25)' }}>
          <img src={uploadedAttachment.media_preview} alt="preview" style={{ width: 48, height: 48, borderRadius: 6, border: '1px solid var(--border)', objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace", flex: 1 }}>✓ Фото</span>
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
            background: !hasContent ? 'var(--surface2)' : 'var(--accent)',
            border: 'none', cursor: !hasContent ? 'not-allowed' : 'pointer',
            color: !hasContent ? 'var(--text-dim)' : '#fff',
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
