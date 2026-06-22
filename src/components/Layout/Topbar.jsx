import { IconLogout } from '../Icons'

export function Topbar({ breadcrumbs, onLogoClick, onLogout, onHamburger }) {
  return (
    <header className="topbar">
      <button className="hamburger" onClick={onHamburger} aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div className="logo" onClick={onLogoClick} title="Refresh data">
        ADMIN<span>.db</span>
      </div>
      <div className="topbar-divider" />
      <nav className="breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <span className="sep">›</span>}
            <span
              className={`crumb${i === breadcrumbs.length - 1 ? ' active' : ''}`}
              onClick={crumb.onClick}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>
      <div className="topbar-status">
        <div className="dot" />
        connected
      </div>
      <button
        className="btn btn-ghost"
        onClick={onLogout}
        style={{ fontSize: '10px', padding: '5px 10px', marginLeft: '8px' }}
      >
        <IconLogout /> Logout
      </button>
    </header>
  )
}
