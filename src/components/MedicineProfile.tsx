
import { useState } from 'react'
import { CheckCircle, AlertTriangle, ExternalLink, ThumbsUp, Minus, ThumbsDown, Plus, Check } from 'lucide-react'
import type { MedicineRecord } from '../types'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { addMedicineToCabinet } from '../services/cabinetService'
import { getActivePatientId } from '../services/patientService'

interface MedicineProfileProps {
  medicine: MedicineRecord
  verified?: boolean
  source?: 'dataset' | 'ai' | 'none'
}

function InfoSection({ label, value }: { label: string; value: string }) {
  const { uiLang } = useApp()
  const display = value && value.trim() ? value : t('noInfo', uiLang as 'en' | 'ta' | 'tanglish')
  return (
    <div className="profile-section">
      <div className="profile-label">{label}</div>
      <div className="profile-value">{display}</div>
    </div>
  )
}

export function MedicineProfile({ medicine, verified = true, source }: MedicineProfileProps) {
  const { uiLang } = useApp()
  const isVerified = verified && source === 'dataset'
  const [added, setAdded] = useState(false)

  const handleAddToCabinet = () => {
    const activePatId = getActivePatientId()
    addMedicineToCabinet(activePatId, {
      name: medicine.medicineName,
      generic: medicine.medicineName,
      strength: medicine.composition || 'As prescribed',
      dose: '1 Tablet',
      frequency: 'Once Daily',
      times: ['08:00 AM'],
      imageUrl: medicine.imageUrl || '',
      stock: 30,
      notes: medicine.uses ? `Uses: ${medicine.uses.substring(0, 100)}` : '',
      source: 'scanner',
      verified: isVerified,
    })
    setAdded(true)
  }

  const totalReviews =
    (medicine.excellentReviewPct ?? 0) +
    (medicine.averageReviewPct ?? 0) +
    (medicine.poorReviewPct ?? 0)
  const hasReviews = totalReviews > 0

  return (
    <div className="medicine-profile">
      <div className="profile-header">
        <div>
          <h2 className="profile-name">{medicine.medicineName}</h2>
          {medicine.manufacturer && (
            <p className="profile-manufacturer">{medicine.manufacturer}</p>
          )}
        </div>
        <div className="profile-badge-wrap">
          <button
            className={`add-cab-btn ${added ? 'added' : ''}`}
            onClick={handleAddToCabinet}
            disabled={added}
          >
            {added ? <Check size={14} /> : <Plus size={14} />}
            <span>{added ? 'Added to Cabinet' : t('addToCabinet', uiLang)}</span>
          </button>
          {isVerified ? (
            <div className="profile-badge verified">
              <CheckCircle size={14} />
              <span>{t('verifiedBadge', uiLang)}</span>
            </div>
          ) : (
            <div className="profile-badge unverified">
              <AlertTriangle size={14} />
              <span>{t('notVerified', uiLang)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="profile-grid">
        <InfoSection label={t('composition', uiLang)} value={medicine.composition} />
        <InfoSection label={t('uses', uiLang)} value={medicine.uses} />
        <InfoSection label={t('sideEffects', uiLang)} value={medicine.sideEffects} />
        <InfoSection label={t('manufacturer', uiLang)} value={medicine.manufacturer} />
      </div>

      {hasReviews && (
        <div className="profile-reviews">
          <h4 className="reviews-title">{t('reviews', uiLang)}</h4>
          <div className="reviews-grid">
            {medicine.excellentReviewPct != null && (
              <div className="review-bar excellent">
                <ThumbsUp size={14} />
                <span>{t('excellent', uiLang)}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${medicine.excellentReviewPct}%` }} />
                </div>
                <span className="review-pct">{medicine.excellentReviewPct}%</span>
              </div>
            )}
            {medicine.averageReviewPct != null && (
              <div className="review-bar average">
                <Minus size={14} />
                <span>{t('average', uiLang)}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${medicine.averageReviewPct}%` }} />
                </div>
                <span className="review-pct">{medicine.averageReviewPct}%</span>
              </div>
            )}
            {medicine.poorReviewPct != null && (
              <div className="review-bar poor">
                <ThumbsDown size={14} />
                <span>{t('poor', uiLang)}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${medicine.poorReviewPct}%` }} />
                </div>
                <span className="review-pct">{medicine.poorReviewPct}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {medicine.imageUrl && (
        <div className="profile-image-link">
          <a href={medicine.imageUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={13} /> View medicine image
          </a>
        </div>
      )}

      <style>{`
        .medicine-profile {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--shadow);
        }
        .profile-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .profile-name {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .profile-manufacturer {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .profile-badge-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .add-cab-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 20px;
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .add-cab-btn.added {
          background: rgba(45,212,191,0.2);
          color: #0d9488;
        }
        .profile-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .profile-badge.verified {
          background: rgba(16,185,129,0.1);
          color: var(--success);
          border: 1px solid rgba(16,185,129,0.25);
        }
        .profile-badge.unverified {
          background: rgba(245,158,11,0.1);
          color: var(--warning);
          border: 1px solid rgba(245,158,11,0.25);
        }
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .profile-section {
          padding: 12px 14px;
          background: var(--surface-secondary);
          border-radius: 10px;
          border: 1px solid var(--border);
        }
        .profile-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .profile-value {
          font-size: 0.875rem;
          color: var(--text-primary);
          line-height: 1.6;
        }
        .profile-reviews { margin-top: 16px; }
        .reviews-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .reviews-grid { display: flex; flex-direction: column; gap: 8px; }
        .review-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .review-bar span:first-of-type { width: 60px; flex-shrink: 0; }
        .bar-track {
          flex: 1;
          height: 8px;
          background: var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .review-bar.excellent .bar-fill { background: var(--success); height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .review-bar.average .bar-fill { background: var(--warning); height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .review-bar.poor .bar-fill { background: var(--danger); height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .review-pct { font-size: 0.72rem; font-weight: 600; width: 36px; text-align: right; flex-shrink: 0; }
        .profile-image-link { margin-top: 12px; }
        .profile-image-link a {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 0.78rem; color: var(--accent);
        }
        .profile-image-link a:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}

