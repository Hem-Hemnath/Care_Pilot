import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, ArrowRight, Activity, Heart, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../hooks/useApp'
import { addPatientRecord } from '../services/patientService'
import { getPatientMedicines } from '../services/cabinetService'

export function PatientsPage() {
  const { user, patients, activePatient, setActivePatient, refreshPatients } = useAuth()
  const { uiLang } = useApp()
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [conditionsText, setConditionsText] = useState('')

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user) return

    const conditions = conditionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const created = addPatientRecord({
      name: name.trim(),
      age: Number(age) || 60,
      conditions,
      caregiverIds: [user.id],
    })

    refreshPatients()
    setActivePatient(created.id)
    setShowModal(false)
    setName('')
    setAge('')
    setConditionsText('')
  }

  const handleSelectPatient = (patientId: string) => {
    setActivePatient(patientId)
    navigate('/caregiver/dashboard')
  }

  return (
    <div className="patients-root">
      <div className="patients-header">
        <div>
          <h1 className="patients-title">Managed Patients</h1>
          <p className="patients-sub">
            Caregiver Network for {user?.name || 'Caregiver'} — select a patient profile to manage medicines, prescriptions & safety.
          </p>
        </div>
        <button className="add-patient-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Patient Cards Grid */}
      <div className="patient-grid">
        {patients.map((patient) => {
          const medCount = getPatientMedicines(patient.id).length
          const isActive = activePatient?.id === patient.id

          return (
            <div key={patient.id} className={`patient-card ${isActive ? 'active' : ''}`}>
              <div className="patient-card-top">
                <div className="avatar">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="patient-name">{patient.name}</h3>
                  <span className="patient-age">{patient.age} years old</span>
                </div>
                {isActive && <span className="active-badge">Active Profile</span>}
              </div>

              <div className="patient-card-body">
                <div className="condition-tags">
                  {patient.conditions.map((cond, idx) => (
                    <span key={idx} className="cond-tag">
                      <Activity size={12} /> {cond}
                    </span>
                  ))}
                </div>

                <div className="stat-row">
                  <div className="stat-pill">
                    <span className="val">{medCount}</span>
                    <span className="lbl">Active Medicines</span>
                  </div>
                  <div className="stat-pill">
                    <span className="val"><ShieldCheck size={14} className="icon-green" /> Safe</span>
                    <span className="lbl">Safety Status</span>
                  </div>
                </div>
              </div>

              <div className="patient-card-footer">
                <button className="select-btn" onClick={() => handleSelectPatient(patient.id)}>
                  <span>{isActive ? 'Currently Managing' : 'Switch to this Patient'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Patient Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Add New Patient Profile</h3>
            <p className="modal-sub">Add a family member or patient under your caregiver management.</p>

            <form onSubmit={handleAddPatient} className="modal-form">
              <div className="field-group input-3d-wrapper">
                <label>Patient Full Name *</label>
                <input
                  type="text"
                  className="input-3d"
                  placeholder="e.g. Ramanan (Father)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field-group input-3d-wrapper">
                <label>Age (years)</label>
                <input
                  type="number"
                  className="input-3d"
                  placeholder="e.g. 72"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              <div className="field-group input-3d-wrapper">
                <label>Medical Conditions (comma-separated)</label>
                <input
                  type="text"
                  className="input-3d"
                  placeholder="e.g. Diabetes, Hypertension, Thyroid"
                  value={conditionsText}
                  onChange={(e) => setConditionsText(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .patients-root { padding:24px 20px;max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:24px; }
        .patients-header { display:flex;align-items:center;justify-content:space-between;gap:16px; }
        .patients-title { font-size:1.5rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em; }
        .patients-sub { font-size:0.85rem;color:var(--text-muted); }
        .add-patient-btn { display:flex;align-items:center;gap:8px;padding:10px 18px;background:var(--accent);color:#fff;border:none;border-radius:12px;font-family:inherit;font-size:0.88rem;font-weight:600;cursor:pointer; }
        .patient-grid { display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:18px; }
        .patient-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:16px;box-shadow:0 6px 20px rgba(0,0,0,0.04);transition:all 0.15s; }
        .patient-card.active { border-color:var(--accent);box-shadow:0 8px 28px rgba(14,165,233,0.18); }
        .patient-card-top { display:flex;align-items:center;gap:12px; }
        .avatar { width:42px;height:42px;border-radius:12px;background:rgba(14,165,233,0.12);color:var(--accent);display:flex;align-items:center;justify-content:center; }
        .patient-name { font-size:1.05rem;font-weight:800;color:var(--text-primary); }
        .patient-age { font-size:0.78rem;color:var(--text-muted); }
        .active-badge { margin-left:auto;font-size:0.7rem;font-weight:700;color:#0d9488;background:rgba(45,212,191,0.15);padding:3px 8px;border-radius:8px; }
        .patient-card-body { display:flex;flex-direction:column;gap:12px; }
        .condition-tags { display:flex;gap:6px;flex-wrap:wrap; }
        .cond-tag { display:inline-flex;align-items:center;gap:4px;font-size:0.72rem;font-weight:600;color:var(--text-secondary);background:var(--surface-secondary);padding:4px 8px;border-radius:8px; }
        .stat-row { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
        .stat-pill { background:var(--surface-secondary);padding:8px 12px;border-radius:10px;display:flex;flex-direction:column;align-items:center; }
        .stat-pill .val { font-size:0.95rem;font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:4px; }
        .stat-pill .lbl { font-size:0.7rem;color:var(--text-muted); }
        .icon-green { color:#0d9488; }
        .patient-card-footer { padding-top:10px;border-top:1px solid var(--border); }
        .select-btn { width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;background:var(--accent);color:#fff;border:none;border-radius:12px;font-family:inherit;font-size:0.85rem;font-weight:700;cursor:pointer; }
        .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:100;backdrop-filter:blur(3px); }
        .modal-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;width:100%;max-width:440px;display:flex;flex-direction:column;gap:14px;box-shadow:0 12px 36px rgba(0,0,0,0.2); }
        .modal-sub { font-size:0.82rem;color:var(--text-muted); }
        .modal-form { display:flex;flex-direction:column;gap:12px; }
        .field-group { display:flex;flex-direction:column;gap:5px; }
        .field-group label { font-size:0.78rem;font-weight:600;color:var(--text-secondary); }
        .field-group input { padding:10px 12px;background:var(--input-background);border:1px solid var(--input-border);border-radius:10px;font-family:inherit;font-size:0.88rem;color:var(--text-primary);outline:none; }
        .modal-actions { display:flex;justify-content:flex-end;gap:10px;margin-top:8px; }
        .btn-cancel { padding:10px 16px;background:var(--surface-secondary);border:1px solid var(--border);border-radius:10px;font-family:inherit;font-size:0.85rem;font-weight:600;color:var(--text-secondary);cursor:pointer; }
        .btn-save { padding:10px 20px;background:var(--accent);border:none;border-radius:10px;font-family:inherit;font-size:0.85rem;font-weight:600;color:#fff;cursor:pointer; }
      `}</style>
    </div>
  )
}
