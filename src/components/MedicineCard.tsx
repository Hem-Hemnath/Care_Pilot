
import { CheckCircle } from 'lucide-react'
import type { MedicineRecord } from '../types'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'

interface MedicineCardProps {
  medicine: MedicineRecord
  onClick: (medicine: MedicineRecord) => void
  verified?: boolean
}

export function MedicineCard({ medicine, onClick, verified = true }: MedicineCardProps) {
  const { uiLang } = useApp()
  const shortDesc = medicine.uses
    ? medicine.uses.slice(0, 100) + (medicine.uses.length > 100 ? '...' : '')
    : medicine.composition
    ? medicine.composition.slice(0, 100) + (medicine.composition.length > 100 ? '...' : '')
    : t('noInfo', uiLang)

  return (
    <button
      className="medicine-card"
      onClick={() => onClick(medicine)}
      aria-label={`View details for ${medicine.medicineName}`}
    >
      <div className="medicine-card-header">
        <h3 className="medicine-card-name">{medicine.medicineName}</h3>
        {medicine.manufacturer && (
          <span className="medicine-card-manufacturer">{medicine.manufacturer}</span>
        )}
      </div>
      <p className="medicine-card-desc">{shortDesc}</p>
      {verified && (
        <div className="medicine-card-badge">
          <CheckCircle size={12} />
          <span>{t('verifiedBadge', uiLang)}</span>
        </div>
      )}
      <style>{`
        .medicine-card {
          display: block;
          width: 100%;
          text-align: left;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow);
          perspective: 600px;
        }
        .medicine-card:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: var(--shadow-lg);
          border-color: var(--accent);
        }
        .medicine-card:active { transform: scale(0.98); }
        .medicine-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }
        .medicine-card-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .medicine-card-manufacturer {
          font-size: 0.7rem;
          color: var(--text-muted);
          background: var(--surface-secondary);
          padding: 2px 8px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .medicine-card-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .medicine-card-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          color: var(--success);
          font-weight: 500;
        }
        @media (prefers-reduced-motion: reduce) {
          .medicine-card { transition: none; }
        }
      `}</style>
    </button>
  )
}

