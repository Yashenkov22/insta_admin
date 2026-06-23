import { fmtDate } from '../../utils'
import { ModBadge } from '../ui'
import { IconArrowRight } from '../Icons'

function getAttachments(msg) {
  return msg.attachments || msg.attachment || []
}

function AttachmentBlock({ att, isBot }) {
  if (!att?.media_url) return null
  if (att.media_type === 'photo') {
    return (
      <div style={{ marginTop: 6 }}>
        <img src={att.media_url} alt="photo" style={{
          maxWidth: 260, maxHeight: 260, borderRadius: 10,
          border: isBot ? 'none' : '1px solid var(--border)', display: 'block',
        }} />
      </div>
    )
  }
  return (
    <div style={{ marginTop: 6 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', borderRadius: 6,
        background: isBot ? 'rgba(255,255,255,0.15)' : 'rgba(91,154,255,0.12)',
        border: isBot ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(91,154,255,0.3)',
        color: isBot ? '#fff' : '#5b9aff', fontSize: 9, fontWeight: 700,
        fontFamily: "'Syne', sans-serif", letterSpacing: '0.5px', textTransform: 'uppercase',
      }}>
        {['text','photo','video','audio'].includes(att.media_type) ? att.media_type : 'undefined type'}
      </span>
    </div>
  )
}

export function MessageBubble({ msg, index, onDetail, onDelete, onTranslate }) {
  const isBot = msg.role === 'assistant'
  const isUser = msg.role === 'user'
  const canDelete = isBot && (msg.modStatus === 'pending' || msg.modStatus == null || msg.modStatus === 'rejected')
  const attachments = getAttachments(msg)
  const canTranslate = !!msg.content && msg.role !== 'system'

  return (
    <div className={`msg-bubble role-${msg.role}`}>
      {/* Meta line */}
      <div className="msg-meta">
        <span className="msg-role-label">{msg.role}</span>
        <span className="msg-id-small">#{msg.id}</span>
        {isBot && <ModBadge status={msg.modStatus ?? 'pending'} />}
      </div>

      {/* Bubble */}
      <div className="msg-bubble-inner">
        <div className="msg-content">
          <div className="msg-text" dangerouslySetInnerHTML={{
            __html: (msg.content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>'),
          }} />
          {attachments.map((att, i) => (
            <AttachmentBlock key={i} att={att} isBot={isBot} />
          ))}
          <div className="msg-timestamp">
            {fmtDate(msg.ts)}
            {msg.edited && <span className="msg-edited-badge">edited</span>}
          </div>
        </div>
      </div>

      {/* Actions — outside bubble, appear on hover */}
      <div className="msg-actions">
        <button className="mod-action-btn btn-confirm" onClick={() => onDetail(msg.id)}>
          <IconArrowRight /> Detail
        </button>
        {canTranslate && onTranslate && (
          <button className="mod-action-btn" onClick={() => onTranslate(msg.id)}
            style={{ color: '#5b9aff', border: '1px solid rgba(91,154,255,0.3)', background: 'rgba(91,154,255,0.06)' }}>
            Перевод
          </button>
        )}
        {canDelete && onDelete && (
          <button className="mod-action-btn" onClick={() => onDelete(msg.id)}
            style={{ color: 'var(--accent2)', border: '1px solid rgba(255,106,142,0.3)', background: 'rgba(255,106,142,0.06)' }}>
            Удалить
          </button>
        )}
      </div>
    </div>
  )
}

export { getAttachments, AttachmentBlock }
