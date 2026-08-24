import { useState, useEffect } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'

export function ProfileLinkModal({ account, accountId, onClose, onSaved }) {
  const hasProfile = account?.folder_id && account?.profile_id

  const [folders, setFolders] = useState([])
  const [foldersLoading, setFoldersLoading] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  useEffect(() => {
    (async () => {
      setFoldersLoading(true)
      try {
        const res = await apiFetch(`${API_BASE}/utils/folders`)
        if (res.ok) setFolders(await res.json())
      } catch { setFolders([]) }
      finally { setFoldersLoading(false) }
    })()
  }, [])

  const handleSelectFolder = async (folder) => {
    setSelectedFolder(folder)
    setSelectedProfile(null)
    setProfiles([])
    setProfilesLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/utils/folder_profiles?folder_id=${folder.folder_id}`)
      if (res.ok) setProfiles(await res.json())
    } catch { setProfiles([]) }
    finally { setProfilesLoading(false) }
  }

  const handleLinkProfile = async () => {
    if (!selectedFolder || !selectedProfile) return
    setLinking(true); setLinkError(false)
    try {
      const res = await apiFetch(`${API_BASE}/account/update_profile_data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: parseInt(accountId), folder_id: selectedFolder.folder_id, profile_id: selectedProfile.profile_id }),
      })
      if (res.ok) { onClose(); onSaved() }
      else setLinkError(true)
    } catch { setLinkError(true) }
    finally { setLinking(false) }
  }

  const showSelector = !hasProfile || editingProfile

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{hasProfile ? 'Информация профиля' : 'Привязать профиль'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {hasProfile && !editingProfile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 120, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Folder ID</div>
                <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace", wordBreak: 'break-all' }}>{account.folder_id}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 120, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Profile ID</div>
                <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace", wordBreak: 'break-all' }}>{account.profile_id}</div>
              </div>
              <button
                onClick={() => { setEditingProfile(true); setSelectedFolder(null); setSelectedProfile(null); setLinkError(false) }}
                style={{
                  alignSelf: 'flex-start', padding: '7px 16px', marginTop: 4,
                  background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)',
                  borderRadius: 6, color: 'var(--accent)', fontSize: 10, fontWeight: 600,
                  fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
                }}
              >Изменить</button>
            </div>
          )}

          {showSelector && (
            <div>
              <div style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 10 }}>
                1. Выберите папку
              </div>
              {foldersLoading ? (
                <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Загрузка папок…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                  {folders.map((f) => (
                    <div
                      key={f.folder_id}
                      onClick={() => handleSelectFolder(f)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                        background: selectedFolder?.folder_id === f.folder_id ? 'rgba(124,106,255,0.12)' : 'var(--surface)',
                        border: `1px solid ${selectedFolder?.folder_id === f.folder_id ? 'rgba(124,106,255,0.3)' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: f.folder_color || 'var(--surface2)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>{f.folder_name}</span>
                      {selectedFolder?.folder_id === f.folder_id && (
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)' }}>✓</span>
                      )}
                    </div>
                  ))}
                  {folders.length === 0 && !foldersLoading && (
                    <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 11 }}>Нет доступных папок</div>
                  )}
                </div>
              )}

              {selectedFolder && (
                <>
                  <div style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 10 }}>
                    2. Выберите профиль
                  </div>
                  {profilesLoading ? (
                    <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Загрузка профилей…</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {profiles.map((p) => (
                        <div
                          key={p.profile_id}
                          onClick={() => setSelectedProfile(p)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                            background: selectedProfile?.profile_id === p.profile_id ? 'rgba(124,106,255,0.12)' : 'var(--surface)',
                            border: `1px solid ${selectedProfile?.profile_id === p.profile_id ? 'rgba(124,106,255,0.3)' : 'var(--border)'}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>{p.profile_name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>{p.profile_status}</div>
                          </div>
                          {selectedProfile?.profile_id === p.profile_id && (
                            <span style={{ fontSize: 11, color: 'var(--accent)', flexShrink: 0 }}>✓</span>
                          )}
                        </div>
                      ))}
                      {profiles.length === 0 && !profilesLoading && (
                        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 11 }}>Нет профилей в этой папке</div>
                      )}
                    </div>
                  )}
                </>
              )}

              {linkError && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: 'rgba(255,106,142,0.08)', border: '1px solid rgba(255,106,142,0.25)', color: 'var(--accent2)', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
                  ✕ Ошибка привязки профиля
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
          {showSelector && selectedFolder && selectedProfile && (
            <button
              onClick={handleLinkProfile}
              disabled={linking}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
                background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)',
                borderRadius: 6, color: 'var(--accent)', fontSize: 11, fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace", cursor: 'pointer',
              }}
            >
              {linking ? 'Привязка…' : 'Привязать профиль к аккаунту'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
