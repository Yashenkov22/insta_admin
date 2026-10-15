import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'
import { IconSpinner, IconPlus } from '../Icons'
import { ScenarioPhotoCreateModal } from './ScenarioPhotoCreateModal'

const PURPOSE_STYLES = {
  before: { label: 'до',     color: '#ffc445',        bg: 'rgba(255,196,69,0.12)', border: 'rgba(255,196,69,0.3)' },
  after:  { label: 'после',  color: 'var(--accent3)', bg: 'rgba(106,255,212,0.12)', border: 'rgba(106,255,212,0.3)' },
}

function PurposeBadge({ purpose }) {
  const s = PURPOSE_STYLES[purpose]
  return (
    <span style={{
      fontSize: 9, padding: '1px 7px', borderRadius: 4,
      background: s?.bg ?? 'var(--surface2)',
      border: `1px solid ${s?.border ?? 'var(--border)'}`,
      color: s?.color ?? 'var(--text-muted)',
      fontWeight: 700, fontFamily: "'Syne', sans-serif",
      letterSpacing: '0.5px', textTransform: 'uppercase',
    }}>
      {s?.label ?? purpose}
    </span>
  )
}

export function ScenarioPhotosModal({ accountId, onClose }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const fetchPhotos = useCallback(async () => {
    setLoading(true); setLoadError(false)
    try {
      const res = await apiFetch(`${API_BASE}/account/get_coffee_scenario_photo_list?account_id=${parseInt(accountId)}`)
      if (res.ok) {
        const data = await res.json()
        setPhotos(Array.isArray(data) ? data : [])
      } else setLoadError(true)
    } catch { setLoadError(true) }
    finally { setLoading(false) }
  }, [accountId])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  const handleDelete = async (photoId) => {
    setDeletingId(photoId); setDeleteError(false)
    try {
      const res = await apiFetch(`${API_BASE}/account/delete_coffee_scenario_photo?photo_id=${parseInt(photoId)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setPhotos(prev => prev.filter(p => String(p.id) !== String(photoId)))
        setConfirmId(null)
      } else setDeleteError(true)
    } catch { setDeleteError(true) }
    finally { setDeletingId(null) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            Фото для сценария{' '}
            {!loading && <span className="entity-tag">{photos.length}</span>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              <IconSpinner size={20} /> Загрузка…
            </div>
          )}

          {!loading && loadError && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace" }}>
              ✕ Не удалось загрузить список
            </div>
          )}

          {!loading && !loadError && photos.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
              Фото пока нет
            </div>
          )}

          {!loading && photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {photos.map((photo) => (
                <div key={photo.id} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 10, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <a href={photo.media_url} target="_blank" rel="noopener noreferrer">
                    <img src={photo.media_url} alt={photo.purpose} style={{
                      width: '100%', height: 180, objectFit: 'cover', display: 'block',
                      borderBottom: '1px solid var(--border)',
                    }} />
                  </a>
                  <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PurposeBadge purpose={photo.purpose} />
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", flex: 1 }}>
                      #{photo.id}
                    </span>
                    {confirmId === photo.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleDelete(photo.id)}
                          disabled={deletingId === photo.id}
                          style={{
                            padding: '3px 9px', fontSize: 9, fontWeight: 700,
                            background: 'rgba(255,106,142,0.15)', border: '1px solid rgba(255,106,142,0.4)',
                            borderRadius: 5, color: 'var(--accent2)',
                            fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
                            opacity: deletingId === photo.id ? 0.6 : 1,
                          }}
                        >
                          {deletingId === photo.id ? '…' : 'Удалить'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          style={{
                            padding: '3px 9px', fontSize: 9, fontWeight: 700,
                            background: 'transparent', border: '1px solid var(--border)',
                            borderRadius: 5, color: 'var(--text-muted)',
                            fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
                          }}
                        >Отмена</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setConfirmId(photo.id); setDeleteError(false) }}
                        title="Удалить фото"
                        style={{
                          width: 24, height: 24, borderRadius: 6,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(255,106,142,0.1)', border: '1px solid rgba(255,106,142,0.3)',
                          color: 'var(--accent2)', fontSize: 11, cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {deleteError && (
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center' }}>
              ✕ Не удалось удалить
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <IconPlus /> Добавить
          </button>
        </div>
      </div>

      {showCreate && (
        <ScenarioPhotoCreateModal
          accountId={accountId}
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            if (created) setPhotos(prev => [...prev, created])
            else fetchPhotos()
          }}
        />
      )}
    </div>
  )
}
