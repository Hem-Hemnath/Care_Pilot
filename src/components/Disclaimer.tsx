
import { useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export function Disclaimer() {
  const location = useLocation()
  const path = location.pathname.toLowerCase()
  const isDashboard =
    path === '/' ||
    path === '/dashboard' ||
    path === '/caregiver/dashboard' ||
    path === '/patient/dashboard'

  if (!isDashboard) return null

  return (
    <footer
      className="dashboard-disclaimer-footer w-full mt-10 pt-6 pb-4 border-t border-slate-800/60"
      role="contentinfo"
      aria-label="Medical disclaimer"
    >
      <div className="disclaimer-content flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
        <AlertTriangle size={16} className="disclaimer-icon shrink-0 text-amber-500" />
        <span>
          Disclaimer: CarePilot AI provides informational guidance only. Always consult a healthcare professional for medical decisions.
        </span>
      </div>

      <style>{`
        .dashboard-disclaimer-footer {
          width: 100%;
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          padding-bottom: 1rem;
          border-top: 1px solid var(--border, rgba(30, 41, 59, 0.6));
        }
        .disclaimer-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-muted, #94a3b8);
          font-size: 0.8125rem;
          line-height: 1.4;
        }
        .disclaimer-icon {
          flex-shrink: 0;
          color: var(--warning, #f59e0b);
        }
        @media (max-width: 640px) {
          .disclaimer-content {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </footer>
  )
}


