import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Camera, RotateCcw, Check, Loader } from 'lucide-react'
import { startCameraStream, captureFrameFromVideo, stopStream } from '../camera/cameraService'
import type { CaptureResult } from '../camera/cameraService'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'

interface CameraCaptureProps {
  onCapture: (result: CaptureResult) => void
  onClose: () => void
}

type CamState = 'loading' | 'preview' | 'captured' | 'error'

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const { uiLang } = useApp()
  const [camState, setCamState] = useState<CamState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [capturedResult, setCapturedResult] = useState<CaptureResult | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startStream = useCallback(async () => {
    setCamState('loading')
    setErrorMsg('')
    try {
      const { stream } = await startCameraStream()
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCamState('preview')
    } catch (err) {
      const code = (err as { code?: string }).code || 'UNKNOWN'
      const msgMap: Record<string, string> = {
        PERMISSION_DENIED: t('cameraPermissionDenied', uiLang),
        NOT_FOUND: t('cameraNotAvailable', uiLang),
        IN_USE: t('cameraInUse', uiLang),
        NOT_SUPPORTED: t('cameraNotAvailable', uiLang),
        INSECURE_CONTEXT: t('cameraInsecure', uiLang),
      }
      setErrorMsg(msgMap[code] || t('cameraNotAvailable', uiLang))
      setCamState('error')
    }
  }, [uiLang])

  useEffect(() => {
    startStream()
    return () => {
      stopStream(streamRef.current)
      streamRef.current = null
      if (capturedResult?.previewUrl) URL.revokeObjectURL(capturedResult.previewUrl)
    }
  }, [])

  function handleCapture() {
    if (!videoRef.current || camState !== 'preview') return
    try {
      const result = captureFrameFromVideo(videoRef.current)
      // Pause/hide video stream after capture
      stopStream(streamRef.current)
      streamRef.current = null
      setCapturedResult(result)
      setCamState('captured')
    } catch (err) {
      const msg = String(err)
      if (msg.includes('IMAGE_TOO_DARK')) {
        setErrorMsg(t('imageQualityPoor', uiLang) + ' ' + t('retakeForClarity', uiLang))
      } else {
        setErrorMsg(t('cameraNotAvailable', uiLang))
      }
      setCamState('error')
    }
  }

  function handleRetake() {
    if (capturedResult?.previewUrl) URL.revokeObjectURL(capturedResult.previewUrl)
    setCapturedResult(null)
    startStream()
  }

  function handleUsePhoto() {
    if (!capturedResult) return
    onCapture(capturedResult)
  }

  function handleClose() {
    stopStream(streamRef.current)
    streamRef.current = null
    onClose()
  }

  return (
    <div className="cc-overlay" role="dialog" aria-modal="true" aria-label={t('capture', uiLang)}>
      <div className="cc-modal">
        {/* Header */}
        <div className="cc-header">
          <span className="cc-title">
            {camState === 'captured' ? t('captureConfirm', uiLang) : t('cameraReady', uiLang)}
          </span>
          <button className="cc-close-btn" onClick={handleClose} aria-label={t('cameraClose', uiLang)}>
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="cc-viewfinder">
          {/* Loading */}
          {camState === 'loading' && (
            <div className="cc-loading">
              <Loader size={32} className="cc-spin" />
              <span>{t('cameraLoading', uiLang)}</span>
            </div>
          )}

          {/* Live preview */}
          <video
            ref={videoRef}
            className="cc-video"
            playsInline
            muted
            style={{ display: camState === 'preview' ? 'block' : 'none' }}
            aria-label="Live camera preview"
          />

          {/* Framing guide overlay — only shown during live preview */}
          {camState === 'preview' && (
            <div className="cc-frame-guide" aria-hidden="true">
              <div className="cc-frame-box">
                <span className="cc-frame-label">{t('cameraFrameGuide', uiLang)}</span>
              </div>
            </div>
          )}

          {/* Captured image */}
          {camState === 'captured' && capturedResult && (
            <img src={capturedResult.previewUrl} alt="Captured medicine" className="cc-captured-img" />
          )}

          {/* Error */}
          {camState === 'error' && (
            <div className="cc-error-state">
              <Camera size={36} style={{ color: 'var(--text-muted)' }} />
              <p>{errorMsg}</p>
              <button className="cc-action-btn primary" onClick={startStream}>{t('retry', uiLang)}</button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="cc-controls">
          {camState === 'preview' && (
            <button className="cc-capture-btn" onClick={handleCapture} aria-label={t('capture', uiLang)}>
              <Camera size={22} />
              <span>{t('capture', uiLang)}</span>
            </button>
          )}

          {camState === 'captured' && (
            <div className="cc-confirm-row">
              <button className="cc-action-btn secondary" onClick={handleRetake}>
                <RotateCcw size={15} />
                {t('retake', uiLang)}
              </button>
              <button className="cc-action-btn primary" onClick={handleUsePhoto}>
                <Check size={15} />
                {t('usePhoto', uiLang)}
              </button>
            </div>
          )}

          {camState === 'loading' && (
            <div className="cc-loading-hint">{t('cameraLoading', uiLang)}</div>
          )}
        </div>
      </div>

      <style>{`
        .cc-overlay {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(0,0,0,0.88);
          display: flex; align-items: center; justify-content: center;
          padding: 12px;
        }
        .cc-modal {
          width: 100%; max-width: 480px;
          background: var(--surface);
          border-radius: 20px; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 48px rgba(0,0,0,0.5);
          max-height: calc(100dvh - 24px);
        }
        .cc-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 10px;
          border-bottom: 1px solid var(--border);
        }
        .cc-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
        .cc-close-btn {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface-secondary); border: none; cursor: pointer;
          color: var(--text-muted); transition: background 0.15s;
        }
        .cc-close-btn:hover { background: var(--border); color: var(--text-primary); }
        .cc-viewfinder {
          position: relative; flex: 1; min-height: 260px; max-height: 420px;
          background: #000; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .cc-video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cc-captured-img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .cc-frame-guide {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }
        .cc-frame-box {
          width: 78%; aspect-ratio: 4/3; max-height: 85%;
          border: 2px solid rgba(45,212,191,0.7);
          border-radius: 12px;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.35);
          display: flex; align-items: flex-end; justify-content: center;
          padding-bottom: 8px;
        }
        .cc-frame-label {
          font-size: 0.7rem; color: rgba(255,255,255,0.75);
          background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 20px;
        }
        .cc-loading {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          color: rgba(255,255,255,0.7); font-size: 0.85rem;
        }
        .cc-spin { animation: ccSpin 1s linear infinite; }
        @keyframes ccSpin { to { transform: rotate(360deg); } }
        .cc-error-state {
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 24px; text-align: center; color: rgba(255,255,255,0.7); font-size: 0.85rem;
        }
        .cc-controls {
          padding: 14px 16px 16px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          border-top: 1px solid var(--border);
        }
        .cc-capture-btn {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 13px 32px; background: var(--accent); color: white;
          border: none; border-radius: 14px; font-family: inherit;
          font-size: 0.95rem; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 16px rgba(14,165,233,0.38);
          transition: background 0.15s, transform 0.12s;
        }
        .cc-capture-btn:hover { background: var(--accent-hover); transform: translateY(-2px); }
        .cc-capture-btn:active { transform: scale(0.96); }
        .cc-confirm-row { display: flex; gap: 10px; width: 100%; }
        .cc-action-btn {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 11px 16px; border-radius: 10px; font-family: inherit;
          font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none;
          transition: background 0.15s, transform 0.12s;
        }
        .cc-action-btn.primary { background: var(--accent); color: white; }
        .cc-action-btn.primary:hover { background: var(--accent-hover); transform: translateY(-1px); }
        .cc-action-btn.secondary { background: var(--surface-secondary); color: var(--text-secondary); border: 1px solid var(--border); }
        .cc-action-btn.secondary:hover { border-color: var(--accent); color: var(--accent); }
        .cc-action-btn:active { transform: scale(0.97); }
        .cc-loading-hint { font-size: 0.8rem; color: var(--text-muted); }
        @media (max-width: 480px) {
          .cc-overlay { padding: 0; align-items: flex-end; }
          .cc-modal { border-bottom-left-radius: 0; border-bottom-right-radius: 0; max-height: 95dvh; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cc-spin { animation: none; }
          .cc-capture-btn, .cc-action-btn, .cc-close-btn { transition: none; }
        }
      `}</style>
    </div>
  )
}
