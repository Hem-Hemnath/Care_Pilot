import { useState, useEffect } from 'react'
import { Camera, CheckCircle2, AlertTriangle, HelpCircle, Loader, ArrowRight, ShieldAlert } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { getPatientMedicines } from '../services/cabinetService'
import { compareStripWithPrescription } from '../services/comparatorService'
import { compressImage, fileToBase64 } from '../utils/imageUtils'
import { CameraCapture } from '../components/CameraCapture'
import type { CaptureResult } from '../camera/cameraService'
import type { CabinetMedicine, StripComparisonResult } from '../types'

export function StripComparatorPage() {
  const { activePatient } = useAuth()
  const { uiLang } = useApp()

  const [medicines, setMedicines] = useState<CabinetMedicine[]>([])
  const [selectedMed, setSelectedMed] = useState<CabinetMedicine | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StripComparisonResult | null>(null)

  useEffect(() => {
    if (activePatient) {
      const list = getPatientMedicines(activePatient.id)
      setMedicines(list)
      if (list.length > 0) setSelectedMed(list[0])
    }
  }, [activePatient])

  const handleCameraCapture = (res: CaptureResult) => {
    setShowCamera(false)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(res.file)
    setPreviewUrl(res.previewUrl)
    setResult(null)
  }

  const handleFileSelect = (file: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
  }

  const handleCompare = async () => {
    if (!imageFile || !selectedMed) return
    setLoading(true)
    try {
      const compressed = await compressImage(imageFile)
      const base64 = await fileToBase64(compressed)
      const compRes = await compareStripWithPrescription(base64, selectedMed.name, selectedMed.strength)
      setResult(compRes)
    } catch (err) {
      setResult({
        status: 'UNKNOWN',
        prescriptionMedicine: selectedMed.name,
        prescriptionStrength: selectedMed.strength,
        detectedMedicine: 'Error',
        detectedStrength: 'Error',
        nameMatch: false,
        strengthMatch: false,
        message: String(err),
        confidence: 'low',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="comp-root">
      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      <div className="comp-header">
        <h1 className="comp-title">{t('comparator', uiLang)}</h1>
        <p className="comp-subtitle">
          Verify physical medicine strip packaging against expected prescription details before administering.
        </p>
      </div>

      {/* Step 1: Select Prescription Medicine */}
      <div className="comp-step-card">
        <div className="step-badge">STEP 1</div>
        <h3>Select Prescribed Medicine</h3>

        {medicines.length === 0 ? (
          <p className="empty-text">No active medicines in cabinet. Add medicines to cabinet first.</p>
        ) : (
          <div className="med-select-grid">
            {medicines.map((m) => (
              <button
                key={m.id}
                className={`med-chip ${selectedMed?.id === m.id ? 'active' : ''}`}
                onClick={() => { setSelectedMed(m); setResult(null) }}
              >
                <span className="chip-name">{m.name}</span>
                <span className="chip-str">{m.strength}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Scan Physical Strip */}
      {selectedMed && (
        <div className="comp-step-card">
          <div className="step-badge">STEP 2</div>
          <h3>Scan Actual Physical Strip / Packaging</h3>

          {!previewUrl ? (
            <div className="strip-capture-box">
              <p>Take a clear photo of the medicine strip blister foil or box label.</p>
              <div className="btn-row">
                <button className="comp-btn primary" onClick={() => setShowCamera(true)}>
                  <Camera size={18} />
                  <span>Take Strip Photo</span>
                </button>
                <label className="comp-btn secondary">
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFileSelect(f)
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="strip-preview-box">
              <img src={previewUrl} alt="Strip preview" className="strip-img" />
              <div className="btn-row">
                <button className="comp-btn secondary" onClick={() => { setPreviewUrl(null); setImageFile(null); setResult(null) }}>
                  Retake Photo
                </button>
                <button className="comp-btn primary" onClick={handleCompare} disabled={loading}>
                  {loading ? <Loader size={18} className="spin" /> : <ArrowRight size={18} />}
                  <span>Run Verification</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Result Display */}
      {result && (
        <div className={`comp-result-card ${result.status}`}>
          <div className="result-header">
            {result.status === 'MATCH' ? (
              <CheckCircle2 size={36} className="match-icon" />
            ) : result.status === 'MISMATCH' ? (
              <AlertTriangle size={36} className="mismatch-icon" />
            ) : (
              <HelpCircle size={36} className="unknown-icon" />
            )}

            <div>
              <h2>
                {result.status === 'MATCH'
                  ? '✅ Medicine Verified Match'
                  : result.status === 'MISMATCH'
                  ? '⚠️ Verification Warning'
                  : 'ℹ️ Unclear Strip Info'}
              </h2>
              <p className="result-msg">{result.message}</p>
            </div>
          </div>

          <div className="comparison-table">
            <div className="comp-col">
              <h4>Prescription Expected</h4>
              <div className="detail-item">
                <span className="label">Name:</span>
                <span className="val">{result.prescriptionMedicine}</span>
              </div>
              <div className="detail-item">
                <span className="label">Strength:</span>
                <span className="val">{result.prescriptionStrength || 'Not specified'}</span>
              </div>
            </div>

            <div className="comp-col">
              <h4>Detected on Strip Photo</h4>
              <div className="detail-item">
                <span className="label">Name:</span>
                <span className={`val ${result.nameMatch ? 'pass' : 'fail'}`}>
                  {result.detectedMedicine} {result.nameMatch ? '✓' : '✗'}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Strength:</span>
                <span className={`val ${result.strengthMatch ? 'pass' : 'fail'}`}>
                  {result.detectedStrength} {result.strengthMatch ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          {result.status === 'MISMATCH' && (
            <div className="mismatch-safety-note">
              <ShieldAlert size={18} />
              <span>
                Please verify this medicine strip with a doctor or pharmacist before administering to the patient.
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        .comp-root { padding:24px 20px;max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:20px; }
        .comp-header { display:flex;flex-direction:column;gap:4px; }
        .comp-title { font-size:1.5rem;font-weight:800;color:var(--text-primary); }
        .comp-subtitle { font-size:0.85rem;color:var(--text-muted); }
        .comp-step-card { background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:14px;box-shadow:0 4px 16px rgba(0,0,0,0.04); }
        .step-badge { font-size:0.68rem;font-weight:800;color:var(--accent);background:rgba(14,165,233,0.12);padding:3px 8px;border-radius:6px;align-self:flex-start; }
        .comp-step-card h3 { font-size:1.05rem;font-weight:700;color:var(--text-primary); }
        .empty-text { font-size:0.85rem;color:var(--text-muted); }
        .med-select-grid { display:flex;gap:10px;flex-wrap:wrap; }
        .med-chip { display:flex;flex-direction:column;align-items:flex-start;padding:10px 14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-secondary);cursor:pointer;transition:all 0.15s;font-family:inherit; }
        .med-chip.active { background:rgba(14,165,233,0.12);border-color:var(--accent); }
        .chip-name { font-size:0.88rem;font-weight:700;color:var(--text-primary); }
        .chip-str { font-size:0.75rem;color:var(--accent);font-weight:600; }
        .strip-capture-box { border:2px dashed var(--border);border-radius:14px;padding:32px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px; }
        .btn-row { display:flex;gap:12px; }
        .comp-btn { display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;font-family:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;border:none;transition:all 0.15s; }
        .comp-btn.primary { background:var(--accent);color:#fff; }
        .comp-btn.secondary { background:var(--surface-secondary);border:1px solid var(--border);color:var(--text-primary); }
        .strip-preview-box { display:flex;flex-direction:column;align-items:center;gap:14px; }
        .strip-img { width:100%;max-height:280px;object-fit:contain;border-radius:12px;border:1px solid var(--border);background:var(--surface-secondary); }
        .comp-result-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:18px;box-shadow:0 8px 32px rgba(0,0,0,0.08); }
        .comp-result-card.MATCH { border-color:rgba(45,212,191,0.4);background:rgba(45,212,191,0.04); }
        .comp-result-card.MISMATCH { border-color:rgba(239,68,68,0.4);background:rgba(239,68,68,0.04); }
        .result-header { display:flex;align-items:flex-start;gap:14px; }
        .match-icon { color:#0d9488; }
        .mismatch-icon { color:var(--danger); }
        .unknown-icon { color:var(--warning); }
        .result-header h2 { font-size:1.2rem;font-weight:800;color:var(--text-primary); }
        .result-msg { font-size:0.88rem;color:var(--text-secondary);margin-top:2px; }
        .comparison-table { display:grid;grid-template-columns:1fr 1fr;gap:16px;background:var(--surface-secondary);padding:16px;border-radius:14px;border:1px solid var(--border); }
        .comp-col h4 { font-size:0.82rem;font-weight:700;color:var(--text-muted);margin-bottom:8px; }
        .detail-item { font-size:0.85rem;display:flex;gap:6px;margin-bottom:4px; }
        .detail-item .label { color:var(--text-muted);font-weight:600; }
        .detail-item .val { font-weight:700;color:var(--text-primary); }
        .detail-item .val.pass { color:#0d9488; }
        .detail-item .val.fail { color:var(--danger); }
        .mismatch-safety-note { display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(239,68,68,0.1);border-radius:10px;color:var(--danger);font-size:0.82rem;font-weight:600; }
        .spin { animation:spSpin 1s linear infinite; }
      `}</style>
    </div>
  )
}
