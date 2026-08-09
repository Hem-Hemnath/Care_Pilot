import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Pill, Calendar, Clock, AlertTriangle, Trash2, Edit3, CheckCircle2, Camera, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import {
  getPatientMedicines,
  addMedicineToCabinet,
  updateCabinetMedicine,
  removeCabinetMedicine,
  logDoseTaken,
} from '../services/cabinetService'
import type { CabinetMedicine } from '../types'
import { CameraCapture } from '../components/CameraCapture'
import { identifyMedicineFromImage } from '../ai/geminiService'

export function CabinetPage() {
  const { activePatient, role } = useAuth()
  const { uiLang } = useApp()

  const [medicines, setMedicines] = useState<CabinetMedicine[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState<'all' | 'verified' | 'low_stock' | 'expiring'>('all')

  // Add/Edit Modal state
  const [showModal, setShowModal] = useState(false)
  const [inputMode, setInputMode] = useState<'manual' | 'camera'>('manual')
  const [showCamera, setShowCamera] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [editingMed, setEditingMed] = useState<CabinetMedicine | null>(null)

  const [name, setName] = useState('')
  const [strength, setStrength] = useState('')
  const [dose, setDose] = useState('1 Tablet')
  const [frequency, setFrequency] = useState('Once Daily')
  const [timesText, setTimesText] = useState('08:00 AM')
  const [stock, setStock] = useState(30)
  const [expiresOn, setExpiresOn] = useState('')
  const [notes, setNotes] = useState('')

  const loadMedicines = useCallback(() => {
    if (!activePatient) return
    const list = getPatientMedicines(activePatient.id)
    setMedicines(list)
  }, [activePatient])

  useEffect(() => {
    loadMedicines()
  }, [loadMedicines])

  const handleOpenAddModal = () => {
    setEditingMed(null)
    setInputMode('manual')
    setName('')
    setStrength('')
    setDose('1 Tablet')
    setFrequency('Once Daily')
    setTimesText('08:00 AM')
    setStock(30)
    setExpiresOn('')
    setNotes('')
    setShowModal(true)
  }

  const handleOpenEditModal = (med: CabinetMedicine) => {
    setEditingMed(med)
    setInputMode('manual')
    setName(med.name)
    setStrength(med.strength)
    setDose(med.dose)
    setFrequency(med.frequency)
    setTimesText(med.times.join(', '))
    setStock(med.stock)
    setExpiresOn(med.expiresOn || '')
    setNotes(med.notes || '')
    setShowModal(true)
  }

  const handleCameraCapture = async (fileOrBase64: File | string) => {
    setShowCamera(false)
    setIsScanning(true)
    try {
      let base64Str = ''
      if (typeof fileOrBase64 === 'string') {
        base64Str = fileOrBase64
      } else {
        base64Str = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(fileOrBase64)
        })
      }

      const res = await identifyMedicineFromImage(base64Str)
      if (res.medicine) {
        setName(res.medicine.medicineName)
        setStrength(res.medicine.composition || '')
        if (res.medicine.uses) setNotes(`Uses: ${res.medicine.uses}`)
      }
    } catch (err) {
      console.error('Camera scan failed', err)
    } finally {
      setIsScanning(false)
      setInputMode('manual')
    }
  }

  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient || !name.trim()) return

    const parsedTimes = timesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (editingMed) {
      updateCabinetMedicine(activePatient.id, {
        ...editingMed,
        name: name.trim(),
        strength: strength.trim(),
        dose: dose.trim(),
        frequency: frequency.trim(),
        times: parsedTimes,
        stock,
        expiresOn,
        notes: notes.trim(),
      })
    } else {
      addMedicineToCabinet(activePatient.id, {
        name: name.trim(),
        generic: name.trim(),
        strength: strength.trim(),
        dose: dose.trim(),
        frequency: frequency.trim(),
        times: parsedTimes,
        imageUrl: '',
        expiresOn,
        stock,
        notes: notes.trim(),
        source: 'manual',
        verified: true,
      })
    }

    setShowModal(false)
    loadMedicines()
  }

  const handleDelete = (medId: string) => {
    if (!activePatient) return
    removeCabinetMedicine(activePatient.id, medId)
    loadMedicines()
  }

  const handleDoseTaken = (medId: string) => {
    if (!activePatient) return
    logDoseTaken(activePatient.id, medId)
    loadMedicines()
  }

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.strength.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false
    if (filterTag === 'verified') return m.verified
    if (filterTag === 'low_stock') return m.stock <= 5
    if (filterTag === 'expiring') return m.expiresOn && new Date(m.expiresOn) < new Date(Date.now() + 30 * 86400000)
    return true
  })

  return (
    <div className="cabinet-root">
      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      <div className="cabinet-header">
        <div>
          <h1 className="cabinet-title">{t('cabinet', uiLang)}</h1>
          <p className="cabinet-subtitle">
            {activePatient ? `Medication cabinet for ${activePatient.name}` : 'Patient medicine records'}
          </p>
        </div>
        <button className="cabinet-add-btn" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>+ Add Medicine</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="cabinet-toolbar">
        <div className="cabinet-search-wrapper">
          <div className="cabinet-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchPlaceholder', uiLang)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="cabinet-filter-tabs">
          <button
            className={`filter-chip ${filterTag === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTag('all')}
          >
            All ({medicines.length})
          </button>
          <button
            className={`filter-chip ${filterTag === 'verified' ? 'active' : ''}`}
            onClick={() => setFilterTag('verified')}
          >
            Verified
          </button>
          <button
            className={`filter-chip ${filterTag === 'low_stock' ? 'active' : ''}`}
            onClick={() => setFilterTag('low_stock')}
          >
            Low Stock
          </button>
        </div>
      </div>

      {/* Medicine Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="cabinet-empty">
          <Pill size={48} style={{ color: 'var(--text-muted)' }} />
          <h3>No medicines found</h3>
          <p>Add medicines manually or use the scanner to scan medicine strips & prescriptions.</p>
        </div>
      ) : (
        <div className="cabinet-grid">
          {filteredMedicines.map((med) => (
            <div key={med.id} className="cabinet-card">
              <div className="cabinet-card-header">
                <div>
                  <h3 className="med-name">{med.name}</h3>
                  <span className="med-strength">{med.strength}</span>
                </div>
                {med.verified && (
                  <span className="verified-badge" title="Verified dataset entry">
                    ✓ Verified
                  </span>
                )}
              </div>

              <div className="cabinet-card-body">
                <div className="info-row">
                  <Clock size={14} />
                  <span>
                    {med.dose} • {med.frequency} ({med.times.join(', ')})
                  </span>
                </div>

                {med.expiresOn && (
                  <div className="info-row">
                    <Calendar size={14} />
                    <span>Expires: {med.expiresOn}</span>
                  </div>
                )}

                <div className="info-row stock">
                  <Pill size={14} />
                  <span>
                    Stock: <strong>{med.stock} units</strong>
                  </span>
                  {med.stock <= 5 && (
                    <span className="stock-alert">
                      <AlertTriangle size={12} /> Low
                    </span>
                  )}
                </div>

                {med.notes && <p className="med-notes">"{med.notes}"</p>}
              </div>

              <div className="cabinet-card-footer">
                <button
                  className="take-dose-btn"
                  onClick={() => handleDoseTaken(med.id)}
                  disabled={med.stock <= 0}
                >
                  <CheckCircle2 size={15} />
                  <span>Take Dose</span>
                </button>

                <div className="caregiver-actions">
                  <button className="icon-action" onClick={() => handleOpenEditModal(med)} title="Edit">
                    <Edit3 size={15} />
                  </button>
                  <button className="icon-action danger" onClick={() => handleDelete(med.id)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card w-[90%] max-w-lg sm:w-[95%] sm:max-w-md lg:max-w-lg">
            <h3>{editingMed ? t('editMedicine', uiLang) : '+ Add Medicine'}</h3>

            {/* Input Mode Selector */}
            {!editingMed && (
              <div className="modal-mode-tabs">
                <button
                  type="button"
                  className={`mode-tab ${inputMode === 'manual' ? 'active' : ''}`}
                  onClick={() => setInputMode('manual')}
                >
                  Manual Details
                </button>
                <button
                  type="button"
                  className={`mode-tab camera-tab ${inputMode === 'camera' ? 'active' : ''}`}
                  onClick={() => {
                    setInputMode('camera')
                    setShowCamera(true)
                  }}
                >
                  <Camera size={14} />
                  <span>Camera Scanner</span>
                </button>
              </div>
            )}

            {isScanning && (
              <div className="modal-scanning-bar">
                <Loader2 size={16} className="spin-icon" />
                <span>Scanning medicine label via Vision AI...</span>
              </div>
            )}

            <form onSubmit={handleSaveMedicine} className="modal-form">
              {/* Medicine Name (Full Width) */}
              <div className="field-group input-3d-wrapper w-full">
                <label className="text-gray-300 font-semibold text-xs sm:text-sm mb-1.5 block">Medicine Name *</label>
                <input
                  type="text"
                  className="input-3d dark-input w-full p-3 rounded-xl bg-[#111827] border border-gray-700/80 text-gray-100 placeholder:text-gray-500 focus:outline-none"
                  placeholder="e.g. Paracip-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Dosage & Schedule (Responsive Grid Row: 2 cols on desktop, 1 col on mobile) */}
              <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="field-group input-3d-wrapper">
                  <label className="text-gray-300 font-semibold text-xs sm:text-sm mb-1.5 block">Dosage / Schedule *</label>
                  <input
                    type="text"
                    className="input-3d dark-input w-full p-3 rounded-xl bg-[#111827] border border-gray-700/80 text-gray-100 placeholder:text-gray-500 focus:outline-none"
                    placeholder="e.g. 1 Tablet"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    required
                  />
                </div>
                <div className="field-group input-3d-wrapper">
                  <label className="text-gray-300 font-semibold text-xs sm:text-sm mb-1.5 block">Schedule Times (comma separated)</label>
                  <input
                    type="text"
                    className="input-3d dark-input w-full p-3 rounded-xl bg-[#111827] border border-gray-700/80 text-gray-100 placeholder:text-gray-500 focus:outline-none"
                    placeholder="e.g. 08:00 AM, 08:00 PM"
                    value={timesText}
                    onChange={(e) => setTimesText(e.target.value)}
                  />
                </div>
              </div>

              {/* Frequency & Stock Count (Responsive Grid Row) */}
              <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="field-group input-3d-wrapper">
                  <label className="text-gray-300 font-semibold text-xs sm:text-sm mb-1.5 block">Frequency *</label>
                  <input
                    type="text"
                    className="input-3d dark-input w-full p-3 rounded-xl bg-[#111827] border border-gray-700/80 text-gray-100 placeholder:text-gray-500 focus:outline-none"
                    placeholder="e.g. Twice Daily"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    required
                  />
                </div>
                <div className="field-group input-3d-wrapper">
                  <label className="text-gray-300 font-semibold text-xs sm:text-sm mb-1.5 block">Stock Count *</label>
                  <input
                    type="number"
                    className="input-3d dark-input w-full p-3 rounded-xl bg-[#111827] border border-gray-700/80 text-gray-100 placeholder:text-gray-500 focus:outline-none"
                    placeholder="e.g. 30"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
              </div>

              {/* Strength & Expiration Date (Responsive Grid Row) */}
              <div className="form-row grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="field-group input-3d-wrapper">
                  <label className="text-gray-300 font-semibold text-xs sm:text-sm mb-1.5 block">Strength / Composition</label>
                  <input
                    type="text"
                    className="input-3d dark-input w-full p-3 rounded-xl bg-[#111827] border border-gray-700/80 text-gray-100 placeholder:text-gray-500 focus:outline-none"
                    placeholder="e.g. Paracetamol 500mg"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                  />
                </div>
                <div className="field-group input-3d-wrapper">
                  <label className="text-gray-300 font-semibold text-xs sm:text-sm mb-1.5 block">Expiration Date</label>
                  <input
                    type="date"
                    className="input-3d dark-input dark-date-picker w-full p-3 rounded-xl bg-[#111827] border border-gray-700/80 text-gray-100 focus:outline-none"
                    value={expiresOn}
                    onChange={(e) => setExpiresOn(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes / Instructions Textarea (Full Width) */}
              <div className="field-group input-3d-wrapper w-full">
                <label className="text-gray-300 font-semibold text-xs sm:text-sm mb-1.5 block">Notes / Instructions</label>
                <textarea
                  className="input-3d dark-input w-full p-3 rounded-xl bg-[#111827] border border-gray-700/80 text-gray-100 placeholder:text-gray-500 focus:outline-none"
                  placeholder="e.g. Take after meals, with a full glass of water"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .cabinet-root { padding:24px 20px;max-width:1000px;margin:0 auto;display:flex;flex-direction:column;gap:20px; }
        .cabinet-header { display:flex;align-items:center;justify-content:space-between;gap:16px; }
        .cabinet-title { font-size:1.5rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em; }
        .cabinet-subtitle { font-size:0.85rem;color:var(--text-muted); }
        .cabinet-add-btn { display:flex;align-items:center;gap:8px;padding:10px 18px;background:var(--accent);color:#fff;border:none;border-radius:12px;font-family:inherit;font-size:0.88rem;font-weight:600;cursor:pointer;transition:background 0.15s; }
        .cabinet-add-btn:hover { background:var(--accent-hover); }
        .cabinet-toolbar { display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap; }
        .cabinet-search-wrapper {
          perspective: 1200px;
          transform-style: preserve-3d;
          flex: 1;
          min-width: 240px;
          max-width: 480px;
        }
        .cabinet-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--input-background);
          border: 1.5px solid var(--input-border);
          border-radius: 14px;
          transform-style: preserve-3d;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .cabinet-search-box:hover {
          transform: translateZ(10px) rotateX(1deg);
          border-color: rgba(20, 184, 166, 0.4);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        .cabinet-search-box:focus-within {
          transform: translateZ(20px) scale(1.01) rotateX(0deg);
          border-color: rgba(20, 184, 166, 1);
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.3), 0 12px 32px rgba(20, 184, 166, 0.18);
        }
        .search-icon { color: var(--text-muted); transition: color 0.3s ease; }
        .cabinet-search-box:focus-within .search-icon { color: var(--accent); }
        .cabinet-search-box input { border:none;background:transparent;outline:none;font-family:inherit;font-size:0.88rem;color:var(--text-primary);width:100%; }
        @media (max-width: 639px) {
          .cabinet-search-wrapper { max-width: 100%; width: 100%; }
          .cabinet-search-box { padding: 8px 12px; }
        }
        .cabinet-filter-tabs { display:flex;gap:6px; }
        .filter-chip { padding:7px 14px;border-radius:20px;border:1px solid var(--border);background:var(--surface);font-family:inherit;font-size:0.78rem;font-weight:600;color:var(--text-secondary);cursor:pointer;transition:all 0.15s; }
        .filter-chip.active { background:var(--accent);color:#fff;border-color:var(--accent); }
        .cabinet-empty { text-align:center;padding:60px 20px;background:var(--surface);border:1px solid var(--border);border-radius:16px;display:flex;flex-direction:column;align-items:center;gap:12px; }
        .cabinet-grid { display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px; }
        .cabinet-card { background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;gap:14px;box-shadow:0 4px 16px rgba(0,0,0,0.04); }
        .cabinet-card-header { display:flex;align-items:flex-start;justify-content:space-between;gap:10px; }
        .med-name { font-size:1.05rem;font-weight:700;color:var(--text-primary); }
        .med-strength { font-size:0.8rem;color:var(--accent);font-weight:600; }
        .verified-badge { font-size:0.7rem;font-weight:700;color:#0d9488;background:rgba(45,212,191,0.15);padding:3px 8px;border-radius:12px; }
        .cabinet-card-body { display:flex;flex-direction:column;gap:8px;font-size:0.82rem;color:var(--text-secondary); }
        .info-row { display:flex;align-items:center;gap:8px; }
        .info-row.stock { margin-top:2px; }
        .stock-alert { display:inline-flex;align-items:center;gap:3px;font-size:0.7rem;font-weight:700;color:var(--danger);background:rgba(239,68,68,0.12);padding:2px 6px;border-radius:6px;margin-left:8px; }
        .med-notes { font-style:italic;font-size:0.78rem;color:var(--text-muted);background:var(--surface-secondary);padding:6px 10px;border-radius:8px; }
        .cabinet-card-footer { display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border); }
        .take-dose-btn { display:flex;align-items:center;gap:6px;padding:7px 14px;background:rgba(14,165,233,0.1);color:var(--accent);border:1px solid rgba(14,165,233,0.25);border-radius:10px;font-family:inherit;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.15s; }
        .take-dose-btn:hover:not(:disabled) { background:var(--accent);color:#fff; }
        .take-dose-btn:disabled { opacity:0.5;cursor:not-allowed; }
        .caregiver-actions { display:flex;gap:6px; }
        .icon-action { padding:6px;background:var(--surface-secondary);border:1px solid var(--border);border-radius:8px;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;justify-content:center; }
        .icon-action:hover { color:var(--accent);border-color:var(--accent); }
        .icon-action.danger:hover { color:var(--danger);border-color:var(--danger); }
        .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:100;backdrop-filter:blur(3px); }
        .modal-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;width:90%;max-width:540px;display:flex;flex-direction:column;gap:16px;box-shadow:0 12px 36px rgba(0,0,0,0.25);perspective:1200px;transform-style:preserve-3d; }
        .modal-form { display:flex;flex-direction:column;gap:14px;perspective:1200px;transform-style:preserve-3d; }
        .dark-input,
        .modal-form input,
        .modal-form textarea,
        .modal-form select {
          background-color: #111827 !important;
          border-color: rgba(55, 65, 81, 0.8) !important;
          color: #f3f4f6 !important;
        }
        .dark-input::placeholder,
        .modal-form input::placeholder,
        .modal-form textarea::placeholder {
          color: #6b7280 !important;
        }
        .dark-date-picker,
        .modal-form input[type="date"] {
          color-scheme: dark !important;
        }
        .form-row { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
        @media (max-width: 639px) {
          .modal-overlay { padding: 12px; }
          .modal-card { width: 95%; padding: 16px; max-width: 100%; }
          .form-row { grid-template-columns: 1fr; gap: 10px; }
        }
        .modal-actions { display:flex;justify-content:flex-end;gap:10px;margin-top:8px; }
        .btn-cancel { padding:10px 18px;background:var(--surface-secondary);border:1px solid var(--border);border-radius:10px;font-family:inherit;font-size:0.85rem;font-weight:600;color:var(--text-secondary);cursor:pointer; }
        .btn-save { padding:10px 20px;background:var(--accent);border:none;border-radius:10px;font-family:inherit;font-size:0.85rem;font-weight:600;color:#fff;cursor:pointer; }
        .modal-mode-tabs { display:flex;gap:8px;background:var(--surface-secondary);padding:4px;border-radius:12px;border:1px solid var(--border); }
        .mode-tab { flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;border:none;border-radius:8px;background:transparent;font-family:inherit;font-size:0.8rem;font-weight:600;color:var(--text-secondary);cursor:pointer;transition:all 0.15s; }
        .mode-tab.active { background:var(--surface);color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .mode-tab.camera-tab:hover { color:var(--accent); }
        .modal-scanning-bar { display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.25);border-radius:10px;color:var(--accent);font-size:0.8rem;font-weight:600; }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
