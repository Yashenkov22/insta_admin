import { useState, useEffect } from 'react'
import { API_BASE, fmtDate } from '../../utils'
import { apiFetch } from '../../utils/auth'

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

export function AccountInfoModal({ info, onClose }) {
  if (!info) return null
  return (
    <InfoModal title="Информация об аккаунте" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        {info.photo_url ? (
          <img src={info.photo_url} alt="account" style={{ width: 140, height: 140, borderRadius: 16, objectFit: 'cover', border: '2px solid var(--accent)' }} />
        ) : (
          <div style={{ width: 140, height: 140, borderRadius: 16, background: 'var(--surface2)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'var(--text-dim)' }}>👤</div>
        )}
        <div style={{ textAlign: 'center' }}>
          {info.full_name && <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>{info.full_name}</div>}
          {info.username && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>@{info.username}</div>}
        </div>
      </div>
      {info.information ? (
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '12px 16px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
          {info.information}
        </div>
      ) : (
        <div style={{ padding: 16, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center' }}>Информация не установлена</div>
      )}
    </InfoModal>
  )
}

export function UserInfoModal({ info, onClose }) {
  if (!info) return null
  const infoText = info.information
    ? (typeof info.information === 'object' ? JSON.stringify(info.information, null, 2) : String(info.information))
    : null
  return (
    <InfoModal title="Информация о собеседнике" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        {info.photo_url ? (
          <img src={info.photo_url} alt="user" style={{ width: 140, height: 140, borderRadius: 16, objectFit: 'cover', border: '2px solid #2d8f5e' }} />
        ) : (
          <div style={{ width: 140, height: 140, borderRadius: 16, background: 'var(--surface2)', border: '2px solid #2d8f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'var(--text-dim)' }}>👤</div>
        )}
        <div style={{ textAlign: 'center' }}>
          {info.full_name && <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: "'Syne', sans-serif" }}>{info.full_name}</div>}
          {info.username && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>@{info.username}</div>}
          {info.insta_link && (
            <a href={info.insta_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace", textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
              {info.insta_link}
            </a>
          )}
        </div>
      </div>
      {infoText ? (
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '12px 16px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
          {infoText}
        </div>
      ) : (
        <div style={{ padding: 16, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center' }}>Информация не установлена</div>
      )}
    </InfoModal>
  )
}

export function ContextModal({ context, onClose }) {
  return (
    <InfoModal title="Контекст чата" onClose={onClose}>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {context}
      </div>
    </InfoModal>
  )
}

export function NotesModal({ initialNotes, threadId, onClose, onSaved }) {
  const [notesText, setNotesText] = useState(initialNotes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await apiFetch(`${API_BASE}/threads/edit_thread_notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: parseInt(threadId), notes: notesText || null }),
      })
      if (res.ok) { onClose(); onSaved() }
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <InfoModal title="Заметки" onClose={onClose}>
      <textarea
        value={notesText}
        onChange={(e) => setNotesText(e.target.value)}
        placeholder="Введите заметки к чату…"
        style={{
          width: '100%', minHeight: 140, padding: '10px 12px',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--text)',
          lineHeight: 1.6, resize: 'vertical', outline: 'none',
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '6px 16px',
            background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)',
            borderRadius: 6, color: 'var(--accent)',
            fontSize: 11, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </InfoModal>
  )
}

function AttachmentCard({ att, onPreview }) {
  const a = att.attachment
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      padding: '8px 10px', borderRadius: 8,
      background: 'var(--bg)', border: '1px solid var(--border)',
    }}>
      {a.media_type === 'photo' ? (
        <img src={a.media_url} alt="" style={{
          maxWidth: '100%', borderRadius: 6, cursor: 'pointer',
        }} onClick={() => onPreview(a.media_url)} />
      ) : (
        <a href={a.media_url} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', padding: '4px 10px', borderRadius: 6,
            background: 'rgba(91,154,255,0.1)', border: '1px solid rgba(91,154,255,0.25)',
            color: '#5b9aff', fontSize: 9, fontWeight: 700,
            fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', textDecoration: 'none',
          }}>
          {a.media_type}
        </a>
      )}
      <span style={{
        fontSize: 9, color: 'var(--text-dim)',
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {fmtDate(att.ts)}
      </span>
    </div>
  )
}

export function AttachmentsModal({ threadId, onClose }) {
  const [photoPreview, setPhotoPreview] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      setError(false)
      try {
        const res = await apiFetch(`${API_BASE}/threads/${threadId}/attachments`)
        if (res.ok) {
          setAttachments(await res.json())
        } else if (res.status === 404) {
          setAttachments([])
        } else {
          setError(true)
        }
      } catch { setError(true) }
      finally { setLoading(false) }
    })()
  }, [threadId])

  const userAtts = attachments.filter(a => a.sender === 'user')
  const botAtts = attachments.filter(a => a.sender === 'assistant')

  return (
    <>
      <InfoModal title="Вложения" onClose={onClose}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
            Загрузка…
          </div>
        ) : error ? (
          <div style={{ padding: 16, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent2)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center' }}>
            Ошибка загрузки вложений
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20, minHeight: 200 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#2d8f5e', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 10 }}>
                User · {userAtts.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {userAtts.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Нет вложений</div>}
                {userAtts.map((att, i) => (
                  <AttachmentCard key={i} att={att} onPreview={setPhotoPreview} />
                ))}
              </div>
            </div>
            <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent)', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 10 }}>
                Account · {botAtts.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {botAtts.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Нет вложений</div>}
                {botAtts.map((att, i) => (
                  <AttachmentCard key={i} att={att} onPreview={setPhotoPreview} />
                ))}
              </div>
            </div>
          </div>
        )}
      </InfoModal>
      {photoPreview && (
        <div className="modal-overlay" onClick={() => setPhotoPreview(null)} style={{ zIndex: 1100 }}>
          <img src={photoPreview} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
