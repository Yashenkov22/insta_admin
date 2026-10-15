import { useState } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'
import { IconCheck } from '../Icons'

export function ScenarioPhotoCreateModal({ accountId, onClose, onCreated }) {
  const [uploaded, setUploaded] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setUploading(true); setUploadError(false); setUploaded(null); setSaveError('')
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await apiFetch(`${API_BASE}/utils/upload_file`, { method: 'POST', body: formData })
      if (res.ok) setUploaded(await res.json()); else setUploadError(true)
    } catch { setUploadError(true) }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    if (!uploaded?.media_url) return
    setSaving(true); setSaveError('')
    try {
      const res = await apiFetch(`${API_BASE}/account/create_coffee_scenario_photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: parseInt(accountId),
          media_url: uploaded.media_url,
          purpose: 'before',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError(typeof err.detail === 'string' ? err.detail : `Error ${res.status}`)
        return
      }
      const created = await res.json().catch(() => null)
      onCreated(created)
      onClose()
    } catch (e) {
      setSaveError('Network error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = {
    fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase',
    color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif",
    fontWeight: 700, marginBottom: 8,
  }

  return (
    // nested above the list modal
    // stopPropagation: this overlay sits inside the list modal's overlay,
    // whose own click handler would otherwise close both at once.
    <div
      className="modal-overlay"
      style={{ zIndex: 1100 }}
      onClick={(e) => { e.stopPropagation(); onClose() }}
    >
      <div className="modal" style={{ width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Новое фото для сценария</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* media file */}
          <div>
            <div style={labelStyle}>Фото *</div>
            {uploaded && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <img src={uploaded.media_preview} alt="preview" style={{
                  maxWidth: '100%', maxHeight: 260, borderRadius: 10,
                  border: '2px solid var(--accent)', objectFit: 'cover',
                }} />
                <span style={{ fontSize: 11, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace" }}>
                  ✓ Фото загружено
                </span>
              </div>
            )}
            {uploading && (
              <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                Загрузка файла…
              </div>
            )}
            {uploadError && (
              <div className="form-error" style={{ marginBottom: 8 }}>✕ Ошибка загрузки</div>
            )}
            {!uploading && (
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)',
                borderRadius: 6, color: 'var(--accent)', fontSize: 11, fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
              }}>
                {uploaded ? 'Выбрать другое фото' : 'Выбрать фото'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
              </label>
            )}
          </div>

          {saveError && <div className="form-error" style={{ fontSize: 12 }}>{saveError}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !uploaded?.media_url}>
            {saving ? <span className="modal-spinner" /> : <IconCheck />}
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
