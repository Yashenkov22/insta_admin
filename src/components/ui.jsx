import { useState } from 'react'
import { IconSearch, IconBack, IconNext, IconCoffee } from './Icons'
import { coffeeStyle, COFFEE_STATUS_LIST, COFFEE_STATUS_STYLES } from '../utils/coffee'

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

// ─── COFFEE STATE BADGE ──────────────────────────────────────────────────────
export function CoffeeBadge({ thread }) {
  const style = coffeeStyle(thread)
  if (!style) return null
  return (
    <span
      title={`coffee: ${thread.coffee_state.status}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '1px 7px', borderRadius: 4,
        background: style.bg, border: `1px solid ${style.border}`,
        color: style.color, flexShrink: 0,
      }}
    >
      <span style={{ width: 11, height: 11 }}><IconCoffee /></span>
      <span style={{
        fontSize: 8, fontWeight: 700, letterSpacing: '0.5px',
        textTransform: 'uppercase', fontFamily: "'Syne', sans-serif",
      }}>
        {thread.coffee_state.status}
      </span>
    </span>
  )
}

// ─── COFFEE STATUS FILTER ────────────────────────────────────────────────────
// A custom dropdown rather than a <select>: browsers (Safari especially)
// ignore per-<option> colors, and the whole point here is seeing them.
const COFFEE_FILTER_OPTIONS = [
  { value: 'all',  label: 'All' },
  { value: 'none', label: 'Без сценария' },
  ...COFFEE_STATUS_LIST.map(s => ({ value: s, label: s, ...COFFEE_STATUS_STYLES[s] })),
]

export function CoffeeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = COFFEE_FILTER_OPTIONS.find(o => o.value === value) ?? COFFEE_FILTER_OPTIONS[0]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase',
        color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700,
      }}>Coffee:</span>

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '4px 10px', minWidth: 120,
            background: current.bg ?? 'var(--surface2)',
            border: `1px solid ${current.border ?? 'var(--border)'}`,
            borderRadius: 5,
            color: current.color ?? 'var(--text)',
            fontSize: 11, fontWeight: current.color ? 700 : 400,
            fontFamily: "'IBM Plex Mono', monospace",
            cursor: 'pointer', outline: 'none',
          }}
        >
          {current.color && (
            <span className="dot-indicator" style={{ background: current.color }} />
          )}
          <span style={{ flex: 1, textAlign: 'left' }}>{current.label}</span>
          <span style={{ fontSize: 8, opacity: 0.7 }}>▼</span>
        </button>

        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
              background: 'var(--surface)', border: '1px solid var(--border-bright)',
              borderRadius: 7, overflow: 'hidden', minWidth: 170,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {COFFEE_FILTER_OPTIONS.map((opt) => {
                const active = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      width: '100%', padding: '8px 12px',
                      background: active ? (opt.bg ?? 'var(--surface2)') : 'transparent',
                      border: 'none', borderBottom: '1px solid var(--border)',
                      color: opt.color ?? 'var(--text-muted)',
                      fontSize: 11, fontWeight: active ? 700 : 600,
                      fontFamily: "'IBM Plex Mono', monospace",
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span
                      className="dot-indicator"
                      style={{ background: opt.color ?? 'var(--text-dim)' }}
                    />
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {active && <span style={{ fontSize: 10 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
