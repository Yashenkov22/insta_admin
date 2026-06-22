import { useState } from 'react'
import { IconUser, IconLock, IconAlert } from './Icons'
import { apiLogin } from '../utils/auth'

export function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async () => {
    if (!username || !password) { setError('Enter username and password'); return }
    setLoading(true)
    setError('')
    try {
      const data = await apiLogin(username, password)
      onLogin()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="login-screen">
      <div className="login-bg-grid" />
      <div className="login-bg-glow" />
      <div className="login-card">
        <div className="login-card-header">
          <div className="login-logo">admin<span>.panel</span></div>
          <div className="login-tagline">sign in to continue</div>
        </div>
        <div className="login-card-body">
          <div className="login-field">
            <div className="login-label">Username</div>
            <div className="login-input-wrap">
              <IconUser />
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={onKey}
                autoFocus
              />
            </div>
          </div>
          <div className="login-field">
            <div className="login-label">Password</div>
            <div className="login-input-wrap">
              <IconLock />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKey}
              />
            </div>
          </div>
          {error && (
            <div className="login-error"><IconAlert /> {error}</div>
          )}
          <button className="login-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
