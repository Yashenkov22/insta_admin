import { IconSearch, IconBack, IconNext } from './Icons'

// ─── MOD BADGE ────────────────────────────────────────────────────────────────
export function ModBadge({ status }) {
  return <span className={`mod-badge ${status}`}>{status}</span>
}

// ─── SEARCH BOX ───────────────────────────────────────────────────────────────
export function SearchBox({ placeholder, value, onChange }) {
  return (
    <div className="search-box">
      <IconSearch />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, setPage, total, pageSize = 20 }) {
  if (totalPages <= 1 && total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="pagination">
      <button className="pg-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
        <IconBack />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="pg-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`pg-btn${p === page ? ' active' : ''}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        )
      )}
      <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
        <IconNext />
      </button>
      <span className="pg-info">
        <strong>{from}–{to}</strong> of <strong>{total}</strong>
      </span>
    </div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc }) {
  return (
    <div className="empty-state">
      {icon}
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
    </div>
  )
}

// ─── STATS STRIP ─────────────────────────────────────────────────────────────
export function StatsStrip({ items }) {
  return (
    <div className="stats-strip">
      {items.map(({ label, value, color }) => (
        <div key={label} className="stat-item">
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={color ? { color } : undefined}>{value}</div>
        </div>
      ))}
    </div>
  )
}
