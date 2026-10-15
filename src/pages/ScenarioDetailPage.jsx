import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { EmptyState } from '../components/ui'
import { ErrorModal } from '../components/modals/ErrorModal'
import { IconScenario, IconBack, IconCheck, IconPlus, IconArrowRight, IconSpinner } from '../components/Icons'
import { fmt, fmtDate, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'
import { useBackPath } from '../hooks/useBackPath'
import { labelStyle, textareaStyle, Field, ReadonlyValue, Panel, OrderPill } from '../components/scenario/ui'

export function ScenarioDetailPage() {
  const { scenarioSeg } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = useBackPath()

  const isNew = scenarioSeg === 'new'
  const scenarioId = isNew ? null : scenarioSeg.replace(/^scenario_/, '')

  const [scenario, setScenario] = useState(location.state?.scenario ?? null)
  const [loading, setLoading] = useState(!isNew && !location.state?.scenario)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errName, setErrName] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // ── steps ──
  const [steps, setSteps] = useState([])
  const [showStepForm, setShowStepForm] = useState(false)
  const [stepOrder, setStepOrder] = useState('')
  const [stepName, setStepName] = useState('')
  const [stepInstruction, setStepInstruction] = useState('')
  const [stepFieldErrors, setStepFieldErrors] = useState({})
  const [savingStep, setSavingStep] = useState(false)
  const [stepError, setStepError] = useState('')

  const fetchScenario = useCallback(async ({ silent = false } = {}) => {
    if (!scenarioId) return
    if (!silent) setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/scenario/${scenarioId}`)
      if (res.ok) {
        setScenario(await res.json())
        return
      }
      // No detail endpoint — fall back to the record from the list.
      const listRes = await apiFetch(`${API_BASE}/scenario/list`)
      if (listRes.ok) {
        const list = await listRes.json()
        const found = (Array.isArray(list) ? list : [])
          .find(x => String(x.id) === String(scenarioId))
        if (found) setScenario(found)
      }
    } catch (e) { console.error(e) }
    finally { if (!silent) setLoading(false) }
  }, [scenarioId])

  useEffect(() => {
    if (isNew) return
    // Arriving straight after create: the record is passed via router state, so
    // render it right away and refresh in the background.
    const seeded = location.state?.scenario
    if (seeded) {
      setScenario(seeded)
      setLoading(false)
      fetchScenario({ silent: true })
    } else {
      fetchScenario()
    }
  }, [isNew, fetchScenario]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pick up steps if the detail endpoint returns them alongside the scenario.
  useEffect(() => {
    const fromApi = scenario?.steps ?? scenario?.scenario_steps
    if (Array.isArray(fromApi)) setSteps(fromApi)
  }, [scenario])

  const nextOrder = steps.length
    ? Math.max(...steps.map(st => Number(st.order) || 0)) + 1
    : 1

  const openStepForm = () => {
    setStepOrder(String(nextOrder))
    setStepName('')
    setStepInstruction('')
    setStepFieldErrors({})
    setStepError('')
    setShowStepForm(true)
  }

  const handleSaveStep = async () => {
    const errors = {
      order: !String(stepOrder).trim() || !Number.isInteger(Number(stepOrder)),
      name: !stepName.trim(),
      instruction: !stepInstruction.trim(),
    }
    setStepFieldErrors(errors)
    if (errors.order || errors.name || errors.instruction) return

    setSavingStep(true); setStepError('')
    try {
      const res = await apiFetch(`${API_BASE}/scenario/step/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: parseInt(scenario?.id ?? scenarioId),
          order: parseInt(stepOrder),
          name: stepName.trim(),
          instruction: stepInstruction.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setStepError(err.detail || `Error ${res.status}`)
        return
      }
      const created = await res.json().catch(() => null)
      if (created) setSteps(prev => [...prev, created])
      // "и продолжить" — keep the block open, ready for the next step
      setStepName('')
      setStepInstruction('')
      setStepOrder(String((Number(stepOrder) || 0) + 1))
      setStepFieldErrors({})
    } catch (e) {
      setStepError('Network error: ' + e.message)
    } finally {
      setSavingStep(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) { setErrName(true); return }
    setSaving(true); setSaveError('')
    try {
      const res = await apiFetch(`${API_BASE}/scenario/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.detail || `Error ${res.status}`)
        return
      }
      const created = await res.json().catch(() => null)
      const newId = created?.id
      if (newId == null) {
        setSaveError('Сервер не вернул id созданного сценария')
        return
      }
      // Replace the "new" URL with the real detail URL and seed it with the
      // created record so the page renders immediately, then refetch.
      navigate(`/scenarios/scenario_${newId}`, {
        replace: true,
        state: { scenario: created },
      })
    } catch (e) {
      setSaveError('Network error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Create form ──────────────────────────────────────────────────────────
  if (isNew) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="page-title-row">
            <div>
              <div className="page-title">Scenario <span className="entity-tag">new</span></div>
              <div className="page-subtitle">Заполните поля и сохраните сценарий</div>
            </div>
            <button className="btn btn-back" onClick={() => navigate(backPath)}><IconBack /> Back</button>
          </div>
        </div>

        <div style={{ padding: '32px 40px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Name" required>
              <input
                className={`form-input${errName ? ' error' : ''}`}
                placeholder="Название сценария"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrName(false) }}
                autoFocus
              />
              {errName && <div className="form-error">Name is required</div>}
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание сценария…"
                style={textareaStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>

            <div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="modal-spinner" /> : <IconCheck />}
                {saving ? 'Сохранение…' : 'Сохранить и продолжить'}
              </button>
            </div>
          </div>
        </div>

        {saveError && <ErrorModal message={saveError} onClose={() => setSaveError('')} />}
      </div>
    )
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page">
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'var(--text-muted)',fontSize:12 }}>
          <IconSpinner size={28} /> Loading…
        </div>
      </div>
    )
  }
  if (!scenario) {
    return (<div className="page"><EmptyState icon={<IconScenario />} title="Scenario not found" /></div>)
  }

  const sortedSteps = [...steps].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">
              {scenario.name || 'Scenario'} <span className="entity-tag">detail</span>
            </div>
            <div className="page-subtitle">ID #{fmt(scenario.id ?? scenarioId)}</div>
          </div>
          <button className="btn btn-back" onClick={() => navigate('/scenarios')}><IconBack /> Back</button>
        </div>
      </div>

      <div style={{ padding: '32px 40px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Block 1: scenario fields ── */}
          <Panel title="Scenario">
            <Field label="Name">
              <input className="form-input" value={scenario.name ?? ''} readOnly />
            </Field>

            <Field label="Description">
              <textarea value={scenario.description ?? ''} readOnly style={{ ...textareaStyle, minHeight: 160 }} />
            </Field>

            <Field label="Created">
              <ReadonlyValue>{fmtDate(scenario.created_at)}</ReadonlyValue>
            </Field>

            <Field label="Updated">
              <ReadonlyValue>{fmtDate(scenario.updated_at)}</ReadonlyValue>
            </Field>
          </Panel>

          {/* ── Block 2: steps ── */}
          <Panel title="Steps" count={sortedSteps.length}>
            {sortedSteps.length === 0 && !showStepForm && (
              <div style={{
                padding: '18px 0', textAlign: 'center',
                fontSize: 11, color: 'var(--text-muted)',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                Шагов пока нет
              </div>
            )}

            {sortedSteps.map((st, i) => (
              <div
                key={st.id ?? `${st.order}-${i}`}
                onClick={() => st.id != null && navigate(`/scenarios/${scenarioSeg}/step_${st.id}`)}
                style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '12px 14px',
                  cursor: st.id != null ? 'pointer' : 'default',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (st.id == null) return
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,106,255,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <OrderPill>#{fmt(st.order)}</OrderPill>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'Syne', sans-serif", flex: 1 }}>
                    {fmt(st.name)}
                  </span>
                  <span style={{ width: 14, height: 14, color: 'var(--text-dim)', flexShrink: 0 }}>
                    <IconArrowRight />
                  </span>
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.65,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {fmt(st.instruction ?? st.instructions)}
                </div>
              </div>
            ))}

            {!showStepForm && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={openStepForm}>
                  <IconPlus /> Добавить шаг
                </button>
              </div>
            )}

            {showStepForm && (
              <div style={{
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '16px 16px 18px',
                display: 'flex', flexDirection: 'column', gap: 18,
                animation: 'fadeIn 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ ...labelStyle, marginBottom: 0, flex: 1, fontSize: 11 }}>Новый шаг</div>
                  <button className="modal-close" onClick={() => setShowStepForm(false)}>✕</button>
                </div>

                <Field label="Order" required>
                  <input
                    type="number"
                    step="1"
                    className={`form-input${stepFieldErrors.order ? ' error' : ''}`}
                    placeholder="Порядок"
                    value={stepOrder}
                    onChange={(e) => { setStepOrder(e.target.value); setStepError('') }}
                    autoFocus
                  />
                  {stepFieldErrors.order && <div className="form-error">Укажите целое число</div>}
                </Field>

                <Field label="Name" required>
                  <input
                    className={`form-input${stepFieldErrors.name ? ' error' : ''}`}
                    placeholder="Название шага"
                    value={stepName}
                    onChange={(e) => { setStepName(e.target.value); setStepError('') }}
                  />
                  {stepFieldErrors.name && <div className="form-error">Name is required</div>}
                </Field>

                <Field label="Instruction" required>
                  <textarea
                    value={stepInstruction}
                    onChange={(e) => { setStepInstruction(e.target.value); setStepError('') }}
                    placeholder="Инструкция для шага…"
                    style={{
                      ...textareaStyle,
                      minHeight: 160,
                      borderColor: stepFieldErrors.instruction ? 'var(--accent2)' : 'var(--border)',
                    }}
                  />
                  {stepFieldErrors.instruction && <div className="form-error">Instruction is required</div>}
                </Field>

                {stepError && <div className="form-error" style={{ fontSize: 12 }}>{stepError}</div>}

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={handleSaveStep} disabled={savingStep}>
                    {savingStep ? <span className="modal-spinner" /> : <IconCheck />}
                    {savingStep ? 'Сохранение…' : 'Сохранить и продолжить'}
                  </button>
                </div>
              </div>
            )}
          </Panel>

        </div>
      </div>
    </div>
  )
}
