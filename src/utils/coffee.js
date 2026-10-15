// Per-status colors for the coffee_state label (CoffeeStatusEnum on the backend).
// active/cancelled are the pale variants, completed/moderating the saturated ones.
export const COFFEE_STATUS_STYLES = {
  active:     { color: 'rgba(106,255,212,0.8)', bg: 'rgba(106,255,212,0.07)', border: 'rgba(106,255,212,0.30)' },
  moderating: { color: '#5b9aff',               bg: 'rgba(91,154,255,0.12)',  border: 'rgba(91,154,255,0.40)' },
  'in pause': { color: '#ffc445',               bg: 'rgba(255,196,69,0.12)',  border: 'rgba(255,196,69,0.40)' }, // жёлтый
  completed:  { color: '#6affd4',               bg: 'rgba(106,255,212,0.18)', border: 'rgba(106,255,212,0.55)' },
  cancelled:  { color: 'rgba(255,106,142,0.8)', bg: 'rgba(255,106,142,0.07)', border: 'rgba(255,106,142,0.30)' },
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
