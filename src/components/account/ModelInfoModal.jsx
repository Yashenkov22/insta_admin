import { useState } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'

export function ModelInfoModal({ account, accountId, onClose, onSaved }) {
  const [newLore, setNewLore] = useState('')
  const [loreSaving, setLoreSaving] = useState(false)
  const [loreError, setLoreError] = useState(false)
  const [loreOk, setLoreOk] = useState(false)

  const handleSave = async () => {
    if (!newLore.trim()) return
    setLoreSaving(true); setLoreError(false); setLoreOk(false)
    try {
      const res = await apiFetch(`${API_BASE}/account/set_information`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: parseInt(accountId), information: newLore.trim() }),
      })
      if (res.ok) { setLoreOk(true); setNewLore(''); onSaved(); setTimeout(() => setLoreOk(false), 2000) }
      else setLoreError(true)
    } catch { setLoreError(true) }
    finally { setLoreSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Информация о модели</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {account.information ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 8 }}>Текущий ЛОР</div>
              <div style={{
                fontSize: 13, color: 'var(--text)', lineHeight: 1.7,
                fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                padding: '12px 16px', borderRadius: 8,
                background: 'var(--bg)', border: '1px solid var(--border)',
                maxHeight: 240, overflowY: 'auto',
              }}>{account.information}</div>
            </div>
          ) : (
            <div style={{
              padding: '16px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace",
              textAlign: 'center', marginBottom: 20,
            }}>
              ЛОР не установлен
            </div>
          )}

          <div style={{ fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 8 }}>Установить новый ЛОР</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <textarea
              value={newLore}
              onChange={(e) => setNewLore(e.target.value)}
              placeholder="Введите новый ЛОР для модели…"
              style={{
                flex: 1, minHeight: 100, padding: '10px 12px',
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--text)',
                lineHeight: 1.6, resize: 'vertical', outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={handleSave}
              disabled={loreSaving || !newLore.trim()}
              style={{
                padding: '10px 16px', flexShrink: 0,
                background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)',
                borderRadius: 8, color: 'var(--accent)', fontSize: 10, fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace", cursor: !newLore.trim() ? 'not-allowed' : 'pointer',
                opacity: !newLore.trim() ? 0.5 : 1, transition: 'background 0.15s',
              }}
            >
              {loreSaving ? 'Сохранение…' : 'Обновить'}
            </button>
          </div>
          {loreOk && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace" }}>✓ ЛОР обновлён</div>}
          {loreError && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace" }}>✕ Ошибка обновления</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}
