import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../components/ui'
import { IconScenario, IconBack, IconPlus, IconCheck, IconSpinner } from '../components/Icons'
import { fmt, API_BASE } from '../utils'
import { apiFetch } from '../utils/auth'
import { useBackPath } from '../hooks/useBackPath'
import { labelStyle, textareaStyle, Field, ReadonlyValue, Panel, OrderPill } from '../components/scenario/ui'

// ScenarioEvaluationType on the backend
const EVALUATION_TYPES = ['noal', 'choice', 'score']

// Evaluations of a scenario.
const evaluationsUrl = (scenarioId) => `${API_BASE}/scenario/${scenarioId}/evaluations`

// ScenarioConditionOperator on the backend
const CONDITION_OPERATORS = [
  { value: 'gt',  label: '>  (gt)' },
  { value: 'gte', label: '>= (gte)' },
  { value: 'lt',  label: '<  (lt)' },
  { value: 'lte', label: '<= (lte)' },
]

// `choices` may come as a list or as a dict.
function choiceOptions(evaluation) {
  const raw = evaluation?.choices
  if (Array.isArray(raw)) return raw.map(c => ({ value: String(c), label: String(c) }))
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([k, v]) => ({ value: String(k), label: `${k} — ${v}` }))
  }
  return []
}

const defaultCondition = (evaluation) => {
  const options = choiceOptions(evaluation)
  return {
    value: options.length ? options[0].value : '',
    operator: 'gte',
    min_probability: 0.5,
  }
}

