import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { EmptyState } from '../components/ui'
import { IconUser, IconBack, IconSpinner } from '../components/Icons'
import { fmt, fmtDate, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'
import { useBackPath } from '../hooks/useBackPath'
import { usePathParams } from '../hooks/usePathParams'

export function AccountDetailPage() {
  const { account: accountId } = usePathParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = useBackPath()
  const currentPath = location.pathname.replace(/\/$/, '')

  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [newLore, setNewLore] = useState('')
  const [loreSaving, setLoreSaving] = useState(false)
  const [loreError, setLoreError] = useState(false)
  const [loreOk, setLoreOk] = useState(false)

  // View name state
  const [viewNameEditing, setViewNameEditing] = useState(false)
  const [viewNameValue, setViewNameValue] = useState('')
  const [viewNameSaving, setViewNameSaving] = useState(false)
  const [viewNameError, setViewNameError] = useState(false)

  // Browser profile state
  const [browserStarting, setBrowserStarting] = useState(false)
  const [browserStopping, setBrowserStopping] = useState(false)
  const [browserStatus, setBrowserStatus] = useState(null) // 'started' | 'stopped' | 'error' | 'error_stop'

  // Photo modal state
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoError, setPhotoError] = useState(false)

  // Profile linking state
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [folders, setFolders] = useState([])
  const [foldersLoading, setFoldersLoading] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  const fetchAccount = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/account/${accountId}`)
      if (res.ok) setAccount(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [accountId])

  useEffect(() => { fetchAccount() }, [fetchAccount])

  const handleToggleActive = async () => {
    if (toggling || !account) return
    const newValue = !account.is_active
    setToggling(true)
    setAccount(prev => ({ ...prev, is_active: newValue }))
    try {
      const res = await apiFetch(`${API_BASE}/account/update_active_status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: parseInt(accountId), is_active: newValue }),
      })
      if (!res.ok) setAccount(prev => ({ ...prev, is_active: !newValue }))
    } catch { setAccount(prev => ({ ...prev, is_active: !newValue })) }
    finally { setToggling(false) }
  }

  const openProfileModal = async () => {
    setProfileModalOpen(true)
    setSelectedFolder(null)
    setSelectedProfile(null)
    setProfiles([])
    setLinkError(false)
    setEditingProfile(false)
    setFoldersLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/utils/folders`)
      if (res.ok) setFolders(await res.json())
    } catch { setFolders([]) }
    finally { setFoldersLoading(false) }
  }

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
      if (res.ok) { setProfileModalOpen(false); fetchAccount() }
      else setLinkError(true)
    } catch { setLinkError(true) }
    finally { setLinking(false) }
  }

  const closeProfileModal = () => { setProfileModalOpen(false); setLinkError(false) }

  const hasProfile = account?.folder_id && account?.profile_id

  if (loading) {
    return (<div className="page"><div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'var(--text-muted)',fontSize:12 }}><IconSpinner size={28} />Loading…</div></div>)
  }
  if (!account) {
    return (<div className="page"><EmptyState icon={<IconUser />} title="Account not found" /></div>)
  }

  const threadCount = account.thread_count ?? 0
  const hasUnread = account.has_unread ?? false

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">Account <span className="entity-tag">detail</span></div>
            <div className="page-subtitle">ID #{fmt(account.id)}</div>
          </div>
          <div style={{ display:'flex',gap:6,alignItems:'center',flexShrink:0 }}>
            <button onClick={() => navigate(backPath)} className="btn btn-back"><IconBack /> Back</button>
            <button
              onClick={() => threadCount > 0 && navigate(`${currentPath}/threads`)}
              disabled={threadCount === 0}
              style={{
                display:'inline-flex',alignItems:'center',gap:6,padding:'5px 14px',height:30,
                background: threadCount === 0 ? 'var(--surface2)' : hasUnread ? 'rgba(255,106,142,0.1)' : 'rgba(106,255,212,0.08)',
                border: `1px solid ${threadCount === 0 ? 'var(--border)' : hasUnread ? 'rgba(255,106,142,0.3)' : 'rgba(106,255,212,0.25)'}`,
                borderRadius:6,
                color: threadCount === 0 ? 'var(--text-dim)' : hasUnread ? 'var(--accent2)' : 'var(--accent3)',
                fontSize:11,fontWeight:600,fontFamily:"'IBM Plex Mono', monospace",
                cursor: threadCount === 0 ? 'not-allowed' : 'pointer',
                whiteSpace:'nowrap',opacity: threadCount === 0 ? 0.5 : 1,
              }}
            >
              To threads
              <span style={{
                fontSize:10,padding:'1px 7px',
                background: threadCount === 0 ? 'var(--bg)' : hasUnread ? 'rgba(255,106,142,0.15)' : 'rgba(106,255,212,0.12)',
                border: `1px solid ${threadCount === 0 ? 'var(--border)' : hasUnread ? 'rgba(255,106,142,0.3)' : 'rgba(106,255,212,0.25)'}`,
                borderRadius:10,lineHeight:'18px',
              }}>{threadCount}</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding:'32px 40px',flex:1,overflowY:'auto',minHeight:0 }}>
        <div style={{ display:'flex',gap:40,alignItems:'flex-start' }}>

          {/* Left: photo + buttons */}
          <div style={{ flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:10,width:160 }}>
            <div
              onClick={() => { setPhotoModalOpen(true); setUploadedPhoto(null); setPhotoError(false) }}
              style={{ cursor:'pointer',position:'relative' }}
              title="Нажмите для изменения фото"
            >
              {account.photo_url ? (
                <img src={account.photo_url} alt={account.username} style={{
                  width:160,height:160,borderRadius:16,objectFit:'cover',
                  border:'2px solid var(--border)',boxShadow:'0 4px 24px rgba(0,0,0,0.2)',
                  transition:'border-color 0.15s',
                }} />
              ) : (
                <div style={{
                  width:160,height:160,borderRadius:16,
                  background:'var(--surface2)',border:'2px solid var(--border)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:56,color:'var(--text-dim)',boxShadow:'0 4px 24px rgba(0,0,0,0.2)',
                  transition:'border-color 0.15s',
                }}>👤</div>
              )}
              <div style={{
                position:'absolute',bottom:6,right:6,width:28,height:28,borderRadius:8,
                background:'var(--surface)',border:'1px solid var(--border)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:13,boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
              }}>📷</div>
            </div>
            <button onClick={() => { setShowInfo(true); setNewLore(''); setLoreError(false); setLoreOk(false) }} style={{
              width:'100%',padding:'7px 12px',
              background:'rgba(124,106,255,0.1)',border:'1px solid rgba(124,106,255,0.3)',
              borderRadius:8,color:'var(--accent)',fontSize:10,fontWeight:600,
              fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',
              transition:'background 0.15s',textAlign:'center',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.1)'}
            >Информация о модели</button>
            <button onClick={openProfileModal} style={{
              width:'100%',padding:'7px 12px',
              background: hasProfile ? 'rgba(106,255,212,0.08)' : 'rgba(255,196,69,0.08)',
              border: `1px solid ${hasProfile ? 'rgba(106,255,212,0.25)' : 'rgba(255,196,69,0.25)'}`,
              borderRadius:8,
              color: hasProfile ? 'var(--accent3)' : '#ffc445',
              fontSize:10,fontWeight:600,fontFamily:"'IBM Plex Mono', monospace",
              cursor:'pointer',transition:'background 0.15s',textAlign:'center',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = hasProfile ? 'rgba(106,255,212,0.15)' : 'rgba(255,196,69,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = hasProfile ? 'rgba(106,255,212,0.08)' : 'rgba(255,196,69,0.08)'}
            >
              {hasProfile ? 'Информация профиля' : 'Привязать профиль'}
            </button>
            <button
              onClick={async () => {
                setBrowserStarting(true); setBrowserStatus(null)
                try {
                  const res = await apiFetch(`${API_BASE}/utils/try_start_vision_profile?account_id=${parseInt(accountId)}`)
                  if (res.ok) setBrowserStatus('started')
                  else { const err = await res.json().catch(() => ({})); setBrowserStatus('error'); console.warn('[browser] start error:', err.detail) }
                } catch { setBrowserStatus('error') }
                finally { setBrowserStarting(false) }
              }}
              disabled={browserStarting || !hasProfile}
              style={{
                width:'100%',padding:'7px 12px',
                background:'rgba(106,255,212,0.08)',border:'1px solid rgba(106,255,212,0.25)',
                borderRadius:8,color:'var(--accent3)',fontSize:10,fontWeight:600,
                fontFamily:"'IBM Plex Mono', monospace",
                cursor: browserStarting || !hasProfile ? 'not-allowed' : 'pointer',
                transition:'background 0.15s',textAlign:'center',
                opacity: !hasProfile ? 0.4 : 1,
              }}
            >
              {browserStarting ? 'Запуск…' : 'Запустить браузер'}
            </button>
            <button
              onClick={async () => {
                setBrowserStopping(true); setBrowserStatus(null)
                try {
                  const res = await apiFetch(`${API_BASE}/utils/try_stop_vision_profile?account_id=${parseInt(accountId)}`)
                  if (res.ok) setBrowserStatus('stopped')
                  else setBrowserStatus('error_stop')
                } catch { setBrowserStatus('error_stop') }
                finally { setBrowserStopping(false) }
              }}
              disabled={browserStopping || !hasProfile}
              style={{
                width:'100%',padding:'7px 12px',
                background:'rgba(255,106,142,0.08)',border:'1px solid rgba(255,106,142,0.25)',
                borderRadius:8,color:'var(--accent2)',fontSize:10,fontWeight:600,
                fontFamily:"'IBM Plex Mono', monospace",
                cursor: browserStopping || !hasProfile ? 'not-allowed' : 'pointer',
                transition:'background 0.15s',textAlign:'center',
                opacity: !hasProfile ? 0.4 : 1,
              }}
            >
              {browserStopping ? 'Закрытие…' : 'Закрыть браузер'}
            </button>
            {browserStatus === 'started' && <span style={{ fontSize:10,color:'var(--accent3)',fontFamily:"'IBM Plex Mono', monospace",textAlign:'center' }}>✓ Браузер запущен</span>}
            {browserStatus === 'stopped' && <span style={{ fontSize:10,color:'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",textAlign:'center' }}>✓ Браузер закрыт</span>}
            {browserStatus === 'error' && <span style={{ fontSize:10,color:'var(--accent2)',fontFamily:"'IBM Plex Mono', monospace",textAlign:'center' }}>✕ Ошибка запуска</span>}
            {browserStatus === 'error_stop' && <span style={{ fontSize:10,color:'var(--accent2)',fontFamily:"'IBM Plex Mono', monospace",textAlign:'center' }}>✕ Ошибка закрытия</span>}
          </div>

          {/* Right: info */}
          <div style={{ flex:1,minWidth:280 }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:22,fontWeight:700,color:'var(--text)',fontFamily:"'Syne', sans-serif",lineHeight:1.3 }}>
                {account.view_name || account.fullname || account.username}
              </div>
              <div style={{ fontSize:13,color:'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",marginTop:4 }}>@{account.username}</div>

              {/* View name edit */}
              <div style={{ marginTop:10,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                {viewNameEditing ? (
                  <>
                    <input
                      value={viewNameValue}
                      onChange={(e) => setViewNameValue(e.target.value)}
                      placeholder="Введите псевдоним…"
                      autoFocus
                      style={{
                        padding:'5px 10px',fontSize:12,
                        background:'var(--bg)',border:'1px solid var(--border)',borderRadius:6,
                        fontFamily:"'IBM Plex Mono', monospace",color:'var(--text)',
                        outline:'none',width:200,
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') { setViewNameEditing(false); setViewNameError(false) }
                        if (e.key === 'Enter' && viewNameValue.trim()) {
                          e.preventDefault()
                          document.getElementById('viewname-save-btn')?.click()
                        }
                      }}
                    />
                    <button
                      id="viewname-save-btn"
                      onClick={async () => {
                        if (!viewNameValue.trim()) return
                        setViewNameSaving(true); setViewNameError(false)
                        try {
                          const res = await apiFetch(`${API_BASE}/account/set_view_name`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ account_id: parseInt(accountId), view_name: viewNameValue.trim() }),
                          })
                          if (res.ok) { setViewNameEditing(false); fetchAccount() }
                          else setViewNameError(true)
                        } catch { setViewNameError(true) }
                        finally { setViewNameSaving(false) }
                      }}
                      disabled={viewNameSaving || !viewNameValue.trim()}
                      style={{
                        padding:'5px 12px',fontSize:10,fontWeight:600,
                        background:'rgba(106,255,212,0.1)',border:'1px solid rgba(106,255,212,0.3)',
                        borderRadius:6,color:'var(--accent3)',
                        fontFamily:"'IBM Plex Mono', monospace",
                        cursor: !viewNameValue.trim() ? 'not-allowed' : 'pointer',
                        opacity: !viewNameValue.trim() ? 0.5 : 1,
                      }}
                    >
                      {viewNameSaving ? '…' : 'Сохранить'}
                    </button>
                    <button
                      onClick={() => { setViewNameEditing(false); setViewNameError(false) }}
                      style={{
                        padding:'5px 10px',fontSize:10,fontWeight:600,
                        background:'transparent',border:'1px solid var(--border)',
                        borderRadius:6,color:'var(--text-muted)',
                        fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',
                      }}
                    >Отмена</button>
                    {viewNameError && <span style={{ fontSize:10,color:'var(--accent2)',fontFamily:"'IBM Plex Mono', monospace" }}>✕ Ошибка</span>}
                  </>
                ) : (
                  <button
                    onClick={() => { setViewNameEditing(true); setViewNameValue(account.view_name || ''); setViewNameError(false) }}
                    style={{
                      padding:'4px 12px',fontSize:10,fontWeight:600,
                      background:'rgba(124,106,255,0.08)',border:'1px solid rgba(124,106,255,0.25)',
                      borderRadius:6,color:'var(--accent)',
                      fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',
                      transition:'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.08)'}
                  >
                    {account.view_name ? 'Изменить псевдоним' : 'Добавить псевдоним'}
                  </button>
                )}
              </div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden' }}>
              <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)',borderRight:'1px solid var(--border)' }}>
                <div style={{ fontSize:9,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:6 }}>Created</div>
                <div style={{ fontSize:12,color:'var(--text)',fontFamily:"'IBM Plex Mono', monospace" }}>{fmtDate(account.created_at)}</div>
              </div>
              <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:9,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:6 }}>Updated</div>
                <div style={{ fontSize:12,color:'var(--text)',fontFamily:"'IBM Plex Mono', monospace" }}>{fmtDate(account.updated_at)}</div>
              </div>
              <div style={{ padding:'14px 20px',borderRight:'1px solid var(--border)' }}>
                <div style={{ fontSize:9,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:6 }}>Status</div>
                {account.has_error ? (
                  <span style={{ display:'inline-flex',alignItems:'center',gap:6,fontSize:12,color:'var(--accent2)',fontFamily:"'IBM Plex Mono', monospace",fontWeight:600 }}>
                    <span style={{ width:20,height:20,borderRadius:'50%',background:'rgba(255,106,142,0.15)',border:'1px solid rgba(255,106,142,0.3)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700 }}>!</span>Error
                  </span>
                ) : (
                  <span style={{ display:'inline-flex',alignItems:'center',gap:6,fontSize:12,color:'var(--accent3)',fontFamily:"'IBM Plex Mono', monospace",fontWeight:600 }}>
                    <span style={{ width:20,height:20,borderRadius:'50%',background:'rgba(106,255,212,0.12)',border:'1px solid rgba(106,255,212,0.25)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12 }}>✓</span>OK
                  </span>
                )}
              </div>
              <div style={{ padding:'14px 20px' }}>
                <div style={{ fontSize:9,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:6 }}>Active</div>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div onClick={handleToggleActive} style={{
                    width:40,height:22,borderRadius:11,cursor: toggling ? 'wait' : 'pointer',
                    background: account.is_active ? 'rgba(106,255,212,0.25)' : 'var(--surface2)',
                    border: account.is_active ? '1px solid rgba(106,255,212,0.4)' : '1px solid var(--border)',
                    position:'relative',transition:'all 0.2s',flexShrink:0,opacity: toggling ? 0.6 : 1,
                  }}>
                    <div style={{ width:16,height:16,borderRadius:'50%',background: account.is_active ? 'var(--accent3)' : 'var(--text-muted)',position:'absolute',top:2,left: account.is_active ? 21 : 2,transition:'all 0.2s' }} />
                  </div>
                  <span style={{ fontSize:12,color: account.is_active ? 'var(--accent3)' : 'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",fontWeight:600 }}>{account.is_active ? 'active' : 'inactive'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo modal */}
      {photoModalOpen && (
        <div className="modal-overlay" onClick={() => setPhotoModalOpen(false)}>
          <div className="modal" style={{ width:480,maxHeight:'80vh',display:'flex',flexDirection:'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Фото аккаунта</div><button className="modal-close" onClick={() => setPhotoModalOpen(false)}>✕</button></div>
            <div className="modal-body" style={{ flex:1,overflowY:'auto',display:'flex',flexDirection:'column',alignItems:'center',gap:16 }}>

              {/* Current photo */}
              {account.photo_url && !uploadedPhoto && (
                <img src={account.photo_url} alt="current" style={{
                  maxWidth:'100%',maxHeight:300,borderRadius:12,
                  border:'1px solid var(--border)',objectFit:'cover',
                }} />
              )}
              {!account.photo_url && !uploadedPhoto && (
                <div style={{
                  width:200,height:200,borderRadius:12,
                  background:'var(--surface2)',border:'1px solid var(--border)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:64,color:'var(--text-dim)',
                }}>👤</div>
              )}

              {/* Upload preview */}
              {uploadedPhoto && (
                <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:10 }}>
                  <img src={uploadedPhoto.media_preview} alt="preview" style={{
                    maxWidth:'100%',maxHeight:300,borderRadius:12,
                    border:'2px solid var(--accent)',objectFit:'cover',
                  }} />
                  <span style={{ fontSize:11,color:'var(--accent3)',fontFamily:"'IBM Plex Mono', monospace" }}>✓ Фото загружено</span>
                </div>
              )}

              {photoUploading && (
                <div style={{ padding:16,color:'var(--text-muted)',fontSize:12,fontFamily:"'IBM Plex Mono', monospace" }}>Загрузка…</div>
              )}

              {photoError && (
                <div style={{ fontSize:11,color:'var(--accent2)',fontFamily:"'IBM Plex Mono', monospace" }}>✕ Ошибка</div>
              )}
            </div>

            <div className="modal-footer" style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setPhotoModalOpen(false)}>Закрыть</button>

              {/* Upload button */}
              {!uploadedPhoto && !photoUploading && (
                <label style={{
                  display:'inline-flex',alignItems:'center',gap:6,padding:'6px 16px',
                  background:'rgba(124,106,255,0.1)',border:'1px solid rgba(124,106,255,0.3)',
                  borderRadius:6,color:'var(--accent)',fontSize:11,fontWeight:600,
                  fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',
                }}>
                  Установить фото
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={async (e) => {
                    const file = e.target.files[0]
                    if (!file) return
                    setPhotoUploading(true); setPhotoError(false); setUploadedPhoto(null)
                    try {
                      const formData = new FormData(); formData.append('file', file)
                      const res = await apiFetch(`${API_BASE}/utils/upload_file`, { method:'POST', body: formData })
                      if (res.ok) setUploadedPhoto(await res.json()); else setPhotoError(true)
                    } catch { setPhotoError(true) }
                    finally { setPhotoUploading(false) }
                  }} />
                </label>
              )}

              {/* Confirm button */}
              {uploadedPhoto && (
                <button
                  onClick={async () => {
                    setPhotoSaving(true); setPhotoError(false)
                    try {
                      const res = await apiFetch(`${API_BASE}/account/set_photo`, {
                        method:'PATCH',
                        headers: { 'Content-Type':'application/json' },
                        body: JSON.stringify({ account_id: parseInt(accountId), media_url: uploadedPhoto.media_url }),
                      })
                      if (res.ok) { setPhotoModalOpen(false); fetchAccount() }
                      else setPhotoError(true)
                    } catch { setPhotoError(true) }
                    finally { setPhotoSaving(false) }
                  }}
                  disabled={photoSaving}
                  style={{
                    display:'inline-flex',alignItems:'center',gap:6,padding:'6px 16px',
                    background:'rgba(106,255,212,0.1)',border:'1px solid rgba(106,255,212,0.3)',
                    borderRadius:6,color:'var(--accent3)',fontSize:11,fontWeight:600,
                    fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',
                  }}
                >
                  {photoSaving ? 'Сохранение…' : 'Подтвердить'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Model info modal */}
      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal" style={{ width:600,maxHeight:'80vh',display:'flex',flexDirection:'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Информация о модели</div><button className="modal-close" onClick={() => setShowInfo(false)}>✕</button></div>
            <div className="modal-body" style={{ flex:1,overflowY:'auto' }}>

              {/* Current information */}
              {account.information ? (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:9,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:8 }}>Текущий ЛОР</div>
                  <div style={{
                    fontSize:13,color:'var(--text)',lineHeight:1.7,
                    fontFamily:"'IBM Plex Mono', monospace",whiteSpace:'pre-wrap',wordBreak:'break-word',
                    padding:'12px 16px',borderRadius:8,
                    background:'var(--bg)',border:'1px solid var(--border)',
                    maxHeight:240,overflowY:'auto',
                  }}>{account.information}</div>
                </div>
              ) : (
                <div style={{
                  padding:'16px',borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',
                  color:'var(--text-muted)',fontSize:12,fontFamily:"'IBM Plex Mono', monospace",
                  textAlign:'center',marginBottom:20,
                }}>
                  ЛОР не установлен
                </div>
              )}

              {/* Set new lore */}
              <div style={{ fontSize:9,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:8 }}>Установить новый ЛОР</div>
              <div style={{ display:'flex',gap:8,alignItems:'flex-start' }}>
                <textarea
                  value={newLore}
                  onChange={(e) => setNewLore(e.target.value)}
                  placeholder="Введите новый ЛОР для модели…"
                  style={{
                    flex:1,minHeight:100,padding:'10px 12px',
                    background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,
                    fontFamily:"'IBM Plex Mono', monospace",fontSize:12,color:'var(--text)',
                    lineHeight:1.6,resize:'vertical',outline:'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  onClick={async () => {
                    if (!newLore.trim()) return
                    setLoreSaving(true); setLoreError(false); setLoreOk(false)
                    try {
                      const res = await apiFetch(`${API_BASE}/account/set_information`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ account_id: parseInt(accountId), information: newLore.trim() }),
                      })
                      if (res.ok) { setLoreOk(true); setNewLore(''); fetchAccount(); setTimeout(() => setLoreOk(false), 2000) }
                      else setLoreError(true)
                    } catch { setLoreError(true) }
                    finally { setLoreSaving(false) }
                  }}
                  disabled={loreSaving || !newLore.trim()}
                  style={{
                    padding:'10px 16px',flexShrink:0,
                    background:'rgba(124,106,255,0.1)',border:'1px solid rgba(124,106,255,0.3)',
                    borderRadius:8,color:'var(--accent)',fontSize:10,fontWeight:600,
                    fontFamily:"'IBM Plex Mono', monospace",cursor: !newLore.trim() ? 'not-allowed' : 'pointer',
                    opacity: !newLore.trim() ? 0.5 : 1,
                    transition:'background 0.15s',
                  }}
                >
                  {loreSaving ? 'Сохранение…' : 'Обновить'}
                </button>
              </div>
              {loreOk && <div style={{ marginTop:8,fontSize:11,color:'var(--accent3)',fontFamily:"'IBM Plex Mono', monospace" }}>✓ ЛОР обновлён</div>}
              {loreError && <div style={{ marginTop:8,fontSize:11,color:'var(--accent2)',fontFamily:"'IBM Plex Mono', monospace" }}>✕ Ошибка обновления</div>}
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowInfo(false)}>Закрыть</button></div>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {profileModalOpen && (
        <div className="modal-overlay" onClick={closeProfileModal}>
          <div className="modal" style={{ width:560,maxHeight:'80vh',display:'flex',flexDirection:'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{hasProfile ? 'Информация профиля' : 'Привязать профиль'}</div>
              <button className="modal-close" onClick={closeProfileModal}>✕</button>
            </div>
            <div className="modal-body" style={{ flex:1,overflowY:'auto' }}>

              {/* View mode — already linked */}
              {hasProfile && !editingProfile && (
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  <div style={{ display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:120,fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700 }}>Folder ID</div>
                    <div style={{ fontSize:12,color:'var(--text)',fontFamily:"'IBM Plex Mono', monospace",wordBreak:'break-all' }}>{account.folder_id}</div>
                  </div>
                  <div style={{ display:'flex',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:120,fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700 }}>Profile ID</div>
                    <div style={{ fontSize:12,color:'var(--text)',fontFamily:"'IBM Plex Mono', monospace",wordBreak:'break-all' }}>{account.profile_id}</div>
                  </div>
                  <button
                    onClick={() => { setEditingProfile(true); setSelectedFolder(null); setSelectedProfile(null); setLinkError(false) }}
                    style={{
                      alignSelf:'flex-start',padding:'7px 16px',marginTop:4,
                      background:'rgba(124,106,255,0.1)',border:'1px solid rgba(124,106,255,0.3)',
                      borderRadius:6,color:'var(--accent)',fontSize:10,fontWeight:600,
                      fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',
                    }}
                  >Изменить</button>
                </div>
              )}

              {/* Link/Edit mode */}
              {(!hasProfile || editingProfile) && (
                <div>
                  <div style={{ fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:10 }}>
                    1. Выберите папку
                  </div>
                  {foldersLoading ? (
                    <div style={{ padding:16,color:'var(--text-muted)',fontSize:12,fontFamily:"'IBM Plex Mono', monospace" }}>Загрузка папок…</div>
                  ) : (
                    <div style={{ display:'flex',flexDirection:'column',gap:4,marginBottom:20 }}>
                      {folders.map((f) => (
                        <div
                          key={f.folder_id}
                          onClick={() => handleSelectFolder(f)}
                          style={{
                            display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,cursor:'pointer',
                            background: selectedFolder?.folder_id === f.folder_id ? 'rgba(124,106,255,0.12)' : 'var(--surface)',
                            border: `1px solid ${selectedFolder?.folder_id === f.folder_id ? 'rgba(124,106,255,0.3)' : 'var(--border)'}`,
                            transition:'all 0.15s',
                          }}
                        >
                          <div style={{
                            width:24,height:24,borderRadius:6,
                            background: f.folder_color || 'var(--surface2)',
                            flexShrink:0,
                          }} />
                          <span style={{ fontSize:12,color:'var(--text)',fontFamily:"'IBM Plex Mono', monospace",fontWeight:500 }}>{f.folder_name}</span>
                          {selectedFolder?.folder_id === f.folder_id && (
                            <span style={{ marginLeft:'auto',fontSize:11,color:'var(--accent)' }}>✓</span>
                          )}
                        </div>
                      ))}
                      {folders.length === 0 && !foldersLoading && (
                        <div style={{ padding:12,color:'var(--text-muted)',fontSize:11 }}>Нет доступных папок</div>
                      )}
                    </div>
                  )}

                  {/* Step 2: select profile */}
                  {selectedFolder && (
                    <>
                      <div style={{ fontSize:10,letterSpacing:'1px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:10 }}>
                        2. Выберите профиль
                      </div>
                      {profilesLoading ? (
                        <div style={{ padding:16,color:'var(--text-muted)',fontSize:12,fontFamily:"'IBM Plex Mono', monospace" }}>Загрузка профилей…</div>
                      ) : (
                        <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                          {profiles.map((p) => (
                            <div
                              key={p.profile_id}
                              onClick={() => setSelectedProfile(p)}
                              style={{
                                display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,cursor:'pointer',
                                background: selectedProfile?.profile_id === p.profile_id ? 'rgba(124,106,255,0.12)' : 'var(--surface)',
                                border: `1px solid ${selectedProfile?.profile_id === p.profile_id ? 'rgba(124,106,255,0.3)' : 'var(--border)'}`,
                                transition:'all 0.15s',
                              }}
                            >
                              <div style={{ flex:1,minWidth:0 }}>
                                <div style={{ fontSize:12,color:'var(--text)',fontFamily:"'IBM Plex Mono', monospace",fontWeight:500 }}>{p.profile_name}</div>
                                <div style={{ fontSize:10,color:'var(--text-dim)',fontFamily:"'IBM Plex Mono', monospace",marginTop:2 }}>
                                  {p.profile_status}
                                </div>
                              </div>
                              {selectedProfile?.profile_id === p.profile_id && (
                                <span style={{ fontSize:11,color:'var(--accent)',flexShrink:0 }}>✓</span>
                              )}
                            </div>
                          ))}
                          {profiles.length === 0 && !profilesLoading && (
                            <div style={{ padding:12,color:'var(--text-muted)',fontSize:11 }}>Нет профилей в этой папке</div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {linkError && (
                    <div style={{ marginTop:12,padding:'10px 14px',borderRadius:6,background:'rgba(255,106,142,0.08)',border:'1px solid rgba(255,106,142,0.25)',color:'var(--accent2)',fontSize:11,fontFamily:"'IBM Plex Mono', monospace" }}>
                      ✕ Ошибка привязки профиля
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeProfileModal}>Закрыть</button>
              {(!hasProfile || editingProfile) && selectedFolder && selectedProfile && (
                <button
                  onClick={handleLinkProfile}
                  disabled={linking}
                  style={{
                    display:'inline-flex',alignItems:'center',gap:6,padding:'6px 16px',
                    background:'rgba(124,106,255,0.1)',border:'1px solid rgba(124,106,255,0.3)',
                    borderRadius:6,color:'var(--accent)',fontSize:11,fontWeight:600,
                    fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',
                  }}
                >
                  {linking ? 'Привязка…' : 'Привязать профиль к аккаунту'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
