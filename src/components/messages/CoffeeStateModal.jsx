import { useState } from 'react'
import { IconCoffee } from '../Icons'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'
import { COFFEE_STATUS_STYLES, COFFEE_STEP_LOG_STYLES, stepNumber } from '../../utils/coffee'

const labelStyle = {
  fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase',
  color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif",
  fontWeight: 700, marginBottom: 8,
}

function StatusPill({ status }) {
  const s = COFFEE_STATUS_STYLES[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 100,
      background: s?.bg ?? 'var(--surface2)',
      border: `1px solid ${s?.border ?? 'var(--border)'}`,
      color: s?.color ?? 'var(--text-muted)',
    }}>
      <span style={{ width: 12, height: 12 }}><IconCoffee /></span>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.6px',
        textTransform: 'uppercase', fontFamily: "'Syne', sans-serif",
      }}>
        {status}
      </span>
    </span>
  )
}

function StepLogRow({ stepKey, log, isCurrent }) {
  const s = COFFEE_STEP_LOG_STYLES[log?.status]
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      background: isCurrent ? 'rgba(124,106,255,0.07)' : 'var(--bg)',
      border: `1px solid ${isCurrent ? 'rgba(124,106,255,0.35)' : 'var(--border)'}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text)',
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          {stepKey}
        </span>
        {isCurrent && (
          <span style={{
            fontSize: 8, padding: '1px 6px', borderRadius: 4,
            background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.3)',
            color: 'var(--accent)', fontWeight: 700, fontFamily: "'Syne', sans-serif",
            letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>current</span>
        )}
        <span style={{ flex: 1 }} />
        <span style={{
          fontSize: 9, padding: '1px 8px', borderRadius: 4,
          background: s?.bg ?? 'var(--surface2)',
          border: `1px solid ${s?.border ?? 'var(--border)'}`,
          color: s?.color ?? 'var(--text-muted)',
          fontWeight: 700, fontFamily: "'Syne', sans-serif",
          letterSpacing: '0.5px', textTransform: 'uppercase',
        }}>
          {log?.status ?? '—'}
        </span>
      </div>
      <div style={{
        fontSize: 11, color: log?.result ? 'var(--text-muted)' : 'var(--text-dim)',
        fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.65,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {log?.result || '—'}
      </div>
    </div>
  )
}

// Starting a scenario has its own endpoint; everything else — including
// resuming from pause — goes through the edit one.
const COFFEE_ACTIONS = {
  activate: { path: 'activate_coffee_scenario_by_thread_id', marker: 'activate' },
  resume:   { path: 'edit_coffee_scenario_by_thread_id',     marker: 'activate' },
  pause:    { path: 'edit_coffee_scenario_by_thread_id',     marker: 'pause' },
  complete: { path: 'edit_coffee_scenario_by_thread_id',     marker: 'complete' },
  delete:   { path: 'edit_coffee_scenario_by_thread_id',     marker: 'delete' },
}

function ActionButton({ label, loadingLabel, loading, disabled, onClick, color, bg, border }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px',
        background: bg, border: `1px solid ${border}`,
        borderRadius: 6, color, fontSize: 11, fontWeight: 600,
        fontFamily: "'IBM Plex Mono', monospace",
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading && <span className="modal-spinner" />}
      {loading ? (loadingLabel ?? '…') : label}
    </button>
  )
}

export function CoffeeStateModal({ coffeeState, threadId, onClose, onChanged }) {
  const [pending, setPending] = useState(null) // 'activate' | 'pause' | 'delete'
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)

  const logEntries = Object.entries(coffeeState?.logs ?? {})
    .sort(([a], [b]) => stepNumber(a) - stepNumber(b))

  const runAction = async (action) => {
    const { path, marker } = COFFEE_ACTIONS[action]
    setPending(action); setError('')
    try {
      const res = await apiFetch(`${API_BASE}/threads/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: parseInt(threadId), marker }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(typeof err.detail === 'string' ? err.detail : `Error ${res.status}`)
        return
      }
      // Both endpoints answer with an empty body — reread the thread.
      setConfirmDelete(false)
      setConfirmComplete(false)
      await onChanged()
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Сценарий кофе</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!coffeeState ? (
            <div style={{
              padding: '24px 0', textAlign: 'center',
              fontSize: 12, color: 'var(--text-muted)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              Сценарий для этого чата не запущен
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={labelStyle}>Status</div>
                  <StatusPill status={coffeeState.status} />
                </div>
                <div>
                  <div style={labelStyle}>Current step</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {coffeeState.current_step ?? '—'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Scenario step</div>
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    color: coffeeState.is_scenario_step ? 'var(--accent3)' : 'var(--text-muted)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>
                    {coffeeState.is_scenario_step ? 'да' : 'нет'}
                  </div>
                </div>
              </div>

              <div>
                <div style={labelStyle}>Logs</div>
                {logEntries.length === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    Логов нет
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {logEntries.map(([stepKey, log]) => (
                      <StepLogRow
                        key={stepKey}
                        stepKey={stepKey}
                        log={log}
                        isCurrent={stepNumber(stepKey) === Number(coffeeState.current_step)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {error && (
            <span className="form-error" style={{ flex: 1, minWidth: 140 }}>{error}</span>
          )}
          {!error && <span style={{ flex: 1 }} />}
          {!coffeeState ? (
            <ActionButton
              label="Включить сценарий"
              loadingLabel="Включение…"
              loading={pending === 'activate'}
              disabled={!!pending}
              onClick={() => runAction('activate')}
              color="var(--accent3)"
              bg="rgba(106,255,212,0.1)"
              border="rgba(106,255,212,0.3)"
            />
          ) : (
            <>
              {coffeeState.status !== 'completed' && (coffeeState.status === 'in pause' ? (
                <ActionButton
                  label="Возобновить"
                  loadingLabel="Возобновление…"
                  loading={pending === 'resume'}
                  disabled={!!pending}
                  onClick={() => runAction('resume')}
                  color="var(--accent3)"
                  bg="rgba(106,255,212,0.1)"
                  border="rgba(106,255,212,0.3)"
                />
              ) : (
                <ActionButton
                  label="Пауза"
                  loadingLabel="…"
                  loading={pending === 'pause'}
                  disabled={!!pending}
                  onClick={() => runAction('pause')}
                  color="#ffc445"
                  bg="rgba(255,196,69,0.1)"
                  border="rgba(255,196,69,0.3)"
                />
              ))}

              {coffeeState.status !== 'completed' && (confirmComplete ? (
                <>
                  <ActionButton
                    label="Точно завершить"
                    loadingLabel="Завершение…"
                    loading={pending === 'complete'}
                    disabled={!!pending}
                    onClick={() => runAction('complete')}
                    color="var(--accent)"
                    bg="rgba(124,106,255,0.18)"
                    border="rgba(124,106,255,0.45)"
                  />
                  <button className="btn btn-ghost" onClick={() => setConfirmComplete(false)}>Отмена</button>
                </>
              ) : (
                <ActionButton
                  label="Завершить"
                  loading={false}
                  disabled={!!pending}
                  onClick={() => { setConfirmComplete(true); setError('') }}
                  color="var(--accent)"
                  bg="rgba(124,106,255,0.1)"
                  border="rgba(124,106,255,0.3)"
                />
              ))}
              {confirmDelete ? (
                <>
                  <ActionButton
                    label="Точно удалить"
                    loadingLabel="Удаление…"
                    loading={pending === 'delete'}
                    disabled={!!pending}
                    onClick={() => runAction('delete')}
                    color="var(--accent2)"
                    bg="rgba(255,106,142,0.18)"
                    border="rgba(255,106,142,0.45)"
                  />
                  <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Отмена</button>
                </>
              ) : (
                <ActionButton
                  label="Удалить"
                  loading={false}
                  disabled={!!pending}
                  onClick={() => { setConfirmDelete(true); setError('') }}
                  color="var(--accent2)"
                  bg="rgba(255,106,142,0.1)"
                  border="rgba(255,106,142,0.3)"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
