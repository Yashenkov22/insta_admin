import { useEffect, useRef, useCallback } from 'react'
import { tokenStorage } from '../utils/auth'

const WS_BASE = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

const listeners = new Set()
let ws = null
let reconnectTimer = null
let isConnecting = false

function connect() {
  const token = tokenStorage.getAccess()
  if (!token || isConnecting) return
  if (ws && ws.readyState === WebSocket.OPEN) return

  isConnecting = true
  ws = new WebSocket(`${WS_BASE}?token=${token}`)

  ws.onopen = () => {
    isConnecting = false
    console.log('[ws] connected')
  }

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      listeners.forEach(fn => fn(data))
    } catch {}
  }

  ws.onclose = (e) => {
    isConnecting = false
    ws = null
    console.log('[ws] disconnected', e.code)
    // Reconnect after 3s unless intentional close
    if (e.code !== 1000) {
      reconnectTimer = setTimeout(connect, 3000)
    }
  }

  ws.onerror = () => {
    isConnecting = false
  }
}

function disconnect() {
  clearTimeout(reconnectTimer)
  if (ws) {
    ws.close(1000)
    ws = null
  }
}

// Call once on app mount
export function initWebSocket() {
  connect()
  // Reconnect when token refreshes
  const origSet = tokenStorage.set
  const patchedSet = (access, refresh) => {
    origSet.call(tokenStorage, access, refresh)
    // Reconnect with new token
    disconnect()
    setTimeout(connect, 100)
  }
  tokenStorage.set = patchedSet

  // Disconnect on logout
  const handleLogout = () => disconnect()
  window.addEventListener('app:logout', handleLogout)

  return () => {
    disconnect()
    tokenStorage.set = origSet
    window.removeEventListener('app:logout', handleLogout)
  }
}

// Hook to subscribe to WS events
export function useWsEvent(eventType, handler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const listener = (data) => {
      if (data.type === eventType) {
        handlerRef.current(data)
      }
    }
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [eventType])
}
