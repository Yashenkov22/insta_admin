import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'

function useBreadcrumbs() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean)
  const crumbs = []

  let path = ''
  for (const part of parts) {
    path += '/' + part
    const captured = path
    const match = part.match(/^(account|thread|message)_(\d+)$/)
    if (match) {
      const [, type, id] = match
      crumbs.push({ label: `${type.charAt(0).toUpperCase() + type.slice(1)} #${id}`, onClick: () => navigate(captured) })
    } else {
      crumbs.push({ label: part.charAt(0).toUpperCase() + part.slice(1), onClick: () => navigate(captured) })
    }
  }
  return crumbs
}

export function AppShell({ children }) {
  const navigate = useNavigate()
  const breadcrumbs = useBreadcrumbs()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    window.dispatchEvent(new CustomEvent('app:logout'))
  }

  return (
    <div className="shell">
      <Topbar
        breadcrumbs={breadcrumbs}
        onLogoClick={() => navigate('/accounts')}
        onLogout={handleLogout}
        onHamburger={() => setSidebarOpen(v => !v)}
      />
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <main className="main">{children}</main>
    </div>
  )
}
