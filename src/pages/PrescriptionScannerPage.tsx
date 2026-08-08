import { useState } from 'react'
import { FileText, Camera, Upload, CheckCircle2, AlertCircle, Loader, ArrowRight, Edit2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { scanPrescriptionImage } from '../services/prescriptionService'
import { addMedicineToCabinet } from '../services/cabinetService'
import { compressImage, fileToBase64 } from '../utils/imageUtils'
import { CameraCapture } from '../components/CameraCapture'
import type { CaptureResult } from '../camera/cameraService'
import type { ExtractedPrescriptionMedicine } from '../types'

export function PrescriptionScannerPage() {
  const { activePatient } = useAuth()
  const { uiLang } = useApp()

  const [showCamera, setShowCamera] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedList, setExtractedList] = useState<ExtractedPrescriptionMedicine[]>([])
  const [confirmed, setConfirmed] = useState(false)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setExtractedList([])
    setError(null)
    setConfirmed(false)
  }

  const handleCameraCapture = (res: CaptureResult) => {
    setShowCamera(false)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(res.file)
    setPreviewUrl(res.previewUrl)
    setExtractedList([])
    setError(null)
    setConfirmed(false)
  }

  const handleScan = async () => {
    if (!imageFile) return
    setLoading(true)
    setError(null)
    try {
      const compressed = await compressImage(imageFile)
      const base64 = await fileToBase64(compressed)
      const res = await scanPrescriptionImage(base64)

      if (res.error) {
        setError(res.error)
      } else if (res.medicines.length === 0) {
        setError('Could not read any medicine details from this prescription. Please try a clearer photo.')
      } else {
        setExtractedList(res.medicines)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateExtractedItem = (index: number, field: keyof ExtractedPrescriptionMedicine, val: string) => {
    setExtractedList((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  const handleConfirmAddToCabinet = () => {
    if (!activePatient || extractedList.length === 0) return

    extractedList.forEach((item) => {
      addMedicineToCabinet(activePatient.id, {
        name: item.name,
        generic: item.name,
        strength: item.strength,
        dose: item.dose,
        frequency: item.frequency,
        times: item.timing.length > 0 ? item.timing : ['08:00 AM'],
        imageUrl: previewUrl || '',
        stock: 30,
        notes: `Extracted from prescription for ${item.duration || 'prescribed duration'}`,
        source: 'prescription',
        verified: true,
      })
    })

    setConfirmed(true)
  }

  return (
    <div className="presc-root">
      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      <div className="presc-header">
        <h1 className="presc-title">{t('prescriptions', uiLang)}</h1>
        <p className="presc-subtitle">
          Upload a prescription photo to extract medicine details with Gemini AI Vision & review before adding to cabinet.
        </p>
      </div>

      {error && (
        <div className="presc-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {confirmed && (
        <div className="presc-success-banner">
          <CheckCircle2 size={24} />
          <div>
            <h3>Medicines Added to Cabinet!</h3>
            <p>{extractedList.length} prescribed medicine(s) successfully added to {activePatient?.name}'s cabinet.</p>
          </div>
        </div>
      )}

      {/* Input Selection Box */}
      {!previewUrl && !loading && extractedList.length === 0 && (
        <div className="presc-upload-box">
          <FileText size={48} style={{ color: 'var(--accent)' }} />
          <h3>Select Prescription Photo</h3>
          <p>Take a clear photo of the written or printed doctor prescription.</p>

          <div className="presc-btn-row">
            <button className="presc-btn primary" onClick={() => setShowCamera(true)}>
              <Camera size={18} />
              <span>Use Camera</span>
            </button>

            <label className="presc-btn secondary">
              <Upload size={18} />
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
      )}

      {/* Preview & Scan Button */}
      {previewUrl && extractedList.length === 0 && !loading && (
        <div className="presc-preview-card">
          <img src={previewUrl} alt="Prescription preview" className="presc-img" />
          <div className="presc-actions">
            <button className="presc-btn secondary" onClick={() => { setPreviewUrl(null); setImageFile(null) }}>
              Change Image
            </button>
            <button className="presc-btn primary" onClick={handleScan}>
              <FileText size={18} />
              <span>Scan Prescription with AI</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="presc-loading-card">
          <Loader size={36} className="spin" />
          <h3>Analyzing Prescription Image...</h3>
          <p>Extracting medicine names, strengths, dosages, and daily timing with Gemini Vision AI.</p>
        </div>
      )}

      {/* Structured Extracted Results Review Table */}
      {extractedList.length > 0 && !confirmed && (
        <div className="presc-results-card">
          <div className="results-header">
            <h3>Review Extracted Medicines</h3>
            <p>Please review and adjust details if necessary before confirming.</p>
          </div>

          <div className="extracted-table">
            {extractedList.map((item, idx) => (
              <div key={idx} className="extracted-row">
                <div className="row-field name">
                  <label><Edit2 size={12} /> Medicine Name</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateExtractedItem(idx, 'name', e.target.value)}
                  />
                </div>
                <div className="row-field strength">
                  <label>Strength</label>
                  <input
                    type="text"
                    value={item.strength}
                    onChange={(e) => handleUpdateExtractedItem(idx, 'strength', e.target.value)}
                  />
                </div>
                <div className="row-field dose">
                  <label>Dose & Frequency</label>
                  <input
                    type="text"
                    value={`${item.dose} • ${item.frequency}`}
                    onChange={(e) => handleUpdateExtractedItem(idx, 'dose', e.target.value)}
                  />
                </div>
                <div className="confidence-chip">
                  Confidence: {Math.round((item.confidence || 0.85) * 100)}%
                </div>
              </div>
            ))}
          </div>

          <div className="results-footer">
            <button className="presc-btn secondary" onClick={() => { setExtractedList([]); setPreviewUrl(null) }}>
              Discard & Rescan
            </button>
            <button className="presc-btn primary" onClick={handleConfirmAddToCabinet}>
              <span>Confirm & Add to Cabinet ({extractedList.length})</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .presc-root { padding:24px 20px;max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:20px; }
        .presc-header { display:flex;flex-direction:column;gap:4px; }
        .presc-title { font-size:1.5rem;font-weight:800;color:var(--text-primary); }
        .presc-subtitle { font-size:0.85rem;color:var(--text-muted); }
        .presc-error-banner { display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:12px;color:var(--danger);font-size:0.85rem; }
        .presc-success-banner { display:flex;align-items:center;gap:14px;padding:18px;background:rgba(45,212,191,0.12);border:1px solid rgba(45,212,191,0.3);border-radius:16px;color:#0d9488; }
        .presc-success-banner h3 { font-size:1.05rem;font-weight:800; }
        .presc-success-banner p { font-size:0.85rem;margin-top:2px; }
        .presc-upload-box { background:var(--surface);border:2px dashed var(--border);border-radius:20px;padding:48px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px; }
        .presc-upload-box h3 { font-size:1.1rem;font-weight:700;color:var(--text-primary); }
        .presc-upload-box p { font-size:0.85rem;color:var(--text-muted);max-width:320px; }
        .presc-btn-row { display:flex;gap:12px;margin-top:8px; }
        .presc-btn { display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:12px;font-family:inherit;font-size:0.88rem;font-weight:600;cursor:pointer;transition:all 0.15s;border:none; }
        .presc-btn.primary { background:var(--accent);color:#fff; }
        .presc-btn.primary:hover { background:var(--accent-hover); }
        .presc-btn.secondary { background:var(--surface-secondary);border:1px solid var(--border);color:var(--text-primary); }
        .presc-preview-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:20px;display:flex;flex-direction:column;align-items:center;gap:16px; }
        .presc-img { width:100%;max-height:360px;object-fit:contain;border-radius:12px;border:1px solid var(--border);background:var(--surface-secondary); }
        .presc-actions { display:flex;gap:12px;width:100%;justify-content:flex-end; }
        .presc-loading-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:48px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px; }
        .spin { animation:spSpin 1s linear infinite;color:var(--accent); }
        .presc-results-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:20px;box-shadow:0 6px 24px rgba(0,0,0,0.06); }
        .results-header h3 { font-size:1.15rem;font-weight:800;color:var(--text-primary); }
        .results-header p { font-size:0.82rem;color:var(--text-muted); }
        .extracted-table { display:flex;flex-direction:column;gap:12px; }
        .extracted-row { display:grid;grid-template-columns:2fr 1fr 1.5fr auto;gap:12px;align-items:center;background:var(--surface-secondary);padding:14px;border-radius:12px;border:1px solid var(--border); }
        .row-field { display:flex;flex-direction:column;gap:4px; }
        .row-field label { font-size:0.7rem;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:4px; }
        .row-field input { padding:8px 10px;background:var(--input-background);border:1px solid var(--input-border);border-radius:8px;font-family:inherit;font-size:0.85rem;color:var(--text-primary);outline:none; }
        .confidence-chip { font-size:0.7rem;font-weight:700;color:#0d9488;background:rgba(45,212,191,0.15);padding:4px 8px;border-radius:8px;white-space:nowrap; }
        .results-footer { display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border); }
        @media (max-width:640px) { .extracted-row { grid-template-columns:1fr; } }
      `}</style>
    </div>
  )
}
