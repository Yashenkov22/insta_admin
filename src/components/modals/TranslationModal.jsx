export function TranslationModal({ text, loading, onClose }) {
  return (
    <div className="modal-overlay" onClick={() => { if (!loading) onClose() }}>
      <div className="modal" style={{ width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Перевод</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>Переводим…</div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {text}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}
