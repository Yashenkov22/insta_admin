import { useState } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'

export function ViewNameEditor({ account, accountId, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const handleSave = async () => {
    if (!value.trim()) return
    setSaving(true); setError(false)
    try {
      const res = await apiFetch(`${API_BASE}/account/set_view_name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: parseInt(accountId), view_name: value.trim() }),
      })
      if (res.ok) { setEditing(false); onSaved() }
      else setError(true)
    } catch { setError(true) }
    finally { setSaving(false) }
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setEditing(true); setValue(account.view_name || ''); setError(false) }}
        style={{
          padding: '4px 12px', fontSize: 10, fontWeight: 600,
          background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.25)',
          borderRadius: 6, color: 'var(--accent)',
          fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.15)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.08)'}
      >
        {account.view_name ? 'Изменить псевдоним' : 'Добавить псевдоним'}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Введите псевдоним…"
        autoFocus
        style={{
          padding: '5px 10px', fontSize: 12,
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
          fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text)',
          outline: 'none', width: 200,
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setEditing(false); setError(false) }
          if (e.key === 'Enter' && value.trim()) { e.preventDefault(); handleSave() }
        }}
      />
      <button
        onClick={handleSave}
        disabled={saving || !value.trim()}
        style={{
          padding: '5px 12px', fontSize: 10, fontWeight: 600,
          background: 'rgba(106,255,212,0.1)', border: '1px solid rgba(106,255,212,0.3)',
          borderRadius: 6, color: 'var(--accent3)',
          fontFamily: "'IBM Plex Mono', monospace",
          cursor: !value.trim() ? 'not-allowed' : 'pointer',
          opacity: !value.trim() ? 0.5 : 1,
        }}
      >
        {saving ? '…' : 'Сохранить'}
      </button>
      <button
        onClick={() => { setEditing(false); setError(false) }}
        style={{
          padding: '5px 10px', fontSize: 10, fontWeight: 600,
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 6, color: 'var(--text-muted)',
          fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
        }}
      >Отмена</button>
      {error && <span style={{ fontSize: 10, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace" }}>✕ Ошибка</span>}
    </div>
  )
}
