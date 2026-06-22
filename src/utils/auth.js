import { API_BASE } from './index'

const ACCESS_KEY  = 'admin_access_token'
const REFRESH_KEY = 'admin_refresh_token'

export const tokenStorage = {
  getAccess:  () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return null }
}

function isTokenValid(token) {
  if (!token) return false
  const payload = decodeJwt(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 > Date.now() + 60_000
}

// Singleton refresh promise — prevents multiple simultaneous refresh calls
let refreshPromise = null
let lastRefreshTime = 0

async function doRefresh() {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) {
    console.warn('[auth] No refresh token in storage')
    return false
  }
  try {
    console.log('[auth] Attempting token refresh…')
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!res.ok) {
      console.warn('[auth] Refresh failed:', res.status)
      return false
    }
    const data = await res.json()
    tokenStorage.set(data.access_token, data.refresh_token)
    lastRefreshTime = Date.now()
    console.log('[auth] Token refreshed successfully')
    return true
  } catch (e) {
    console.warn('[auth] Refresh network error:', e.message)
    return false
  }
}

export async function apiRefresh() {
  // If we refreshed very recently (< 5s ago), skip — tokens are fresh
  if (Date.now() - lastRefreshTime < 5000) return true

  if (refreshPromise) return refreshPromise
  refreshPromise = doRefresh().finally(() => { refreshPromise = null })
  return refreshPromise
}

export async function verifySession() {
  const access = tokenStorage.getAccess()
  const refresh = tokenStorage.getRefresh()

  // No refresh token — must re-login
  if (!refresh) {
    tokenStorage.clear()
    return false
  }

  // Access token still valid
  if (isTokenValid(access)) return true

  // Expired — try to refresh
  return apiRefresh()
}

// POST /api/auth/token (OAuth2 form)
export async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Login failed')
  }
  const data = await res.json()
  tokenStorage.set(data.access_token, data.refresh_token)
  lastRefreshTime = Date.now()
  return data
}

export function authHeaders() {
  const token = tokenStorage.getAccess()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Fetch wrapper with automatic token refresh on 401
export async function apiFetch(url, options = {}) {
  const buildHeaders = () => ({ ...authHeaders(), ...options.headers })

  let res = await fetch(url, { ...options, headers: buildHeaders() })

  if (res.status === 401) {
    const refreshed = await apiRefresh()
    if (refreshed) {
      // Retry with fresh token
      res = await fetch(url, { ...options, headers: buildHeaders() })
      // If still 401 after refresh, just return — don't logout
      // (could be a permission issue, not an auth issue)
    } else {
      // Refresh truly failed — logout
      console.warn('[auth] Refresh failed, logging out')
      tokenStorage.clear()
      window.dispatchEvent(new CustomEvent('app:logout'))
    }
  }

  return res
}
