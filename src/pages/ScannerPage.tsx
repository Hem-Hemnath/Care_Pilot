import { useState } from 'react'
import { Loader, AlertCircle, X, ArrowLeft, Edit3, Check } from 'lucide-react'
import { Camera } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { CarePilotIcon } from '../components/CarePilotIcon'
import { MedicineProfile } from '../components/MedicineProfile'
import { ChatMessages } from '../components/ChatMessages'
import { BottomInputBar } from '../components/BottomInputBar'
import { CameraCapture } from '../components/CameraCapture'
import {
  identifyMedicineFromImage, identifyMedicineFromText,
  identifyMedicineFromUrl, askAboutMedicine,
} from '../ai/geminiService'
import { compressImage, fileToBase64 } from '../utils/imageUtils'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import type { CaptureResult } from '../camera/cameraService'
import type { AnalysisResult, ChatMessage, Language } from '../types'

type AnalysisState = 'idle' | 'loading' | 'done' | 'error'

export function ScannerPage() {
  const { uiLang, addHistory, isOnline } = useApp()
  const [showCamera, setShowCamera] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [linkMode, setLinkMode] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [manualEditName, setManualEditName] = useState('')
  const [isEditingManual, setIsEditingManual] = useState(false)

  const { isDragging, dragProps } = useDragAndDrop({
    onFilesDropped: (files) => {
      const file = files[0]
      if (file?.type.startsWith('image/')) {
        handleFileSelected(file)
      }
    },
  })

  function resetAll() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(null); setImagePreviewUrl(null)
    setLinkMode(false); setLinkValue('')
    setAnalysisResult(null); setAnalysisError(null)
    setAnalysisState('idle'); setChatMessages([])
    setShowCamera(false); setIsEditingManual(false); setManualEditName('')
  }

  function handleFileSelected(file: File) {
    if (!file.type.startsWith('image/')) { setAnalysisError('Please select a valid image file.'); return }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(file); setImagePreviewUrl(URL.createObjectURL(file))
    setAnalysisResult(null); setAnalysisState('idle'); setAnalysisError(null)
  }

  function handleCameraCapture(result: CaptureResult) {
    setShowCamera(false)
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(result.file); setImagePreviewUrl(result.previewUrl)
    setAnalysisResult(null); setAnalysisState('idle'); setAnalysisError(null)
  }

  async function analyzeImage() {
    if (!imageFile) return
    setAnalysisState('loading'); setAnalysisError(null)
    try {
      const compressed = await compressImage(imageFile)
      const base64 = await fileToBase64(compressed)
      const result = await identifyMedicineFromImage(base64)
      setAnalysisResult(result); setAnalysisState('done')
      if (result.medicine) {
        setManualEditName(result.medicine.medicineName)
        addHistory({ id: Date.now().toString(), medicineName: result.medicine.medicineName, timestamp: new Date(), verified: result.source === 'dataset', thumbnailUrl: imagePreviewUrl || undefined, result })
      }
    } catch (err) { setAnalysisError(String(err)); setAnalysisState('error') }
  }

  async function analyzeLink() {
    if (!linkValue.trim()) { setAnalysisError(t('invalidUrl', uiLang)); return }
    try { new URL(linkValue) } catch { setAnalysisError(t('invalidUrl', uiLang)); return }
    setAnalysisState('loading'); setAnalysisError(null)
    const result = await identifyMedicineFromUrl(linkValue)
    setAnalysisResult(result); setAnalysisState('done')
    if (result.medicine) addHistory({ id: Date.now().toString(), medicineName: result.medicine.medicineName, timestamp: new Date(), verified: result.source === 'dataset', result })
  }

  async function handleManualNameSubmit() {
    if (!manualEditName.trim()) return
    setAnalysisState('loading')
    const result = await identifyMedicineFromText(manualEditName)
    setAnalysisResult(result); setAnalysisState('done')
    setIsEditingManual(false)
  }

  async function handleSend(message: string, lang: Language) {
    if (!analysisResult?.medicine) {
      setAnalysisState('loading'); setAnalysisError(null)
      const result = await identifyMedicineFromText(message)
      setAnalysisResult(result); setAnalysisState('done')
      if (result.medicine) addHistory({ id: Date.now().toString(), medicineName: result.medicine.medicineName, timestamp: new Date(), verified: result.source === 'dataset', result })
      return
    }
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: message, timestamp: new Date(), language: lang }
    setChatMessages((prev) => [...prev, userMsg]); setChatLoading(true)
    const history = chatMessages.map((m) => ({ role: m.role, content: m.content }))
    const answer = await askAboutMedicine(message, analysisResult.medicine, history, lang)
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: answer, timestamp: new Date(), language: lang }
    setChatMessages((prev) => [...prev, aiMsg]); setChatLoading(false)
  }

  const showHero = analysisState === 'idle' && !imageFile && !linkMode
  const showImagePreview = !!imageFile && analysisState !== 'loading'
  const showResult = analysisState === 'done' && !!analysisResult?.medicine
  const showNoResult = analysisState === 'done' && !analysisResult?.medicine
  const showLoading = analysisState === 'loading'
  const isLowConfidence = analysisResult?.confidence === 'low'

  return (
    <>
      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      <div className="sp-root">
        <div
          className={`sp-scroll ${isDragging ? 'sp-drag-active' : ''}`}
          {...dragProps}
        >
          {/* Drag Overlay Banner */}
          {isDragging && (
            <div className="sp-drag-overlay">
              <p>Drop medicine packaging image here to scan</p>
            </div>
          )}

          {/* Offline banner */}
          {!isOnline && (
            <div className="sp-offline-banner" role="status">
              {t('offlineBanner', uiLang)}
            </div>
          )}

          {/* HERO */}
          {showHero && (
            <div className="sp-hero">
              <div className="sp-hero-icon"><CarePilotIcon size={80} /></div>
              <h1 className="sp-hero-h1">{t('takePictureBtn', uiLang) === 'Photo Edu' ? 'Take a picture of your medicine' : t('analyzeHeading', uiLang)}</h1>
              <p className="sp-hero-sub">{t('takePictureSubtext', uiLang)}</p>
              <button className="sp-camera-btn" onClick={() => setShowCamera(true)} aria-label={t('takePictureBtn', uiLang)}>
                <Camera size={18} />
                <span>{t('takePictureBtn', uiLang)}</span>
              </button>
            </div>
          )}

          {/* Errors */}
          {analysisError && (
            <div className="sp-error-banner" role="alert">
              <AlertCircle size={15} />
              <span>{analysisError}</span>
              <button onClick={() => { setAnalysisError(null); setAnalysisState('idle') }} aria-label="Dismiss"><X size={14} /></button>
            </div>
          )}

          {/* Link mode */}
          {linkMode && analysisState === 'idle' && (
            <div className="sp-link-box">
              <button className="sp-back-link" onClick={() => setLinkMode(false)}><ArrowLeft size={14} /> Back</button>
              <h3>{t('pasteLinkTitle', uiLang)}</h3>
              <input type="url" className="sp-url-input" placeholder={t('linkPlaceholder', uiLang)} value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && analyzeLink()} autoFocus />
              <button className="sp-analyze-btn" onClick={analyzeLink}>{t('analyze', uiLang)}</button>
            </div>
          )}

          {/* Image preview */}
          {showImagePreview && (
            <div className="sp-preview-wrap">
              <div className="sp-preview-header">
                <button className="sp-back-link" onClick={resetAll}><ArrowLeft size={14} /> {t('newScan', uiLang)}</button>
                <div className="sp-preview-actions">
                  <label className="sp-action-btn">
                    {t('replace', uiLang)}
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); e.target.value = '' }} />
                  </label>
                  <button className="sp-action-btn" onClick={resetAll}>{t('remove', uiLang)}</button>
                </div>
              </div>
              <img src={imagePreviewUrl!} alt="Medicine to analyze" className="sp-preview-img" />
              {analysisState === 'idle' && (
                <button className="sp-analyze-btn" onClick={analyzeImage}>{t('analyze', uiLang)}</button>
              )}
            </div>
          )}

          {/* Loading */}
          {showLoading && (
            <div className="sp-loading" role="status" aria-live="polite">
              <div className="sp-loading-icon">
                <CarePilotIcon size={52} />
                <Loader size={20} className="sp-spin" />
              </div>
              <p>{isOnline ? t('analyzing', uiLang) : t('offlineSearch', uiLang)}</p>
            </div>
          )}

          {/* No result */}
          {showNoResult && (
            <div className="sp-no-result">
              <AlertCircle size={32} style={{ color: 'var(--warning)' }} />
              <h3>{t('unknownMedicine', uiLang)}</h3>
              <p>{t('unknownPrompt', uiLang)}</p>
              <button className="sp-analyze-btn" onClick={resetAll}>{t('retry', uiLang)}</button>
            </div>
          )}

          {/* Result + chat */}
          {showResult && (
            <div className="sp-result-wrap">
              <button className="sp-back-link" onClick={resetAll}><ArrowLeft size={14} /> {t('backToScanner', uiLang)}</button>

              {/* Low Confidence Candidate Fallback UI */}
              {isLowConfidence && (
                <div className="sp-low-conf-card">
                  <div className="sp-low-conf-header">
                    <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-100 text-sm">Low OCR Confidence Match</h4>
                      <p className="text-xs text-slate-400">Extracted details may be fuzzy. Verify or edit manually below:</p>
                    </div>
                  </div>
                  <div className="sp-manual-edit-row">
                    <input
                      type="text"
                      className="sp-url-input flex-1"
                      value={manualEditName}
                      onChange={(e) => setManualEditName(e.target.value)}
                      placeholder="Edit medicine name..."
                    />
                    <button className="sp-analyze-btn" onClick={handleManualNameSubmit}>
                      <Check size={14} /> Save & Search
                    </button>
                  </div>
                </div>
              )}

              <MedicineProfile medicine={analysisResult!.medicine!} verified={analysisResult!.source === 'dataset'} source={analysisResult!.source} />
              {chatMessages.length > 0 && (
                <div className="sp-chat-history">
                  <ChatMessages messages={chatMessages} isLoading={chatLoading} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom input */}
        <div className="sp-bottom-bar">
          <BottomInputBar
            onSend={handleSend}
            onFileSelected={handleFileSelected}
            onLinkClick={() => { setLinkMode(true) }}
            disabled={showLoading || chatLoading}
            placeholder={showResult ? t('askPlaceholder', uiLang) : t('askPlaceholder', uiLang)}
          />
        </div>
      </div>

      <style>{`
        .sp-root { display:flex;flex-direction:column;height:calc(100dvh - 56px);max-width:660px;margin:0 auto;width:100%; }
        .sp-scroll { flex:1;overflow-y:auto;padding:24px 20px 12px;display:flex;flex-direction:column;gap:18px;scroll-behavior:smooth;position:relative; }
        .sp-drag-active { border:2px dashed var(--accent);background:rgba(14,165,233,0.05); }
        .sp-drag-overlay { position:absolute;inset:0;background:rgba(14,165,233,0.15);backdrop-filter:blur(4px);z-index:50;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--accent);font-size:1.1rem;border-radius:12px; }
        .sp-offline-banner { padding:8px 14px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:10px;font-size:0.78rem;color:var(--warning);text-align:center; }
        .sp-hero { display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 0 8px;text-align:center;flex:1;justify-content:center; }
        .sp-hero-icon { filter:drop-shadow(0 0 22px rgba(45,212,191,0.4));animation:spFloat 3s ease-in-out infinite; }
        @keyframes spFloat { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
        .sp-hero-h1 { font-size:clamp(1.1rem,3.5vw,1.45rem);font-weight:700;color:var(--text-primary);line-height:1.28;letter-spacing:-0.02em;max-width:320px; }
        .sp-hero-sub { font-size:0.82rem;color:var(--text-muted);line-height:1.6;max-width:300px;margin-top:-4px; }
        .sp-camera-btn { display:inline-flex;align-items:center;gap:9px;padding:13px 26px;background:var(--accent);color:#fff;border:none;border-radius:14px;font-family:inherit;font-size:0.95rem;font-weight:600;cursor:pointer;box-shadow:0 4px 18px rgba(14,165,233,0.32);transition:background 0.18s,transform 0.15s;margin-top:4px; }
        .sp-camera-btn:hover { background:var(--accent-hover);transform:translateY(-2px); }
        .sp-camera-btn:active { transform:scale(0.97); }
        .sp-error-banner { display:flex;align-items:center;gap:8px;padding:10px 13px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.22);border-radius:10px;font-size:0.8rem;color:var(--danger); }
        .sp-error-banner button { background:none;border:none;cursor:pointer;color:var(--danger);margin-left:auto;display:flex;align-items:center; }
        .sp-link-box { background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:11px; }
        .sp-link-box h3 { font-size:0.9rem;font-weight:600;color:var(--text-primary); }
        .sp-url-input { width:100%;padding:9px 13px;background:var(--input-background);border:1px solid var(--input-border);border-radius:9px;font-family:inherit;font-size:0.875rem;color:var(--text-primary);outline:none; }
        .sp-url-input:focus { border-color:var(--accent); }
        .sp-analyze-btn { align-self:flex-end;padding:9px 20px;background:var(--accent);color:#fff;border:none;border-radius:9px;font-family:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;transition:background 0.15s,transform 0.15s;display:inline-flex;align-items:center;gap:6px; }
        .sp-analyze-btn:hover { background:var(--accent-hover);transform:translateY(-1px); }
        .sp-analyze-btn:active { transform:scale(0.97); }
        .sp-back-link { display:inline-flex;align-items:center;gap:5px;font-size:0.78rem;color:var(--text-muted);background:none;border:none;cursor:pointer;padding:0;font-family:inherit;transition:color 0.15s; }
        .sp-back-link:hover { color:var(--accent); }
        .sp-preview-wrap { display:flex;flex-direction:column;gap:11px; }
        .sp-preview-header { display:flex;align-items:center;justify-content:space-between; }
        .sp-preview-actions { display:flex;gap:7px; }
        .sp-action-btn { padding:6px 13px;border-radius:7px;font-family:inherit;font-size:0.78rem;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface-secondary);color:var(--text-secondary);transition:border-color 0.15s,color 0.15s; }
        .sp-action-btn:hover { border-color:var(--accent);color:var(--accent); }
        .sp-preview-img { width:100%;max-height:250px;object-fit:contain;border-radius:12px;background:var(--surface-secondary);border:1px solid var(--border); }
        .sp-loading { display:flex;flex-direction:column;align-items:center;gap:14px;padding:48px 20px;flex:1;justify-content:center; }
        .sp-loading-icon { position:relative;display:inline-block; }
        .sp-spin { position:absolute;bottom:-5px;right:-5px;animation:spSpin 1s linear infinite;color:var(--accent); }
        @keyframes spSpin { to { transform:rotate(360deg); } }
        .sp-loading p { font-size:0.85rem;color:var(--text-muted); }
        .sp-no-result { display:flex;flex-direction:column;align-items:center;gap:11px;padding:48px 20px;text-align:center;flex:1;justify-content:center; }
        .sp-no-result h3 { font-size:1rem;font-weight:600;color:var(--text-primary); }
        .sp-no-result p { font-size:0.8rem;color:var(--text-secondary);max-width:280px; }
        .sp-result-wrap { display:flex;flex-direction:column;gap:14px; }
        .sp-low-conf-card { background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px; }
        .sp-low-conf-header { display:flex;align-items:center;gap:10px; }
        .sp-manual-edit-row { display:flex;align-items:center;gap:8px; }
        .sp-chat-history { background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:10px; }
        .sp-bottom-bar { flex-shrink:0;padding:10px 16px max(12px, env(safe-area-inset-bottom, 12px));background:var(--background);border-top:1px solid var(--border); }
        @media (max-width:480px) { .sp-root{max-width:100%;} .sp-scroll{padding:16px 14px 10px;} .sp-bottom-bar{padding:8px 12px max(10px, env(safe-area-inset-bottom, 10px));} .sp-hero-h1{font-size:1.1rem;} .sp-camera-btn{padding:12px 22px;font-size:0.9rem;} .sp-manual-edit-row{flex-direction:column;align-items:stretch;} }
        @media (prefers-reduced-motion:reduce) { .sp-hero-icon{animation:none;} .sp-spin{animation:none;} .sp-camera-btn,.sp-analyze-btn,.sp-back-link{transition:none;} }
      `}</style>
    </>
  )
}
