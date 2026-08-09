import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Pill, AlertTriangle, ShieldCheck, Camera, FileText, CheckCircle2,
  Mic, MicOff, Volume2, ArrowRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { getPatientMedicines, logDoseTaken } from '../services/cabinetService'
import { performSafetyCheck } from '../services/safetyService'
import { voiceService } from '../voice/voiceService'
import { askAboutMedicine, identifyMedicineFromText } from '../ai/geminiService'
import { GlassDropdown } from '../components/ui/GlassDropdown'
import { cabinetMedicineToMedicineRecord } from '../utils/medicineAdapter'
import { Disclaimer } from '../components/Disclaimer'
import type { CabinetMedicine, SafetyCheckResult, ChatMessage, MedicineRecord } from '../types'

export function CaregiverDashboard() {
  const { user, activePatient, patients, setActivePatient } = useAuth()
  const { uiLang } = useApp()

  const [medicines, setMedicines] = useState<CabinetMedicine[]>([])
  const [safetyRes, setSafetyRes] = useState<SafetyCheckResult | null>(null)
  const [dosesTaken, setDosesTaken] = useState<Record<string, boolean>>({})

  // Voice & AI Chat state
  const [queryText, setQueryText] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const loadDashboardData = useCallback(() => {
    if (!activePatient) return
    const list = getPatientMedicines(activePatient.id)
    setMedicines(list)
    const check = performSafetyCheck(list)
    setSafetyRes(check)
  }, [activePatient])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleTakeDose = (medId: string) => {
    if (!activePatient) return
    logDoseTaken(activePatient.id, medId)
    setDosesTaken((prev) => ({ ...prev, [medId]: true }))
    loadDashboardData()
  }

  const handleSendQuery = async (textToSend?: string) => {
    const q = textToSend || queryText
    if (!q.trim() || aiLoading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: q.trim(),
      timestamp: new Date(),
      language: uiLang,
    }
    setChatMessages((prev) => [...prev, userMsg])
    setQueryText('')
    setAiLoading(true)

    try {
      const defaultRecord: MedicineRecord = {
        id: 'generic',
        medicineName: 'General Medication',
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

      const identified = await identifyMedicineFromText(q)
      const medToUse: MedicineRecord = identified.medicine || targetMed

      const answer = await askAboutMedicine(q, medToUse, [], uiLang)
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
        language: uiLang,
      }
      setChatMessages((prev) => [...prev, aiMsg])

      // Play voice output using TTS
      if (voiceService.isSupported()) {
        voiceService.speak(answer, uiLang)
      }
    } catch {
      /* ignore */
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
        setQueryText(transcript)
        handleSendQuery(transcript)
      },
      () => setIsListening(false),
      () => setIsListening(false)
    )
    setIsListening(true)
  }

  const totalMeds = medicines.length
  const warningCount = safetyRes?.warnings.length || 0

  const patientOptions = patients.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.age} yrs)`,
    description: p.conditions.join(', '),
  }))

  return (
    <div className="cg-dash-root">
      {/* Welcome Header & Patient Switcher */}
      <div className="cg-header">
        <div className="cg-welcome">
          <h1>{t('goodMorning', uiLang)}, {user?.name || t('caregiverRole', uiLang)} 👋</h1>
          <p>{t('caregiverSubtext', uiLang)}</p>
        </div>

        {patients.length > 0 && (
          <GlassDropdown
            options={patientOptions}
            value={activePatient?.id || patients[0]?.id || ''}
            onChange={(val) => setActivePatient(val)}
            icon={<Users size={16} />}
            label={t('managingPatient', uiLang)}
          />
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><Pill size={24} /></div>
          <div className="kpi-info">
            <span className="kpi-val">{totalMeds}</span>
            <span className="kpi-lbl">{t('activeMedicines', uiLang)}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle2 size={24} /></div>
          <div className="kpi-info">
            <span className="kpi-val">{Object.keys(dosesTaken).length} / {totalMeds}</span>
            <span className="kpi-lbl">{t('dosesTakenToday', uiLang)}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange"><AlertTriangle size={24} /></div>
          <div className="kpi-info">
            <span className="kpi-val">{warningCount}</span>
            <span className="kpi-lbl">{t('safetyAlerts', uiLang)}</span>
          </div>
        </div>
      </div>

      {/* Safety Alert Banner */}
      {warningCount > 0 ? (
        <div className="cg-alert-banner">
          <AlertTriangle size={24} />
          <div>
            <h3>{t('safetyAlertsDetected', uiLang, { count: warningCount })}</h3>
            <p>{t('safetyAlertDetail', uiLang, { name: activePatient?.name || '' })}</p>
          </div>
          <Link to="/caregiver/medicine-cabinet" className="alert-btn">{t('viewCabinet', uiLang)}</Link>
        </div>
      ) : (
        <div className="cg-clear-banner">
          <ShieldCheck size={24} />
          <div>
            <h3>{t('allClearTitle', uiLang)}</h3>
            <p>{t('allClearSubtext', uiLang)}</p>
          </div>
        </div>
      )}

      {/* Quick Tool Launcher Grid */}
      <div className="section">
        <h2>{t('caregiverActions', uiLang)}</h2>
        <div className="action-grid">
          <Link to="/caregiver/medicine-scanner" className="action-card">
            <Camera size={24} className="icon-teal" />
            <div className="action-text">
              <h3>{t('scanner', uiLang)}</h3>
              <p>{t('scanSubtext', uiLang)}</p>
            </div>
          </Link>

          <Link to="/caregiver/prescription-scanner" className="action-card">
            <FileText size={24} className="icon-blue" />
            <div className="action-text">
              <h3>{t('prescriptions', uiLang)}</h3>
              <p>{t('prescriptionSubtext', uiLang)}</p>
            </div>
          </Link>

          <Link to="/caregiver/compare" className="action-card">
            <CheckCircle2 size={24} className="icon-purple" />
            <div className="action-text">
              <h3>{t('verifyStripTitle', uiLang)}</h3>
              <p>{t('verifyStripSubtext', uiLang)}</p>
            </div>
          </Link>

          <Link to="/caregiver/medicine-cabinet" className="action-card">
            <Pill size={24} className="icon-orange" />
            <div className="action-text">
              <h3>{t('cabinet', uiLang)}</h3>
              <p>{t('cabinetSubtext', uiLang)}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Today's Schedule Checklist */}
      <div className="section">
        <div className="section-header">
          <h2>{t('todaysSchedule', uiLang)}</h2>
          <Link to="/caregiver/medicine-cabinet" className="link-more">{t('viewCabinet', uiLang)} <ArrowRight size={14} /></Link>
        </div>

        <div className="schedule-list">
          {medicines.map((med) => {
            const isTaken = dosesTaken[med.id]
            return (
              <div key={med.id} className={`schedule-item ${isTaken ? 'completed' : ''}`}>
                <div className="item-left">
                  <button
                    className={`chk-btn ${isTaken ? 'checked' : ''}`}
                    onClick={() => handleTakeDose(med.id)}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <div>
                    <h4 className="med-title">{med.name}</h4>
                    <span className="med-time">{med.dose} • {med.times.join(', ')}</span>
                  </div>
                </div>
                <span className="stock-tag">Stock: {med.stock}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Embedded CarePilot Voice AI Assistant */}
      <div className="section">
        <h2>{t('carepilotAiAssistant', uiLang)}</h2>
        <div className="ai-assistant-card">
          <div className="chat-body">
            {chatMessages.length === 0 ? (
              <div className="ai-empty-prompt">
                <Volume2 size={32} style={{ color: 'var(--accent)' }} />
                <p>{t('askAiPrompt', uiLang)}</p>
              </div>
            ) : (
              <div className="chat-msg-list">
                {chatMessages.map((m) => (
                  <div key={m.id} className={`chat-bubble ${m.role}`}>
                    <p>{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chat-input-bar">
            <button
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={handleToggleVoice}
              title={t('voice', uiLang)}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              placeholder={isListening ? t('micListening', uiLang) : t('askCarePilot', uiLang)}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            />

            <button className="send-btn" onClick={() => handleSendQuery()} disabled={aiLoading}>
              <span>{aiLoading ? t('thinking', uiLang) : t('sendMessage', uiLang)}</span>
            </button>
          </div>
        </div>
      </div>

      <Disclaimer />

      <style>{`
        .cg-dash-root { padding:24px 20px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:24px; }
        .cg-header { display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap; }
        .cg-welcome h1 { font-size:1.5rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em; }
        .cg-welcome p { font-size:0.85rem;color:var(--text-muted); }
        .patient-selector { display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--surface-secondary);border:1px solid var(--border);border-radius:12px; }
        .patient-selector select { border:none;background:transparent;outline:none;font-family:inherit;font-size:0.88rem;font-weight:700;color:var(--text-primary); }
        .kpi-grid { display:grid;grid-template-columns:repeat(3, 1fr);gap:14px; }
        .kpi-card { background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;display:flex;align-items:center;gap:14px;box-shadow:0 4px 16px rgba(0,0,0,0.04); }
        .kpi-icon { width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center; }
        .kpi-icon.blue { background:rgba(14,165,233,0.12);color:var(--accent); }
        .kpi-icon.green { background:rgba(45,212,191,0.12);color:#0d9488; }
        .kpi-icon.orange { background:rgba(245,158,11,0.12);color:var(--warning); }
        .kpi-info { display:flex;flex-direction:column; }
        .kpi-val { font-size:1.3rem;font-weight:800;color:var(--text-primary); }
        .kpi-lbl { font-size:0.75rem;color:var(--text-muted); }
        .cg-alert-banner { display:flex;align-items:center;gap:14px;padding:18px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:16px;color:var(--danger); }
        .cg-alert-banner h3 { font-size:1.05rem;font-weight:800; }
        .cg-alert-banner p { font-size:0.82rem;margin-top:2px; }
        .alert-btn { margin-left:auto;padding:8px 14px;background:var(--danger);color:#fff;border-radius:10px;font-size:0.8rem;font-weight:700;text-decoration:none;white-space:nowrap; }
        .cg-clear-banner { display:flex;align-items:center;gap:14px;padding:16px 18px;background:rgba(45,212,191,0.1);border:1px solid rgba(45,212,191,0.25);border-radius:16px;color:#0d9488; }
        .cg-clear-banner h3 { font-size:1rem;font-weight:800; }
        .cg-clear-banner p { font-size:0.8rem; }
        .section { display:flex;flex-direction:column;gap:12px; }
        .section h2 { font-size:1.1rem;font-weight:800;color:var(--text-primary); }
        .section-header { display:flex;align-items:center;justify-content:space-between; }
        .link-more { display:flex;align-items:center;gap:4px;font-size:0.8rem;font-weight:600;color:var(--accent);text-decoration:none; }
        .action-grid { display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:14px; }
        .action-card { background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;display:flex;align-items:center;gap:14px;text-decoration:none;transition:transform 0.15s,border-color 0.15s; }
        .action-card:hover { transform:translateY(-2px);border-color:var(--accent); }
        .icon-teal { color:#0d9488; }
        .icon-blue { color:var(--accent); }
        .icon-purple { color:#8b5cf6; }
        .icon-orange { color:var(--warning); }
        .action-text h3 { font-size:0.92rem;font-weight:700;color:var(--text-primary); }
        .action-text p { font-size:0.75rem;color:var(--text-muted); }
        .schedule-list { display:flex;flex-direction:column;gap:10px; }
        .schedule-item { display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--surface);border:1px solid var(--border);border-radius:14px; }
        .schedule-item.completed { opacity:0.6; }
        .item-left { display:flex;align-items:center;gap:12px; }
        .chk-btn { background:none;border:none;color:var(--text-muted);cursor:pointer; }
        .chk-btn.checked { color:#0d9488; }
        .med-title { font-size:0.92rem;font-weight:700;color:var(--text-primary); }
        .med-time { font-size:0.78rem;color:var(--text-muted); }
        .stock-tag { font-size:0.75rem;font-weight:600;color:var(--text-secondary);background:var(--surface-secondary);padding:4px 8px;border-radius:6px; }
        .ai-assistant-card { background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:14px;box-shadow:0 4px 16px rgba(0,0,0,0.04); }
        .chat-body { min-height:120px;max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:8px; }
        .ai-empty-prompt { text-align:center;padding:24px;display:flex;flex-direction:column;align-items:center;gap:8px;font-size:0.85rem;color:var(--text-secondary); }
        .chat-bubble { padding:10px 14px;border-radius:12px;max-width:85%;font-size:0.85rem;line-height:1.4; }
        .chat-bubble.user { background:var(--accent);color:#fff;align-self:flex-end; }
        .chat-bubble.assistant { background:var(--surface-secondary);color:var(--text-primary);align-self:flex-start;border:1px solid var(--border); }
        .chat-input-bar { display:flex;align-items:center;gap:8px;background:var(--surface-secondary);padding:6px;border-radius:12px;border:1px solid var(--border); }
        .mic-btn { width:38px;height:38px;border-radius:10px;border:none;background:var(--surface);color:var(--text-secondary);display:flex;align-items:center;justify-content:center;cursor:pointer; }
        .mic-btn.listening { background:var(--danger);color:#fff;animation:pulse 1.2s infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.08)} }
        .chat-input-bar input { flex:1;border:none;background:transparent;outline:none;font-family:inherit;font-size:0.85rem;color:var(--text-primary); }
        .send-btn { padding:8px 16px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:0.82rem;font-weight:700;cursor:pointer; }
        @media (max-width:640px) { .kpi-grid { grid-template-columns:1fr; } }
      `}</style>
    </div>
  )
}
