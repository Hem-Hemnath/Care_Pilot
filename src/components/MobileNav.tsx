
import { NavLink } from 'react-router-dom'
import { Scan, BookOpen, Shield, Users } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { useAuth } from '../contexts/AuthContext'
import { t } from '../i18n'

export function MobileNav() {
  const { uiLang } = useApp()
  const { role } = useAuth()
  const isCaregiver = role === 'caregiver'

  return (
    <nav className="mobile-nav" role="navigation" aria-label="Mobile navigation">
      {isCaregiver ? (
        <>
          <NavLink to="/caregiver/dashboard" className="mobile-nav-link">
            <Scan size={20} />
            <span>{t('dashboard', uiLang)}</span>
          </NavLink>
          <NavLink to="/caregiver/patients" className="mobile-nav-link">
            <Users size={20} />
            <span>Patients</span>
          </NavLink>
          <NavLink to="/caregiver/medicine-cabinet" className="mobile-nav-link">
            <BookOpen size={20} />
            <span>{t('cabinet', uiLang)}</span>
          </NavLink>
          <NavLink to="/caregiver/medicine-scanner" className="mobile-nav-link">
            <Scan size={20} />
            <span>{t('scanner', uiLang)}</span>
          </NavLink>
        </>
      ) : (
        <>
          <NavLink to="/patient/dashboard" className="mobile-nav-link">
            <Scan size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/patient/medicine-cabinet" className="mobile-nav-link">
            <BookOpen size={20} />
            <span>Medicines</span>
          </NavLink>
          <NavLink to="/patient/medicine-scanner" className="mobile-nav-link">
            <Scan size={20} />
            <span>Scanner</span>
          </NavLink>
          <NavLink to="/patient/safety" className="mobile-nav-link">
            <Shield size={20} />
            <span>Safety</span>
          </NavLink>
        </>
      )}
      <NavLink to="/library" className="mobile-nav-link">
        <BookOpen size={20} />
        <span>{t('library', uiLang)}</span>
      </NavLink>
      <style>{`
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 200;
          background: var(--surface);
          border-top: 1px solid var(--border);
          padding: 6px 0 env(safe-area-inset-bottom, 6px);
        }
        .mobile-nav-link {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 4px;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 0.65rem;
          font-weight: 500;
          transition: color 0.15s;
        }
        .mobile-nav-link.active { color: var(--accent); }
        @media (max-width: 640px) {
          .mobile-nav { display: flex; }
        }
      `}</style>
    </nav>
  )
}

