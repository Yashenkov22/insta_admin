import { useState } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'

export function PhotoModal({ account, accountId, onClose, onSaved }) {
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoError, setPhotoError] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoUploading(true); setPhotoError(false); setUploadedPhoto(null)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await apiFetch(`${API_BASE}/utils/upload_file`, { method: 'POST', body: formData })
      if (res.ok) setUploadedPhoto(await res.json()); else setPhotoError(true)
    } catch { setPhotoError(true) }
    finally { setPhotoUploading(false) }
  }

  const handleSave = async () => {
    setPhotoSaving(true); setPhotoError(false)
    try {
      const res = await apiFetch(`${API_BASE}/account/set_photo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: parseInt(accountId), media_url: uploadedPhoto.media_url }),
      })
      if (res.ok) { onClose(); onSaved() }
      else setPhotoError(true)
    } catch { setPhotoError(true) }
    finally { setPhotoSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Фото аккаунта</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {account.photo_url && !uploadedPhoto && (
            <img src={account.photo_url} alt="current" style={{
              maxWidth: '100%', maxHeight: 300, borderRadius: 12,
              border: '1px solid var(--border)', objectFit: 'cover',
            }} />
          )}
          {!account.photo_url && !uploadedPhoto && (
            <div style={{
              width: 200, height: 200, borderRadius: 12,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 64, color: 'var(--text-dim)',
            }}>👤</div>
          )}
          {uploadedPhoto && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <img src={uploadedPhoto.media_preview} alt="preview" style={{
                maxWidth: '100%', maxHeight: 300, borderRadius: 12,
                border: '2px solid var(--accent)', objectFit: 'cover',
              }} />
              <span style={{ fontSize: 11, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace" }}>✓ Фото загружено</span>
            </div>
          )}
          {photoUploading && (
            <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Загрузка…</div>
          )}
          {photoError && (
            <div style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace" }}>✕ Ошибка</div>
          )}
        </div>
        <div className="modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
          {!uploadedPhoto && !photoUploading && (
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
              background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)',
              borderRadius: 6, color: 'var(--accent)', fontSize: 11, fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
            }}>
              Установить фото
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
            </label>
          )}
          {uploadedPhoto && (
            <button
              onClick={handleSave}
              disabled={photoSaving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
                background: 'rgba(106,255,212,0.1)', border: '1px solid rgba(106,255,212,0.3)',
                borderRadius: 6, color: 'var(--accent3)', fontSize: 11, fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
              }}
            >
              {photoSaving ? 'Сохранение…' : 'Подтвердить'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
