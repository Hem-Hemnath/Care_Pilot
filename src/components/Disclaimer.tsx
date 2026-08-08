
import { AlertCircle } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'

export function Disclaimer() {
  const { uiLang } = useApp()
  return (
    <div className="disclaimer" role="complementary" aria-label="Medical disclaimer">
      <AlertCircle size={14} style={{ flexShrink: 0, color: 'var(--warning)' }} />
      <span>{t('disclaimer', uiLang)}</span>
      <style>{`
        .disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.2);
          border-radius: 10px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.5;
          max-width: 600px;
        }
      `}</style>
    </div>
  )
}

