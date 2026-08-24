import { useState } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'

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

export function ChatInfoBar({ threadInfo, threadId, onOpenModal }) {
  const [markingRead, setMarkingRead] = useState(false)
  const [markReadDone, setMarkReadDone] = useState(false)

  const handleMarkRead = async () => {
    setMarkingRead(true)
    try {
      const res = await apiFetch(`${API_BASE}/threads/edit_unread_mark`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: parseInt(threadId) }),
      })
      if (res.ok) {
        setMarkReadDone(true)
        setTimeout(() => setMarkReadDone(false), 3000)
      }
    } catch {}
    finally { setMarkingRead(false) }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px',
      borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      flexShrink: 0,
    }}>
      {/* Left: user photo + name */}
      <div
        onClick={() => onOpenModal('user')}
        style={{ flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
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
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace" }}>
          {threadInfo?.user_information?.username || '—'}
        </span>
      </div>

      {/* Center: buttons */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
        <InfoButton label="Контекст" onClick={() => onOpenModal('context')} disabled={!threadInfo?.context} />
        <InfoButton label="Заметки" onClick={() => onOpenModal('notes')} disabled={false} />
        <InfoButton label="Вложения" onClick={() => onOpenModal('attachments')} disabled={false} />
        <button
          onClick={handleMarkRead}
          disabled={markingRead}
          style={{
            padding: '8px 14px', whiteSpace: 'nowrap',
            background: markReadDone ? 'rgba(106,255,212,0.12)' : 'rgba(124,106,255,0.08)',
            border: `1px solid ${markReadDone ? 'rgba(106,255,212,0.25)' : 'rgba(124,106,255,0.25)'}`,
            borderRadius: 8,
            color: markReadDone ? 'var(--accent3)' : 'var(--accent)',
            fontSize: 10, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
            cursor: markingRead ? 'wait' : 'pointer',
            opacity: markingRead ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          {markingRead ? '…' : markReadDone ? '✓ Прочитан' : '✉ Прочитано'}
        </button>
        <button
          onClick={() => onOpenModal('settings')}
          title="Настройки чата"
          style={{
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(124,106,255,0.08)',
            border: '1px solid rgba(124,106,255,0.25)',
            color: 'var(--accent)',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.08)'}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" />
          </svg>
        </button>
      </div>

      {/* Right: account photo + name */}
      <div
        onClick={() => onOpenModal('account')}
        style={{ flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        title={threadInfo?.account_information?.username || 'Аккаунт'}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace" }}>
          {threadInfo?.account_information?.username || '—'}
        </span>
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
  )
}
