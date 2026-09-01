import { useState, useEffect } from 'react'
import { API_BASE } from '../../utils'
import { apiFetch } from '../../utils/auth'

export function ThreadSettingsModal({ threadId, aiModel, aiTemperature, language, onClose, onUpdated }) {
  const [modelList, setModelList] = useState([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [langList, setLangList] = useState([])
  const [langsLoading, setLangsLoading] = useState(true)

  const [model, setModel] = useState(aiModel ?? '')
  const [temperature, setTemperature] = useState(aiTemperature ?? 0.7)
  const [lang, setLang] = useState(language ?? '')

  const [savingModel, setSavingModel] = useState(false)
  const [modelOk, setModelOk] = useState(false)
  const [modelError, setModelError] = useState(false)

  const [savingTemp, setSavingTemp] = useState(false)
  const [tempOk, setTempOk] = useState(false)
  const [tempError, setTempError] = useState(false)

  const [savingLang, setSavingLang] = useState(false)
  const [langOk, setLangOk] = useState(false)
  const [langError, setLangError] = useState(false)

  useEffect(() => {
    (async () => {
      setModelsLoading(true)
      try {
        const res = await apiFetch(`${API_BASE}/utils/get_ai_model_list`)
        if (res.ok) setModelList(await res.json())
      } catch {}
      finally { setModelsLoading(false) }
    })();
    (async () => {
      setLangsLoading(true)
      try {
        const res = await apiFetch(`${API_BASE}/utils/get_language_list`)
        if (res.ok) setLangList(await res.json())
      } catch {}
      finally { setLangsLoading(false) }
    })()
  }, [])

  const handleModelChange = async (newModel) => {
    setModel(newModel)
    setSavingModel(true); setModelOk(false); setModelError(false)
    try {
      const res = await apiFetch(`${API_BASE}/threads/edit_ai_model`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: parseInt(threadId), ai_model: newModel }),
      })
      if (res.ok) { setModelOk(true); onUpdated({ ai_model: newModel }); setTimeout(() => setModelOk(false), 2000) }
      else setModelError(true)
    } catch { setModelError(true) }
    finally { setSavingModel(false) }
  }

  const handleTemperatureChange = async (newTemp) => {
    const value = parseFloat(newTemp)
    setTemperature(value)
    setSavingTemp(true); setTempOk(false); setTempError(false)
    try {
      const res = await apiFetch(`${API_BASE}/threads/edit_ai_temperature`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: parseInt(threadId), ai_temperature: value }),
      })
      if (res.ok) { setTempOk(true); onUpdated({ ai_temperature: value }); setTimeout(() => setTempOk(false), 2000) }
      else setTempError(true)
    } catch { setTempError(true) }
    finally { setSavingTemp(false) }
  }

  const handleLangChange = async (newLang) => {
    setLang(newLang)
    setSavingLang(true); setLangOk(false); setLangError(false)
    try {
      const res = await apiFetch(`${API_BASE}/threads/edit_language_by_thread_id`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: parseInt(threadId), language: newLang }),
      })
      if (res.ok) { setLangOk(true); onUpdated({ language: newLang }); setTimeout(() => setLangOk(false), 2000) }
      else setLangError(true)
    } catch { setLangError(true) }
    finally { setSavingLang(false) }
  }

  const labelStyle = {
    fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase',
    color: 'var(--text-dim)', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 8,
  }

  const selectStyle = (saving, loading) => ({
    flex: 1, padding: '8px 12px',
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text)', fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    outline: 'none', cursor: (saving || loading) ? 'wait' : 'pointer',
    opacity: (saving || loading) ? 0.6 : 1,
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Настройки чата</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* AI Model */}
          <div>
            <div style={labelStyle}>AI Model</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={savingModel || modelsLoading}
                style={selectStyle(savingModel, modelsLoading)}
              >
                {modelsLoading && <option value={model}>{model || '…'}</option>}
                {!modelsLoading && modelList.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
                {!modelsLoading && model && !modelList.includes(model) && (
                  <option value={model}>{model}</option>
                )}
              </select>
              {savingModel && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>…</span>}
              {modelOk && <span style={{ fontSize: 10, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>✓</span>}
              {modelError && <span style={{ fontSize: 10, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>✕</span>}
            </div>
          </div>

          {/* Language */}
          <div>
            <div style={labelStyle}>Language</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={lang}
                onChange={(e) => handleLangChange(e.target.value)}
                disabled={savingLang || langsLoading}
                style={selectStyle(savingLang, langsLoading)}
              >
                {langsLoading && <option value={lang}>{lang || '…'}</option>}
                {!langsLoading && langList.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
                {!langsLoading && lang && !langList.includes(lang) && (
                  <option value={lang}>{lang}</option>
                )}
              </select>
              {savingLang && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>…</span>}
              {langOk && <span style={{ fontSize: 10, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>✓</span>}
              {langError && <span style={{ fontSize: 10, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>✕</span>}
            </div>
          </div>

          {/* AI Temperature */}
          <div>
            <div style={labelStyle}>AI Temperature</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                onMouseUp={(e) => handleTemperatureChange(e.target.value)}
                onTouchEnd={(e) => handleTemperatureChange(e.target.value)}
                disabled={savingTemp}
                style={{
                  flex: 1, height: 4, appearance: 'none', WebkitAppearance: 'none',
                  background: `linear-gradient(to right, var(--accent) ${temperature * 100}%, var(--surface2) ${temperature * 100}%)`,
                  borderRadius: 2, outline: 'none', cursor: savingTemp ? 'wait' : 'pointer',
                  opacity: savingTemp ? 0.6 : 1,
                }}
              />
              <span style={{
                minWidth: 36, textAlign: 'center',
                fontSize: 13, fontWeight: 700, color: 'var(--text)',
                fontFamily: "'IBM Plex Mono', monospace",
                padding: '4px 8px', borderRadius: 6,
                background: 'var(--surface2)', border: '1px solid var(--border)',
              }}>
                {temperature.toFixed(2)}
              </span>
              {savingTemp && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>…</span>}
              {tempOk && <span style={{ fontSize: 10, color: 'var(--accent3)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>✓</span>}
              {tempError && <span style={{ fontSize: 10, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>✕</span>}
            </div>
          </div>

        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}
