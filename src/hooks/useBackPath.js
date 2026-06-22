import { useLocation } from 'react-router-dom'

/**
 * Remove the last path segment.
 * /accounts/account_1/threads/thread_40/message_170 → /accounts/account_1/threads/thread_40
 * /accounts/account_1/threads → /accounts/account_1
 * /accounts/account_1 → /accounts
 * /messages/message_230 → /messages
 */
export function useBackPath() {
  const { pathname } = useLocation()
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean)
  if (parts.length <= 1) return '/'
  return '/' + parts.slice(0, -1).join('/')
}
