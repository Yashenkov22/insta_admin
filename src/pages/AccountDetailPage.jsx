import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { EmptyState } from '../components/ui'
import { IconUser, IconBack, IconSpinner } from '../components/Icons'
import { fmt, fmtDate, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'
import { useBackPath } from '../hooks/useBackPath'
import { usePathParams } from '../hooks/usePathParams'
import { ViewNameEditor } from '../components/account/ViewNameEditor'
import { BrowserControls } from '../components/account/BrowserControls'
import { PhotoModal } from '../components/account/PhotoModal'
import { ModelInfoModal } from '../components/account/ModelInfoModal'
import { ProfileLinkModal } from '../components/account/ProfileLinkModal'

export function AccountDetailPage() {
  const { account: accountId } = usePathParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = useBackPath()
  const currentPath = location.pathname.replace(/\/$/, '')

  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [togglingHidden, setTogglingHidden] = useState(false)
  const [togglingParse, setTogglingParse] = useState(false)

  const [activeModal, setActiveModal] = useState(null) // 'photo' | 'modelInfo' | 'profile'

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

  const handleToggleHidden = async () => {
    if (togglingHidden || !account) return
    const newValue = !account.is_hidden
    setTogglingHidden(true)
    setAccount(prev => ({ ...prev, is_hidden: newValue }))
    try {
      const res = await apiFetch(`${API_BASE}/account/edit_hidden_mark`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: parseInt(accountId) }),
      })
      if (!res.ok) setAccount(prev => ({ ...prev, is_hidden: !newValue }))
    } catch { setAccount(prev => ({ ...prev, is_hidden: !newValue })) }
    finally { setTogglingHidden(false) }
  }

  const handleToggleParse = async () => {
    if (togglingParse || !account) return
    const newValue = !account.parse_whole_thread_list
    setTogglingParse(true)
    setAccount(prev => ({ ...prev, parse_whole_thread_list: newValue }))
    try {
      const res = await apiFetch(`${API_BASE}/account/edit_full_parse_by_account_id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: parseInt(accountId) }),
      })
      if (res.ok) {
        const data = await res.json()
        setAccount(prev => ({ ...prev, parse_whole_thread_list: data.parse_whole_thread_list }))
      } else {
        setAccount(prev => ({ ...prev, parse_whole_thread_list: !newValue }))
      }
    } catch { setAccount(prev => ({ ...prev, parse_whole_thread_list: !newValue })) }
    finally { setTogglingParse(false) }
  }

  if (loading) {
    return (<div className="page"><div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'var(--text-muted)',fontSize:12 }}><IconSpinner size={28} />Loading…</div></div>)
  }
  if (!account) {
    return (<div className="page"><EmptyState icon={<IconUser />} title="Account not found" /></div>)
  }

  const threadCount = account.thread_count ?? 0
  const hasUnread = account.has_unread ?? false
  const hasProfile = account?.folder_id && account?.profile_id

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
              onClick={() => setActiveModal('photo')}
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
            <button onClick={() => setActiveModal('modelInfo')} style={{
              width:'100%',padding:'7px 12px',
              background:'rgba(124,106,255,0.1)',border:'1px solid rgba(124,106,255,0.3)',
              borderRadius:8,color:'var(--accent)',fontSize:10,fontWeight:600,
              fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer',
              transition:'background 0.15s',textAlign:'center',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,106,255,0.1)'}
            >Информация о модели</button>
            <button onClick={() => setActiveModal('profile')} style={{
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
            <BrowserControls accountId={accountId} hasProfile={hasProfile} />
          </div>

          {/* Right: info */}
          <div style={{ flex:1,minWidth:280 }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:22,fontWeight:700,color:'var(--text)',fontFamily:"'Syne', sans-serif",lineHeight:1.3 }}>
                {account.view_name || account.fullname || account.username}
              </div>
              <div style={{ fontSize:13,color:'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",marginTop:4 }}>@{account.username}</div>
              <div style={{ marginTop:10 }}>
                <ViewNameEditor account={account} accountId={accountId} onSaved={fetchAccount} />
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
                <div style={{ fontSize:9,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:6 }}>Hidden</div>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div onClick={handleToggleHidden} style={{
                    width:40,height:22,borderRadius:11,cursor: togglingHidden ? 'wait' : 'pointer',
                    background: account.is_hidden ? 'rgba(255,106,142,0.25)' : 'var(--surface2)',
                    border: account.is_hidden ? '1px solid rgba(255,106,142,0.4)' : '1px solid var(--border)',
                    position:'relative',transition:'all 0.2s',flexShrink:0,opacity: togglingHidden ? 0.6 : 1,
                  }}>
                    <div style={{ width:16,height:16,borderRadius:'50%',background: account.is_hidden ? 'var(--accent2)' : 'var(--text-muted)',position:'absolute',top:2,left: account.is_hidden ? 21 : 2,transition:'all 0.2s' }} />
                  </div>
                  <span style={{ fontSize:12,color: account.is_hidden ? 'var(--accent2)' : 'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",fontWeight:600 }}>{account.is_hidden ? 'hidden' : 'visible'}</span>
                </div>
              </div>
              <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)' }}>
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
              <div style={{ padding:'14px 20px',gridColumn:'1 / -1' }}>
                <div style={{ fontSize:9,letterSpacing:'1.2px',textTransform:'uppercase',color:'var(--text-dim)',fontFamily:"'Syne', sans-serif",fontWeight:700,marginBottom:6 }}>Parse Whole Thread List</div>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div onClick={handleToggleParse} style={{
                    width:40,height:22,borderRadius:11,cursor: togglingParse ? 'wait' : 'pointer',
                    background: account.parse_whole_thread_list ? 'rgba(106,255,212,0.25)' : 'var(--surface2)',
                    border: account.parse_whole_thread_list ? '1px solid rgba(106,255,212,0.4)' : '1px solid var(--border)',
                    position:'relative',transition:'all 0.2s',flexShrink:0,opacity: togglingParse ? 0.6 : 1,
                  }}>
                    <div style={{ width:16,height:16,borderRadius:'50%',background: account.parse_whole_thread_list ? 'var(--accent3)' : 'var(--text-muted)',position:'absolute',top:2,left: account.parse_whole_thread_list ? 21 : 2,transition:'all 0.2s' }} />
                  </div>
                  <span style={{ fontSize:12,color: account.parse_whole_thread_list ? 'var(--accent3)' : 'var(--text-muted)',fontFamily:"'IBM Plex Mono', monospace",fontWeight:600 }}>{account.parse_whole_thread_list ? 'enabled' : 'disabled'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeModal === 'photo' && (
        <PhotoModal account={account} accountId={accountId} onClose={() => setActiveModal(null)} onSaved={fetchAccount} />
      )}
      {activeModal === 'modelInfo' && (
        <ModelInfoModal account={account} accountId={accountId} onClose={() => setActiveModal(null)} onSaved={fetchAccount} />
      )}
      {activeModal === 'profile' && (
        <ProfileLinkModal account={account} accountId={accountId} onClose={() => setActiveModal(null)} onSaved={fetchAccount} />
      )}
    </div>
  )
}
