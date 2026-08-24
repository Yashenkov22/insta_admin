export function ErrorModal({ title = 'Ошибка', message, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 360, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 22, color: 'var(--accent2)' }}>✕</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{message}</div>
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}
