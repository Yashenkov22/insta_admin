import { useState } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'

export function BrowserControls({ accountId, hasProfile }) {
  const [browserStarting, setBrowserStarting] = useState(false)
  const [browserStopping, setBrowserStopping] = useState(false)
  const [browserStatus, setBrowserStatus] = useState(null)

  const handleStart = async () => {
    setBrowserStarting(true); setBrowserStatus(null)
    try {
      const res = await apiFetch(`${API_BASE}/utils/try_start_vision_profile?account_id=${parseInt(accountId)}`)
      if (res.ok) setBrowserStatus('started')
      else { setBrowserStatus('error'); console.warn('[browser] start error') }
    } catch { setBrowserStatus('error') }
    finally { setBrowserStarting(false) }
  }

  const handleStop = async () => {
    setBrowserStopping(true); setBrowserStatus(null)
    try {
      const res = await apiFetch(`${API_BASE}/utils/try_stop_vision_profile?account_id=${parseInt(accountId)}`)
      if (res.ok) setBrowserStatus('stopped')
      else setBrowserStatus('error_stop')
    } catch { setBrowserStatus('error_stop') }
    finally { setBrowserStopping(false) }
  }

  const btnBase = {
    width: '100%', padding: '7px 12px', borderRadius: 8,
    fontSize: 10, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
    transition: 'background 0.15s', textAlign: 'center',
    opacity: !hasProfile ? 0.4 : 1,
  }

  return (
    <>
      <button
        onClick={handleStart}
        disabled={browserStarting || !hasProfile}
        style={{
          ...btnBase,
          background: 'rgba(106,255,212,0.08)', border: '1px solid rgba(106,255,212,0.25)',
          color: 'var(--accent3)',
          cursor: browserStarting || !hasProfile ? 'not-allowed' : 'pointer',
        }}
      >
        {browserStarting ? 'Запуск…' : 'Запустить браузер'}
      </button>
      <button
        onClick={handleStop}
        disabled={browserStopping || !hasProfile}
        style={{
          ...btnBase,
          background: 'rgba(255,106,142,0.08)', border: '1px solid rgba(255,106,142,0.25)',
          color: 'var(--accent2)',
          cursor: browserStopping || !hasProfile ? 'not-allowed' : 'pointer',
        }}
      >
        {browserStopping ? 'Закрытие…' : 'Закрыть браузер'}
      </button>
      {browserStatus === 'started' && <span style={{ fontSize: 10, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center' }}>✓ Браузер запущен</span>}
      {browserStatus === 'stopped' && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center' }}>✓ Браузер закрыт</span>}
      {browserStatus === 'error' && <span style={{ fontSize: 10, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center' }}>✕ Ошибка запуска</span>}
      {browserStatus === 'error_stop' && <span style={{ fontSize: 10, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center' }}>✕ Ошибка закрытия</span>}
    </>
  )
}
