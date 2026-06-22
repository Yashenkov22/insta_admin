import { useLocation } from 'react-router-dom'

/**
 * Parse path segments like /accounts/account_1/threads/thread_40/message_170
 * Returns: { account: '1', thread: '40', message: '170' }
 * 
 * Also returns last occurrence of each type for nested paths like:
 * /messages/message_230/thread_46/message_201
 * → { message: '201', thread: '46', firstMessage: '230' }
 */
export function usePathParams() {
  const { pathname } = useLocation()
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean)
  const result = {}
  const messages = []

  for (const part of parts) {
    const match = part.match(/^(account|thread|message)_(\d+)$/)
    if (match) {
      const [, type, id] = match
      if (type === 'message') {
        messages.push(id)
      }
      result[type] = id
    }
  }

  // For nested message paths, keep track of first message
  if (messages.length > 1) {
    result.firstMessage = messages[0]
    result.message = messages[messages.length - 1]
  }

  return result
}
