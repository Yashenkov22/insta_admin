export const API_BASE  = '/api'
export const PAGE_SIZE = 20

export const fmt = (s) => String(s ?? '—')

export const nowTs = () => {
  const d = new Date()
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, '0')}-` +
    `${String(d.getDate()).padStart(2, '0')} ` +
    `${String(d.getHours()).padStart(2, '0')}:` +
    `${String(d.getMinutes()).padStart(2, '0')}`
  )
}

// Format any datetime string/object to user's local timezone
// ALL backend times are UTC — this converts to browser's local timezone
export const fmtDate = (value) => {
  if (!value) return '—'
  try {
    const str = String(value).trim()
    if (!str) return '—'

    // Backend always returns "YYYY-DD-MM HH:MM" — day before month
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/)
    if (match) {
      const [, year, day, month, hours, minutes] = match
      const iso = `${year}-${month}-${day}T${hours}:${minutes}:00Z`
      const d = new Date(iso)
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0')
        const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
        const mon = months[d.getMonth()]
        const yyyy = d.getFullYear()
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        return `${dd} ${mon} ${yyyy}, ${hh}:${mm}`
      }
    }

    // ISO format (created_at, updated_at with T and Z)
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0')
      const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
      const mon = months[d.getMonth()]
      const yyyy = d.getFullYear()
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      return `${dd} ${mon} ${yyyy}, ${hh}:${mm}`
    }

    return str
  } catch {
    return String(value)
  }
}
