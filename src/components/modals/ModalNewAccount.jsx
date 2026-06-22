import { useState, useEffect } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'
import { IconPlus, IconX } from '../Icons'

export function ModalNewAccount({ onClose, onCreated }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errU, setErrU] = useState(false)
  const [errP, setErrP] = useState(false)
  const [errGlobal, setErrGlobal] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const submit = async () => {
    const uErr = !username.trim()
    const pErr = !password
    setErrU(uErr); setErrP(pErr); setErrGlobal('')
    if (uErr || pErr) return

    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/account/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setErrGlobal(err.detail || `Error ${res.status}`)
        return
      }
      const created = await res.json()
      onCreated({ ...created, id: String(created.id) })
      onClose()
    } catch (e) {
      setErrGlobal('Network error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <IconPlus /> New Account{' '}
            <span className="entity-tag">accounts</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <IconX />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-field">
            <label className="form-label">
              Username <span>*</span>
            </label>
            <input
              className={`form-input${errU ? ' error' : ''}`}
              placeholder="e.g. john.doe"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setErrU(false); setErrGlobal('') }}
              autoFocus
            />
            {errU && <div className="form-error">Username is required</div>}
          </div>
          <div className="form-field">
            <label className="form-label">
              Password <span>*</span>
            </label>
            <input
              className={`form-input${errP ? ' error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrP(false); setErrGlobal('') }}
            />
            {errP && <div className="form-error">Password is required</div>}
          </div>
          {errGlobal && (
            <div className="form-error" style={{ fontSize: 12 }}>{errGlobal}</div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading && <span className="modal-spinner" />}
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
