import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useWsEvent } from '../hooks/useWebSocket'
import { IconCoffee } from './Icons'
import { COFFEE_STATUS_STYLES } from '../utils/coffee'

const TOAST_TTL = 12000

// True when the chat page of that very thread is the one being displayed —
// it updates itself, so no toast is needed.
const isThreadPageOpen = (pathname, threadId) =>
  new RegExp(`(^|/)thread_${threadId}$`).test(pathname.replace(/\/$/, ''))

export function CoffeeToasts() {
  const { pathname } = useLocation()
  const [toasts, setToasts] = useState([])

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  useWsEvent('thread coffee state changed', (data) => {
    const payload = data.payload
    const threadId = payload?.thread_id
    const status = payload?.coffee_state?.status
    if (threadId == null || status !== 'moderating') return
    if (isThreadPageOpen(pathname, threadId)) return

    const id = `${threadId}-${Date.now()}`
    setToasts(prev => [
      ...prev.filter(t => String(t.threadId) !== String(threadId)),
      { id, threadId, status },
    ])
    setTimeout(() => dismiss(id), TOAST_TTL)
  })

  if (toasts.length === 0) return null

  const style = COFFEE_STATUS_STYLES.moderating

  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1500, display: 'flex', flexDirection: 'column', gap: 8,
      width: 'min(420px, calc(100vw - 32px))',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => window.open(`/threads/thread_${toast.threadId}`, '_blank', 'noopener')}
          title="Открыть чат в новой вкладке"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--surface)',
            border: `1px solid ${style.border}`,
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            cursor: 'pointer',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span style={{ width: 18, height: 18, color: style.color, flexShrink: 0 }}>
            <IconCoffee />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: style.color,
              fontFamily: "'Syne', sans-serif", letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              Сценарий кофе · {toast.status}
            </div>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)',
              fontFamily: "'IBM Plex Mono', monospace", marginTop: 2,
            }}>
              Чат #{toast.threadId} — требуется модерация
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(toast.id) }}
            title="Скрыть"
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 13, padding: '2px 4px', flexShrink: 0,
            }}
          >✕</button>
        </div>
      ))}
    </div>
  )
}
