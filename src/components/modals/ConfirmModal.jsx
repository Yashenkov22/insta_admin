export function ConfirmModal({ icon = '🗑', title, message, confirmLabel = 'Удалить', cancelLabel = 'Отмена', loading, loadingLabel = 'Удаление…', onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 22, color: 'var(--accent2)' }}>{icon}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{message}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose}>{cancelLabel}</button>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                padding: '6px 16px',
                background: 'rgba(255,106,142,0.15)',
                border: '1px solid rgba(255,106,142,0.4)',
                borderRadius: 6, color: 'var(--accent2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {loading ? loadingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
