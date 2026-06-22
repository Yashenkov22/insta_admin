import { useNavigate, useLocation } from 'react-router-dom'
import { IconUser, IconThread, IconMessage, IconConfig } from '../Icons'

export function Sidebar({ open, onNavigate }) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const activeId =
    path === '/accounts' || path === '/' ? 'accounts'
    : path === '/threads' || (path.includes('/threads') && !path.includes('/messages')) ? 'threads'
    : path.includes('/messages') ? 'messages'
    : 'accounts'

  const items = [
    { id: 'accounts', label: 'Account', icon: <IconUser /> },
    { id: 'threads',  label: 'Thread',  icon: <IconThread /> },
    { id: 'messages', label: 'Message', icon: <IconMessage /> },
  ]

  const handleClick = (id) => {
    navigate(`/${id === 'accounts' ? 'accounts' : id}`)
    if (onNavigate) onNavigate()
  }

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-section">Tables</div>
      {items.map((item) => (
        <div
          key={item.id}
          className={`nav-item${activeId === item.id ? ' active' : ''}`}
          onClick={() => handleClick(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div className="sidebar-section">Settings</div>
      <div className="nav-item">
        <span className="nav-icon"><IconConfig /></span>
        Config
      </div>
    </aside>
  )
}