export function ScenarioStepPage() {
  const { stepSeg } = useParams()
  const navigate = useNavigate()
  const backPath = useBackPath()

  const stepId = stepSeg.replace(/^step_/, '')

  const [step, setStep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTransitionForm, setShowTransitionForm] = useState(false)

  // ── evaluation being created inside the transition block ──
  const [evalQuestion, setEvalQuestion] = useState('')
  const [evalType, setEvalType] = useState(EVALUATION_TYPES[0])
  const [evalChoices, setEvalChoices] = useState([''])
  const [evalFieldErrors, setEvalFieldErrors] = useState({})
  const [savingEval, setSavingEval] = useState(false)
  const [evalError, setEvalError] = useState('')

  // existing evaluations to pick from
  const [evalMode, setEvalMode] = useState('select') // 'select' | 'create'
  const [evaluations, setEvaluations] = useState([])
  const [evaluationsLoading, setEvaluationsLoading] = useState(false)
  const [selectedEvaluationId, setSelectedEvaluationId] = useState('')
  // evaluations pinned to this transition, in the order they were added
  const [attachedEvaluations, setAttachedEvaluations] = useState([])
  const [showConditions, setShowConditions] = useState(false)
  const [conditions, setConditions] = useState({}) // evaluation id -> {value, operator, min_probability}

  const fetchStep = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`${API_BASE}/scenario/step/${stepId}`)
      if (res.ok) setStep(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [stepId])

  useEffect(() => { fetchStep() }, [fetchStep])

  const fetchEvaluations = useCallback(async () => {
    const scenarioId = step?.scenario_id
    if (!scenarioId) return
    setEvaluationsLoading(true)
    try {
      const res = await apiFetch(evaluationsUrl(scenarioId))
      if (res.ok) {
        const data = await res.json()
        setEvaluations(Array.isArray(data) ? data : [])
      }
    } catch (e) { console.error(e) }
    finally { setEvaluationsLoading(false) }
  }, [step?.scenario_id])

  useEffect(() => {
    if (showTransitionForm) fetchEvaluations()
  }, [showTransitionForm, fetchEvaluations])

  const withChoices = evalType === 'choice' || evalType === 'score'
  const selectedEvaluation = evaluations.find(ev => String(ev.id) === String(selectedEvaluationId)) ?? null
  const isAttached = (id) => attachedEvaluations.some(ev => String(ev.id) === String(id))
  const availableEvaluations = evaluations.filter(ev => !isAttached(ev.id))

  const attachEvaluation = (evaluation) => {
    if (!evaluation || isAttached(evaluation.id)) return
    setAttachedEvaluations(prev => [...prev, evaluation])
  }

  const handleAttachSelected = () => {
    if (!selectedEvaluation) return
    attachEvaluation(selectedEvaluation)
    setSelectedEvaluationId('')
  }

  const detachEvaluation = (id) => {
    setAttachedEvaluations(prev => prev.filter(ev => String(ev.id) !== String(id)))
    setConditions(prev => {
      const next = { ...prev }
      delete next[String(id)]
      return next
    })
  }

  const conditionFor = (evaluation) => conditions[String(evaluation.id)] ?? defaultCondition(evaluation)

  const updateCondition = (evaluation, patch) => {
    setConditions(prev => ({
      ...prev,
      [String(evaluation.id)]: {
        ...defaultCondition(evaluation),
        ...prev[String(evaluation.id)],
        ...patch,
      },
    }))
  }

  const setChoiceAt = (i, value) => {
    setEvalChoices(prev => prev.map((c, idx) => idx === i ? value : c))
    setEvalError('')
  }
  const addChoice = () => setEvalChoices(prev => [...prev, ''])
  const removeChoice = (i) => setEvalChoices(prev => prev.filter((_, idx) => idx !== i))

  const resetEvalForm = () => {
    setEvalQuestion('')
    setEvalType(EVALUATION_TYPES[0])
    setEvalChoices([''])
    setEvalFieldErrors({})
    setEvalError('')
  }

  const handleCreateEvaluation = async () => {
    const filledChoices = evalChoices.map(c => c.trim()).filter(Boolean)
    const errors = {
      question: !evalQuestion.trim(),
      choices: withChoices && filledChoices.length === 0,
    }
    setEvalFieldErrors(errors)
    if (errors.question || errors.choices) return

    setSavingEval(true); setEvalError('')
    try {
      const res = await apiFetch(`${API_BASE}/scenario/evaluation/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: parseInt(step?.scenario_id),
          question: evalQuestion.trim(),
          type: evalType,
          choices: withChoices ? filledChoices : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setEvalError(typeof err.detail === 'string' ? err.detail : `Error ${res.status}`)
        return
      }
      const created = await res.json().catch(() => null)
      if (created) {
        setEvaluations(prev => [...prev, created])
        attachEvaluation(created)
      }
      setSelectedEvaluationId('')
      resetEvalForm()
      setEvalMode('select')
    } catch (e) {
      setEvalError('Network error: ' + e.message)
    } finally {
      setSavingEval(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:16,color:'var(--text-muted)',fontSize:12 }}>
          <IconSpinner size={28} /> Loading…
        </div>
      </div>
    )
  }
  if (!step) {
    return (<div className="page"><EmptyState icon={<IconScenario />} title="Step not found" /></div>)
  }

  const transitions = Array.isArray(step.incoming_transitions) ? step.incoming_transitions : []

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <div>
            <div className="page-title">
              {step.name || 'Step'} <span className="entity-tag">step</span>
            </div>
            <div className="page-subtitle">ID #{fmt(step.id ?? stepId)} · Scenario #{fmt(step.scenario_id)}</div>
          </div>
          <button className="btn btn-back" onClick={() => navigate(backPath)}><IconBack /> Back</button>
        </div>
      </div>

      <div style={{ padding: '32px 40px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Block 1: step fields ── */}
          <Panel title="Step">
            <Field label="Order">
              <ReadonlyValue>{fmt(step.order)}</ReadonlyValue>
            </Field>

            <Field label="Name">
              <input className="form-input" value={step.name ?? ''} readOnly />
            </Field>

            <Field label="Instruction">
              <textarea
                value={step.instruction ?? step.instructions ?? ''}
                readOnly
                style={{ ...textareaStyle, minHeight: 160 }}
              />
            </Field>
          </Panel>

          {/* ── Block 2: transitions ── */}
          <Panel title="Переходы" count={transitions.length}>
            {transitions.length === 0 && !showTransitionForm ? (
              <div style={{
                padding: '18px 0', textAlign: 'center',
                fontSize: 11, color: 'var(--text-muted)',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                Переходов пока нет
              </div>
            ) : (
              transitions.map((tr, i) => (
                <div key={tr.id ?? i} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <OrderPill>#{fmt(tr.id)}</OrderPill>
                    <span style={{
                      fontSize: 11, color: 'var(--text)',
                      fontFamily: "'IBM Plex Mono', monospace", flex: 1,
                    }}>
                      step {fmt(tr.from_step_id)} → {tr.to_step_id ? `step ${tr.to_step_id}` : '—'}
                    </span>
                  </div>
                  <div>
                    <div style={{ ...labelStyle, marginBottom: 4 }}>Conditions</div>
                    <div style={{
                      fontSize: 11, color: 'var(--text-muted)',
                      fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.65,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {tr.conditions == null
                        ? '—'
                        : typeof tr.conditions === 'object'
                          ? JSON.stringify(tr.conditions, null, 2)
                          : String(tr.conditions)}
                    </div>
                  </div>
                </div>
              ))
            )}

            {!showTransitionForm && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => setShowTransitionForm(true)}>
                  <IconPlus /> Добавить переход
                </button>
              </div>
            )}

            {showTransitionForm && (
              <div style={{
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '16px 16px 18px',
                display: 'flex', flexDirection: 'column', gap: 18,
                animation: 'fadeIn 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ ...labelStyle, marginBottom: 0, flex: 1, fontSize: 11 }}>Новый переход</div>
                  <button className="modal-close" onClick={() => setShowTransitionForm(false)}>✕</button>
                </div>
                {/* ── evaluation: pick an existing one or create a new one ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {attachedEvaluations.length > 0 && (
                    <Field label={`Закреплённые оценки (${attachedEvaluations.length})`}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {attachedEvaluations.map((ev) => (
                          <div key={ev.id} style={{
                            padding: '10px 12px', borderRadius: 8,
                            background: 'rgba(106,255,212,0.06)',
                            border: '1px solid rgba(106,255,212,0.25)',
                            display: 'flex', flexDirection: 'column', gap: 6,
                            fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <OrderPill>#{fmt(ev.id)}</OrderPill>
                              <span style={{ color: 'var(--accent3)', textTransform: 'uppercase', flex: 1 }}>{fmt(ev.type)}</span>
                              <button
                                type="button"
                                className="modal-close"
                                title="Открепить"
                                onClick={() => detachEvaluation(ev.id)}
                              >✕</button>
                            </div>
                            <div style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {fmt(ev.question)}
                            </div>
                            {Array.isArray(ev.choices) && ev.choices.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {ev.choices.map((c, i) => (
                                  <span key={i} style={{
                                    fontSize: 10, padding: '2px 8px', borderRadius: 10,
                                    background: 'var(--bg)', border: '1px solid var(--border)',
                                    color: 'var(--text-muted)',
                                  }}>{String(c)}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Field>
                  )}

                  <Field label={attachedEvaluations.length > 0 ? 'Добавить ещё оценку' : 'Оценка'}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { id: 'select', label: 'Выбрать существующую' },
                        { id: 'create', label: 'Создать новую' },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setEvalMode(id); setEvalError('') }}
                          style={{
                            flex: 1, padding: '8px 12px', borderRadius: 8,
                            background: evalMode === id ? 'rgba(124,106,255,0.15)' : 'var(--surface2)',
                            border: `1px solid ${evalMode === id ? 'rgba(124,106,255,0.4)' : 'var(--border)'}`,
                            color: evalMode === id ? 'var(--accent)' : 'var(--text-muted)',
                            fontSize: 10, fontWeight: 600,
                            fontFamily: "'IBM Plex Mono', monospace",
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {evalMode === 'select' && (
                    <Field label="Evaluation" required>
                      <select
                        value={selectedEvaluationId}
                        onChange={(e) => setSelectedEvaluationId(e.target.value)}
                        className="form-input"
                        disabled={evaluationsLoading}
                        style={{ cursor: evaluationsLoading ? 'wait' : 'pointer', opacity: evaluationsLoading ? 0.6 : 1 }}
                      >
                        <option value="">
                          {evaluationsLoading
                            ? 'Загрузка…'
                            : availableEvaluations.length === 0
                              ? (evaluations.length === 0 ? 'Оценок пока нет' : 'Все оценки уже закреплены')
                              : '— выберите оценку —'}
                        </option>
                        {availableEvaluations.map(ev => (
                          <option key={ev.id} value={String(ev.id)}>
                            #{ev.id} · {ev.type} · {ev.question}
                          </option>
                        ))}
                      </select>

                      {selectedEvaluation && (
                        <div style={{
                          marginTop: 10, padding: '10px 12px', borderRadius: 8,
                          background: 'rgba(106,255,212,0.06)',
                          border: '1px solid rgba(106,255,212,0.25)',
                          display: 'flex', flexDirection: 'column', gap: 6,
                          fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <OrderPill>#{fmt(selectedEvaluation.id)}</OrderPill>
                            <span style={{ color: 'var(--accent3)', textTransform: 'uppercase' }}>{fmt(selectedEvaluation.type)}</span>
                          </div>
                          <div style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {fmt(selectedEvaluation.question)}
                          </div>
                          {Array.isArray(selectedEvaluation.choices) && selectedEvaluation.choices.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {selectedEvaluation.choices.map((c, i) => (
                                <span key={i} style={{
                                  fontSize: 10, padding: '2px 8px', borderRadius: 10,
                                  background: 'var(--bg)', border: '1px solid var(--border)',
                                  color: 'var(--text-muted)',
                                }}>{String(c)}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                        <button
                          className="btn btn-primary"
                          onClick={handleAttachSelected}
                          disabled={!selectedEvaluation}
                        >
                          <IconPlus /> Добавить
                        </button>
                      </div>
                    </Field>
                  )}

                  {evalMode === 'create' && (
                  <>
                  <Field label="Question" required>
                    <textarea
                      value={evalQuestion}
                      onChange={(e) => { setEvalQuestion(e.target.value); setEvalError('') }}
                      placeholder="Вопрос для оценки…"
                      style={{
                        ...textareaStyle,
                        minHeight: 100,
                        borderColor: evalFieldErrors.question ? 'var(--accent2)' : 'var(--border)',
                      }}
                    />
                    {evalFieldErrors.question && <div className="form-error">Question is required</div>}
                  </Field>

                  <Field label="Type" required>
                    <select
                      value={evalType}
                      onChange={(e) => { setEvalType(e.target.value); setEvalError('') }}
                      className="form-input"
                      style={{ cursor: 'pointer' }}
                    >
                      {EVALUATION_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>

                  {withChoices && (
                    <Field label="Choices" required>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {evalChoices.map((choice, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              className="form-input"
                              placeholder={`Вариант ${i + 1}`}
                              value={choice}
                              onChange={(e) => setChoiceAt(i, e.target.value)}
                            />
                            {evalChoices.length > 1 && (
                              <button
                                type="button"
                                className="modal-close"
                                title="Удалить вариант"
                                onClick={() => removeChoice(i)}
                              >✕</button>
                            )}
                          </div>
                        ))}
                        <div>
                          <button type="button" className="btn btn-ghost" onClick={addChoice}>
                            <IconPlus /> Вариант
                          </button>
                        </div>
                      </div>
                      {evalFieldErrors.choices && <div className="form-error">Добавьте хотя бы один вариант</div>}
                    </Field>
                  )}

                  {evalError && <div className="form-error" style={{ fontSize: 12 }}>{evalError}</div>}

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={handleCreateEvaluation} disabled={savingEval}>
                      {savingEval ? <span className="modal-spinner" /> : <IconCheck />}
                      {savingEval ? 'Добавление…' : 'Добавить'}
                    </button>
                  </div>
                  </>
                  )}

                  {attachedEvaluations.length > 0 && !showConditions && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button className="btn btn-ghost" onClick={() => setShowConditions(true)}>
                        <IconPlus /> Добавить условие для перехода
                      </button>
                    </div>
                  )}

                  {attachedEvaluations.length > 0 && showConditions && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 14,
                      animation: 'fadeIn 0.2s ease',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ ...labelStyle, marginBottom: 0, flex: 1 }}>Условия перехода</div>
                        <button className="modal-close" onClick={() => setShowConditions(false)}>✕</button>
                      </div>

                      {attachedEvaluations.map((ev) => {
                        const options = choiceOptions(ev)
                        const cond = conditionFor(ev)
                        return (
                          <div key={ev.id} style={{
                            padding: '12px 14px', borderRadius: 8,
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            display: 'flex', flexDirection: 'column', gap: 12,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <OrderPill>#{fmt(ev.id)}</OrderPill>
                              <span style={{
                                fontSize: 10, color: 'var(--accent3)', textTransform: 'uppercase',
                                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                              }}>{fmt(ev.type)}</span>
                            </div>
                            <div style={{
                              fontSize: 11, color: 'var(--text)',
                              fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.6,
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            }}>
                              {fmt(ev.question)}
                            </div>

                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                              {/* value — "noal" has nothing to pick */}
                              {ev.type !== 'noal' && (
                                <div style={{ flex: '1 1 180px', minWidth: 160 }}>
                                  <div style={labelStyle}>Вариант</div>
                                  {options.length > 0 ? (
                                    <select
                                      className="form-input"
                                      style={{ cursor: 'pointer' }}
                                      value={cond.value}
                                      onChange={(e) => updateCondition(ev, { value: e.target.value })}
                                    >
                                      {options.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      className="form-input"
                                      placeholder="Значение"
                                      maxLength={255}
                                      value={cond.value}
                                      onChange={(e) => updateCondition(ev, { value: e.target.value })}
                                    />
                                  )}
                                </div>
                              )}

                              {/* operator */}
                              <div style={{ flex: '0 1 140px', minWidth: 120 }}>
                                <div style={labelStyle}>Оператор</div>
                                <select
                                  className="form-input"
                                  style={{ cursor: 'pointer' }}
                                  value={cond.operator}
                                  onChange={(e) => updateCondition(ev, { operator: e.target.value })}
                                >
                                  {CONDITION_OPERATORS.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                  ))}
                                </select>
                              </div>

                              {/* min_probability */}
                              <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                                <div style={labelStyle}>Вероятность</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 37 }}>
                                  <input
                                    type="range"
                                    min="0" max="1" step="0.01"
                                    value={cond.min_probability}
                                    onChange={(e) => updateCondition(ev, { min_probability: parseFloat(e.target.value) })}
                                    style={{
                                      flex: 1, height: 4, appearance: 'none', WebkitAppearance: 'none',
                                      background: `linear-gradient(to right, var(--accent) ${cond.min_probability * 100}%, var(--surface2) ${cond.min_probability * 100}%)`,
                                      borderRadius: 2, outline: 'none', cursor: 'pointer',
                                    }}
                                  />
                                  <span style={{
                                    minWidth: 42, textAlign: 'center',
                                    fontSize: 12, fontWeight: 700, color: 'var(--text)',
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    padding: '4px 8px', borderRadius: 6,
                                    background: 'var(--surface2)', border: '1px solid var(--border)',
                                  }}>
                                    {Number(cond.min_probability).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Panel>

        </div>
      </div>
    </div>
  )
}
