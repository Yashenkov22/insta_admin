import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconUser, IconThread, IconMessage } from '../Icons'

function getInitialTheme() {
  const saved = localStorage.getItem('theme')
  if (saved) return saved
  return 'dark'
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export function Sidebar({ open, onNavigate }) {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

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
      <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </aside>
  )
}
