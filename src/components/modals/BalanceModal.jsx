import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'
import { IconDollar, IconSpinner } from '../Icons'

export function BalanceModal({ onClose }) {
  const [balance, setBalance] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchBalance = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await apiFetch(`${API_BASE}/utils/get_balance`)
      if (res.ok) {
        // the endpoint answers with a bare JSON string
        const text = await res.text()
        setBalance(text.replace(/^"|"$/g, ''))
      } else {
        const err = await res.json().catch(() => ({}))
        setError(typeof err.detail === 'string' ? err.detail : `Error ${res.status}`)
      }
    } catch (e) { setError('Network error: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Баланс</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 14, padding: '32px 24px',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              <IconSpinner size={20} /> Загрузка…
            </div>
          ) : error ? (
            <div className="form-error" style={{ fontSize: 12, textAlign: 'center' }}>✕ {error}</div>
          ) : (
            <>
              <span style={{ width: 28, height: 28, color: 'var(--accent3)' }}><IconDollar /></span>
              <div style={{
                fontSize: 18, fontWeight: 700, color: 'var(--text)',
                fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center',
                wordBreak: 'break-word',
              }}>
                {balance}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={fetchBalance} disabled={loading}>Обновить</button>
        </div>
      </div>
    </div>
  )
}
