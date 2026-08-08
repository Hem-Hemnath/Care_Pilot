import { useState, useEffect } from 'react'
import { ShieldCheck, AlertTriangle, Info, RefreshCw, Stethoscope } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { getPatientMedicines } from '../services/cabinetService'
import { performSafetyCheck } from '../services/safetyService'
import type { SafetyCheckResult } from '../types'

export function SafetyPage() {
  const { activePatient } = useAuth()
  const { uiLang } = useApp()

  const [result, setResult] = useState<SafetyCheckResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runCheck = () => {
    if (!activePatient) return
    setLoading(true)
    const medicines = getPatientMedicines(activePatient.id)
    const res = performSafetyCheck(medicines)
    setResult(res)
    setLoading(false)
  }

  useEffect(() => {
    runCheck()
  }, [activePatient])

  return (
    <div className="safety-root">
      <div className="safety-header">
        <div>
          <h1 className="safety-title">{t('safety', uiLang)}</h1>
          <p className="safety-subtitle">
            {activePatient
              ? `Automated safety analysis for ${activePatient.name}'s active cabinet`
              : 'Patient medicine safety analysis'}
          </p>
        </div>
        <button className="safety-refresh-btn" onClick={runCheck} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Re-check Cabinet</span>
        </button>
      </div>

      {/* Safety Status Banner */}
      {result && (
        <div className={`safety-status-card ${result.status}`}>
          <div className="status-icon">
            {result.status === 'clear' ? (
              <ShieldCheck size={36} />
            ) : result.status === 'warning' ? (
              <AlertTriangle size={36} />
            ) : (
              <Info size={36} />
            )}
          </div>
          <div className="status-info">
            <h2>
              {result.status === 'clear'
                ? t('safetyClear', uiLang)
                : result.status === 'warning'
                ? t('safetyWarning', uiLang)
                : 'Insufficient Data'}
            </h2>
            <p>
              {result.status === 'clear'
                ? 'No active ingredient duplicates or known medication interaction warnings were detected in your current cabinet.'
                : `${result.warnings.length} safety alert(s) detected based on verified medicine data.`}
            </p>
          </div>
        </div>
      )}

      {/* Warning Cards List */}
      {result && result.warnings.length > 0 && (
        <div className="warnings-section">
          <h3>Active Safety Alerts</h3>
          <div className="warnings-list">
            {result.warnings.map((warn) => (
              <div key={warn.id} className={`warning-card ${warn.severity}`}>
                <div className="warning-header">
                  <span className={`severity-badge ${warn.severity}`}>
                    {warn.severity.toUpperCase()} SEVERITY
                  </span>
                  <span className="type-badge">{warn.type.replace('_', ' ').toUpperCase()}</span>
                </div>

                <p className="warning-msg">{warn.message}</p>

                <div className="medicines-involved">
                  <strong>Medicines involved:</strong> {warn.medicines.join(' • ')}
                </div>

                <div className="recommendation-box">
                  <Stethoscope size={16} />
                  <span>{warn.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Medical Disclaimer */}
      <div className="safety-disclaimer-box">
        <Stethoscope size={20} />
        <div>
          <h4>Important Healthcare Notice</h4>
          <p>{t('disclaimer', uiLang)} Never change or stop prescribed medicines without consulting a doctor or pharmacist.</p>
        </div>
      </div>

      <style>{`
        .safety-root { padding:24px 20px;max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:20px; }
        .safety-header { display:flex;align-items:center;justify-content:space-between;gap:16px; }
        .safety-title { font-size:1.5rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em; }
        .safety-subtitle { font-size:0.85rem;color:var(--text-muted); }
        .safety-refresh-btn { display:flex;align-items:center;gap:8px;padding:9px 16px;background:var(--surface-secondary);border:1px solid var(--border);border-radius:12px;font-family:inherit;font-size:0.85rem;font-weight:600;color:var(--text-primary);cursor:pointer; }
        .safety-refresh-btn:hover { border-color:var(--accent);color:var(--accent); }
        .spin { animation:spSpin 1s linear infinite; }
        @keyframes spSpin { to { transform:rotate(360deg); } }
        .safety-status-card { display:flex;align-items:center;gap:18px;padding:22px;border-radius:18px;border:1px solid var(--border); }
        .safety-status-card.clear { background:rgba(45,212,191,0.1);border-color:rgba(45,212,191,0.3);color:#0d9488; }
        .safety-status-card.warning { background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);color:var(--danger); }
        .safety-status-card.insufficient_data { background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.3);color:var(--warning); }
        .status-info h2 { font-size:1.15rem;font-weight:800; }
        .status-info p { font-size:0.85rem;margin-top:2px;opacity:0.9; }
        .warnings-section { display:flex;flex-direction:column;gap:12px; }
        .warnings-section h3 { font-size:1.05rem;font-weight:700;color:var(--text-primary); }
        .warnings-list { display:flex;flex-direction:column;gap:14px; }
        .warning-card { background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 4px 16px rgba(0,0,0,0.04); }
        .warning-header { display:flex;align-items:center;gap:8px; }
        .severity-badge { font-size:0.68rem;font-weight:800;padding:3px 8px;border-radius:8px;letter-spacing:0.04em; }
        .severity-badge.high { background:rgba(239,68,68,0.15);color:var(--danger); }
        .severity-badge.medium { background:rgba(245,158,11,0.15);color:var(--warning); }
        .severity-badge.low { background:rgba(14,165,233,0.15);color:var(--accent); }
        .type-badge { font-size:0.68rem;font-weight:700;color:var(--text-muted);background:var(--surface-secondary);padding:3px 8px;border-radius:8px; }
        .warning-msg { font-size:0.9rem;font-weight:600;color:var(--text-primary); }
        .medicines-involved { font-size:0.82rem;color:var(--text-secondary); }
        .recommendation-box { display:flex;align-items:flex-start;gap:8px;font-size:0.82rem;font-weight:500;color:var(--text-primary);background:var(--surface-secondary);padding:10px 12px;border-radius:10px;border-left:3px solid var(--accent); }
        .safety-disclaimer-box { display:flex;align-items:flex-start;gap:12px;padding:16px;background:var(--surface-secondary);border:1px solid var(--border);border-radius:14px;color:var(--text-secondary);font-size:0.82rem; }
        .safety-disclaimer-box h4 { font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:2px; }
      `}</style>
    </div>
  )
}
