// Shared building blocks for the scenario pages.

export const labelStyle = {
  fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase',
  color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif",
  fontWeight: 700, marginBottom: 8,
}

export const textareaStyle = {
  width: '100%', minHeight: 200, padding: '10px 12px',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)',
  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
  lineHeight: 1.65, resize: 'vertical', outline: 'none',
}

export function Field({ label, required, children }) {
  return (
    <div>
      <div style={labelStyle}>{label}{required ? ' *' : ''}</div>
      {children}
    </div>
  )
}

// Same box as .form-input, for values that have no editable control.
export function ReadonlyValue({ children }) {
  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '9px 12px',
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
      color: 'var(--text)',
    }}>
      {children}
    </div>
  )
}

// A stacked block with a titled header.
export function Panel({ title, count, children }) {
  return (
    <section style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface2)',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '1.2px',
          textTransform: 'uppercase', color: 'var(--text)',
          fontFamily: "'Syne', sans-serif", flex: 1,
        }}>
          {title}
        </span>
        {count != null && (
          <span style={{
            fontSize: 9, padding: '1px 8px', borderRadius: 10,
            background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.3)',
            color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
          }}>
            {count}
          </span>
        )}
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {children}
      </div>
    </section>
  )
}

// The purple "#N" pill used for step order.
export function OrderPill({ children }) {
  return (
    <span style={{
      fontSize: 10, padding: '1px 8px', borderRadius: 10,
      background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.3)',
      color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
    }}>
      {children}
    </span>
  )
}
