import { useEffect } from 'react'
import { Camera, Mic, CheckCircle, XCircle, Loader } from 'lucide-react'
import type { PermissionsState } from '../hooks/usePermissions'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'

interface PermissionGateProps {
  perms: PermissionsState
}

export function PermissionGate({ perms }: PermissionGateProps) {
  const { uiLang } = useApp()
  const { camera, mic, requested, requestPermissions } = perms

  // Auto-request once on mount if not yet determined
  useEffect(() => {
    if (!requested && (camera === 'prompt' || camera === 'unknown') && (mic === 'prompt' || mic === 'unknown')) {
      requestPermissions()
    }
  }, [])

  // Only show the panel if permissions haven't been determined yet (first visit)
  const needsPrompt = !requested && (camera === 'unknown' || camera === 'prompt') && (mic === 'unknown' || mic === 'prompt')
  const bothGranted = camera === 'granted' && mic === 'granted'

  if (bothGranted || (requested && camera !== 'unknown' && mic !== 'unknown')) {
    // All determined — don't block, just show a tiny status bar if something is denied
    const anyDenied = camera === 'denied' || mic === 'denied'
    if (!anyDenied) return null

    return (
      <div className="pg-banner">
        {camera === 'denied' && <span className="pg-item denied"><XCircle size={13} /> {t('permCameraDenied', uiLang)}</span>}
        {mic === 'denied' && <span className="pg-item denied"><XCircle size={13} /> {t('permMicDenied', uiLang)}</span>}
        <style>{`
          .pg-banner { display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:8px 16px;background:rgba(239,68,68,0.07);border-bottom:1px solid rgba(239,68,68,0.15);font-size:0.75rem; }
          .pg-item { display:flex;align-items:center;gap:4px; }
          .pg-item.denied { color:var(--danger); }
        `}</style>
      </div>
    )
  }

  if (needsPrompt || requested) {
    return (
      <div className="pg-overlay">
        <div className="pg-card">
          <div className="pg-icons">
            <Camera size={28} style={{ color: 'var(--accent)' }} />
            <Mic size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="pg-title">{t('permissionTitle', uiLang)}</h2>
          <p className="pg-body">{t('permissionBody', uiLang)}</p>

          <div className="pg-status-row">
            <PermStatus state={camera} label={requested ? t('permCameraGranted', uiLang) : 'Camera'} denied={t('permCameraDenied', uiLang)} />
            <PermStatus state={mic} label={requested ? t('permMicGranted', uiLang) : 'Microphone'} denied={t('permMicDenied', uiLang)} />
          </div>

          {!requested && (
            <button className="pg-allow-btn" onClick={requestPermissions}>{t('permissionAllow', uiLang)}</button>
          )}
          {requested && (camera === 'unknown' || mic === 'unknown') && (
            <div className="pg-loading"><Loader size={18} className="pg-spin" /> Checking permissions…</div>
          )}
        </div>

        <style>{`
          .pg-overlay {
            position:fixed;inset:0;z-index:600;
            background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);
            display:flex;align-items:center;justify-content:center;padding:20px;
          }
          .pg-card {
            background:var(--surface);border-radius:20px;padding:28px 24px;
            max-width:360px;width:100%;text-align:center;
            box-shadow:0 24px 48px rgba(0,0,0,0.4);
            display:flex;flex-direction:column;align-items:center;gap:14px;
          }
          .pg-icons { display:flex;gap:14px;align-items:center; }
          .pg-title { font-size:1.05rem;font-weight:700;color:var(--text-primary); }
          .pg-body { font-size:0.82rem;color:var(--text-secondary);line-height:1.55;max-width:280px; }
          .pg-status-row { display:flex;gap:12px;flex-wrap:wrap;justify-content:center; }
          .pg-allow-btn {
            padding:12px 28px;background:var(--accent);color:white;border:none;
            border-radius:12px;font-family:inherit;font-size:0.9rem;font-weight:600;cursor:pointer;
            transition:background 0.15s,transform 0.12s;
          }
          .pg-allow-btn:hover { background:var(--accent-hover);transform:translateY(-1px); }
          .pg-loading { display:flex;align-items:center;gap:8px;font-size:0.8rem;color:var(--text-muted); }
          .pg-spin { animation:pgSpin 1s linear infinite; }
          @keyframes pgSpin { to { transform:rotate(360deg); } }
          @media (prefers-reduced-motion:reduce) { .pg-spin { animation:none; } .pg-allow-btn { transition:none; } }
        `}</style>
      </div>
    )
  }

  return null
}

function PermStatus({ state, label, denied }: { state: string; label: string; denied: string }) {
  if (state === 'granted') return <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:'0.75rem',color:'var(--success)' }}><CheckCircle size={13}/>{label}</span>
  if (state === 'denied') return <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:'0.75rem',color:'var(--danger)' }}><XCircle size={13}/>{denied}</span>
  return <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:'0.75rem',color:'var(--text-muted)' }}><Loader size={13}/>{label}</span>
}
