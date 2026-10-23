// Per-status colors for the coffee_state label (CoffeeStatusEnum on the backend).
export const COFFEE_STATUS_STYLES = {
  preparing:  { color: '#4fc3f7', bg: 'rgba(79,195,247,0.12)',  border: 'rgba(79,195,247,0.40)' },  // голубой
  active:     { color: '#6affd4', bg: 'rgba(106,255,212,0.12)', border: 'rgba(106,255,212,0.40)' }, // зелёный
  moderating: { color: '#5b9aff', bg: 'rgba(91,154,255,0.12)',  border: 'rgba(91,154,255,0.40)' },  // синий
  'in pause': { color: '#ffc445', bg: 'rgba(255,196,69,0.12)',  border: 'rgba(255,196,69,0.40)' },  // жёлтый
  completed:  { color: '#2d8f5e', bg: 'rgba(45,143,94,0.14)',   border: 'rgba(45,143,94,0.45)' },   // тёмно-зелёный
  cancelled:  { color: '#ff6a8e', bg: 'rgba(255,106,142,0.12)', border: 'rgba(255,106,142,0.40)' }, // красный
}

// Returns the style for a thread's coffee status, or null when there is none.
export const coffeeStyle = (thread) =>
  COFFEE_STATUS_STYLES[thread?.coffee_state?.status] ?? null

// Per-status colors for a step entry in coffee_state.logs (CoffeeStepLogSchema).
export const COFFEE_STEP_LOG_STYLES = {
  waiting:   { color: '#ffc445',        bg: 'rgba(255,196,69,0.10)',  border: 'rgba(255,196,69,0.30)' },
  completed: { color: 'var(--accent3)', bg: 'rgba(106,255,212,0.10)', border: 'rgba(106,255,212,0.30)' },
  cancelled: { color: 'var(--accent2)', bg: 'rgba(255,106,142,0.10)', border: 'rgba(255,106,142,0.30)' },
}

// "step_2" -> 2, for sorting the logs dict.
export const stepNumber = (key) => {
  const m = String(key).match(/(\d+)$/)
  return m ? parseInt(m[1]) : 0
}

// Options for the coffee status filter, in lifecycle order.
export const COFFEE_STATUS_LIST = [
  'preparing', 'active', 'moderating', 'in pause', 'completed', 'cancelled',
]

// Matches a thread against a filter value: 'all', 'any' (has a coffee_state),
// 'none' (has none) or an exact status.
export const matchesCoffeeFilter = (thread, filter) => {
  if (!filter || filter === 'all') return true
  const status = thread?.coffee_state?.status ?? null
  if (filter === 'any') return status !== null
  if (filter === 'none') return status === null
  return status === filter
}
