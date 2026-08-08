import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, AlertTriangle, Mic, MicOff, Volume2, Pill } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { getPatientMedicines, logDoseTaken } from '../services/cabinetService'
import { performSafetyCheck } from '../services/safetyService'
import { voiceService } from '../voice/voiceService'
import { askAboutMedicine } from '../ai/geminiService'
import { cabinetMedicineToMedicineRecord } from '../utils/medicineAdapter'
import type { CabinetMedicine, SafetyCheckResult, MedicineRecord } from '../types'

export function PatientDashboard() {
  const { user, activePatient } = useAuth()
  const { uiLang } = useApp()

  const [medicines, setMedicines] = useState<CabinetMedicine[]>([])
  const [safetyRes, setSafetyRes] = useState<SafetyCheckResult | null>(null)
  const [dosesTaken, setDosesTaken] = useState<Record<string, boolean>>({})

  // Voice AI state
  const [voiceQuery, setVoiceQuery] = useState('')
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const loadPatientViewData = useCallback(() => {
    if (!activePatient) return
    const list = getPatientMedicines(activePatient.id)
    setMedicines(list)
    const check = performSafetyCheck(list)
    setSafetyRes(check)
  }, [activePatient])

  useEffect(() => {
    loadPatientViewData()
  }, [loadPatientViewData])

  const handleTakeDose = (medId: string) => {
    if (!activePatient) return
    logDoseTaken(activePatient.id, medId)
    setDosesTaken((prev) => ({ ...prev, [medId]: true }))
    loadPatientViewData()
  }

  const handleVoiceAsk = async (text?: string) => {
    const q = text || voiceQuery
    if (!q.trim()) return

    setAiLoading(true)
    setAiAnswer(null)

    try {
      const defaultRecord: MedicineRecord = {
        id: 'patient_med',
        medicineName: 'My Medication',
        composition: '',
        uses: '',
        sideEffects: '',
        imageUrl: '',
        manufacturer: '',
        excellentReviewPct: null,
        averageReviewPct: null,
        poorReviewPct: null,
      }

      const targetMed: MedicineRecord = medicines[0]
        ? cabinetMedicineToMedicineRecord(medicines[0])
        : defaultRecord

      const answer = await askAboutMedicine(q, targetMed, [], uiLang)
      setAiAnswer(answer)

      // Speak answer using TTS
      voiceService.speakText(answer, uiLang)
    } catch {
      setAiAnswer('Sorry, I could not get an answer right now. Please ask your caregiver or doctor.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleToggleVoice = () => {
    if (isListening) {
      voiceService.stopListening()
      setIsListening(false)
      return
    }

    voiceService.startListening(
      uiLang,
      (transcript) => {
        setIsListening(false)
        setVoiceQuery(transcript)
        handleVoiceAsk(transcript)
      },
      () => setIsListening(false),
      () => setIsListening(false)
    )
    setIsListening(true)
  }

  const isClear = safetyRes?.status === 'clear'

  return (
    <div className="pt-dash-root">
      {/* Patient Header */}
      <div className="pt-header">
        <h1>{t('hello', uiLang)}, {user?.name || activePatient?.name || t('patientRole', uiLang)} 👋</h1>
        <p>{t('patientSubtext', uiLang)}</p>
      </div>

      {/* Safety Badge */}
      <div className={`pt-safety-badge ${isClear ? 'clear' : 'warning'}`}>
        {isClear ? <ShieldCheck size={28} /> : <AlertTriangle size={28} />}
        <div>
          <h3>{isClear ? t('safetyStatusClear', uiLang) : t('safetyStatusWarning', uiLang)}</h3>
          <p>
            {isClear
              ? t('safetyClearDetail', uiLang)
              : t('safetyWarningDetail', uiLang)}
          </p>
        </div>
      </div>

      {/* Today's Medicines Checklist */}
      <div className="pt-section">
        <h2>{t('todaysMedicines', uiLang)}</h2>
        <div className="pt-med-list">
          {medicines.map((med) => {
            const taken = dosesTaken[med.id]
            return (
              <div key={med.id} className={`pt-med-card ${taken ? 'taken' : ''}`}>
                <div className="pt-med-info">
                  <h3>{med.name}</h3>
                  <span className="pt-med-detail">{med.strength} • Take {med.dose}</span>
                  <span className="pt-med-time">{t('timing', uiLang)}: {med.times.join(', ')}</span>
                </div>
                <button className={`pt-take-btn ${taken ? 'done' : ''}`} onClick={() => handleTakeDose(med.id)}>
                  <CheckCircle2 size={22} />
                  <span>{taken ? t('taken', uiLang) : t('takeNow', uiLang)}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Prominent Voice Assistant Box */}
      <div className="pt-voice-card">
        <div className="pt-voice-header">
          <Volume2 size={28} style={{ color: 'var(--accent)' }} />
          <div>
            <h3>{t('askCarePilotAnything', uiLang)}</h3>
            <p>{t('tapMicPrompt', uiLang)}</p>
          </div>
        </div>

        <div className="pt-voice-action-row">
          <button className={`pt-mic-lg-btn ${isListening ? 'listening' : ''}`} onClick={handleToggleVoice}>
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
            <span>{isListening ? t('micListening', uiLang) : t('tapToSpeak', uiLang)}</span>
          </button>
        </div>

        <div className="pt-text-fallback">
          <input
            type="text"
            placeholder={t('typeQuestionPlaceholder', uiLang)}
            value={voiceQuery}
            onChange={(e) => setVoiceQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVoiceAsk()}
          />
          <button onClick={() => handleVoiceAsk()} disabled={aiLoading}>
            {aiLoading ? t('thinking', uiLang) : t('askCarePilot', uiLang)}
          </button>
        </div>

        {aiAnswer && (
          <div className="pt-ai-response-box">
            <div className="response-header">
              <Volume2 size={16} />
              <span>CarePilot Answer:</span>
            </div>
            <p>{aiAnswer}</p>
          </div>
        )}
      </div>

      {/* Cabinet Link */}
      <div className="pt-cabinet-link-box">
        <Link to="/patient/medicine-cabinet" className="pt-cab-btn">
          <Pill size={20} />
          <span>{t('viewDigitalCabinet', uiLang)}</span>
        </Link>
      </div>

      <style>{`
        .pt-dash-root { padding:24px 20px;max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:22px; }
        .pt-header h1 { font-size:1.6rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em; }
        .pt-header p { font-size:0.88rem;color:var(--text-muted); }
        .pt-safety-badge { display:flex;align-items:center;gap:14px;padding:18px;border-radius:16px;border:1px solid var(--border); }
        .pt-safety-badge.clear { background:rgba(45,212,191,0.12);border-color:rgba(45,212,191,0.3);color:#0d9488; }
        .pt-safety-badge.warning { background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.3);color:var(--danger); }
        .pt-safety-badge h3 { font-size:1.05rem;font-weight:800; }
        .pt-safety-badge p { font-size:0.82rem;margin-top:2px; }
        .pt-section h2 { font-size:1.15rem;font-weight:800;color:var(--text-primary);margin-bottom:12px; }
        .pt-med-list { display:flex;flex-direction:column;gap:12px; }
        .pt-med-card { background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:18px;display:flex;align-items:center;justify-content:space-between;gap:14px;box-shadow:0 4px 16px rgba(0,0,0,0.04); }
        .pt-med-card.taken { opacity:0.65; }
        .pt-med-info h3 { font-size:1.05rem;font-weight:800;color:var(--text-primary); }
        .pt-med-detail { font-size:0.85rem;color:var(--accent);font-weight:700;display:block;margin-top:2px; }
        .pt-med-time { font-size:0.78rem;color:var(--text-muted);display:block;margin-top:2px; }
        .pt-take-btn { display:flex;align-items:center;gap:8px;padding:12px 20px;background:var(--accent);color:#fff;border:none;border-radius:14px;font-family:inherit;font-size:0.9rem;font-weight:700;cursor:pointer;transition:all 0.15s; }
        .pt-take-btn.done { background:rgba(45,212,191,0.2);color:#0d9488; }
        .pt-voice-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:18px;box-shadow:0 6px 24px rgba(0,0,0,0.06); }
        .pt-voice-header { display:flex;align-items:center;gap:12px; }
        .pt-voice-header h3 { font-size:1.1rem;font-weight:800;color:var(--text-primary); }
        .pt-voice-header p { font-size:0.82rem;color:var(--text-muted); }
        .pt-voice-action-row { display:flex;justify-content:center; }
        .pt-mic-lg-btn { display:flex;align-items:center;justify-content:center;gap:10px;padding:16px 36px;background:var(--accent);color:#fff;border:none;border-radius:50px;font-family:inherit;font-size:1.05rem;font-weight:800;cursor:pointer;box-shadow:0 6px 24px rgba(14,165,233,0.35);transition:all 0.15s; }
        .pt-mic-lg-btn.listening { background:var(--danger);animation:pulse 1.2s infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.05)} }
        .pt-text-fallback { display:flex;gap:8px;background:var(--surface-secondary);padding:6px;border-radius:12px;border:1px solid var(--border); }
        .pt-text-fallback input { flex:1;border:none;background:transparent;outline:none;font-family:inherit;font-size:0.85rem;color:var(--text-primary);padding:0 8px; }
        .pt-text-fallback button { padding:8px 16px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:0.82rem;font-weight:700;cursor:pointer; }
        .pt-ai-response-box { background:var(--surface-secondary);border:1px solid var(--border);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:8px; }
        .response-header { display:flex;align-items:center;gap:6px;font-size:0.8rem;font-weight:700;color:var(--accent); }
        .pt-ai-response-box p { font-size:0.88rem;color:var(--text-primary);line-height:1.5; }
        .pt-cabinet-link-box { display:flex;justify-content:center; }
        .pt-cab-btn { display:flex;align-items:center;gap:10px;padding:14px 24px;background:var(--surface-secondary);border:1px solid var(--border);border-radius:16px;color:var(--text-primary);font-weight:700;text-decoration:none;font-size:0.9rem;transition:all 0.15s; }
        .pt-cab-btn:hover { border-color:var(--accent);color:var(--accent); }
      `}</style>
    </div>
  )
}
