import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Sun, Moon, Monitor, Languages, Menu, X, BookOpen, History, Settings, Scan, FileText, Users, Shield, LogOut, UserCheck, HeartHandshake } from 'lucide-react'
import { CarePilotIcon } from './CarePilotIcon'
import { AnimatedDropdown } from './ui/AnimatedDropdown'
import { useApp } from '../hooks/useApp'
import { useAuth } from '../contexts/AuthContext'
import { t } from '../i18n'
import type { Language, Theme } from '../types'

const langOptions = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'tanglish', label: 'Tanglish' },
]

const themeOptions = [
  { value: 'light', label: 'Light', icon: <Sun size={14} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
  { value: 'system', label: 'System', icon: <Monitor size={14} /> },
]

export function Navbar() {
  const { uiLang, setUiLang, theme, setTheme } = useApp()
  const { user, role, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const themeIcon =
    theme === 'dark' ? <Moon size={18} /> :
    theme === 'light' ? <Sun size={18} /> :
    <Monitor size={18} />

  const isCaregiver = role === 'caregiver'

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">

          {/* Brand */}
          <NavLink to={isCaregiver ? "/caregiver/dashboard" : "/patient/dashboard"} className="navbar-brand" aria-label="CarePilot Home">
            <div className="navbar-logo-wrap">
              <CarePilotIcon size={32} />
            </div>
            <span className="navbar-title">CarePilot</span>
            <span className={`role-badge ${role}`}>
              {role === 'caregiver' ? <HeartHandshake size={11} /> : <UserCheck size={11} />}
              {role === 'caregiver' ? 'Caregiver' : 'Patient'}
            </span>
          </NavLink>

          {/* Desktop nav links */}
          <div className="navbar-links" role="menubar" aria-label="Navigation links">
            {isCaregiver ? (
              <>
                <NavLink to="/caregiver/dashboard" className="nav-link" role="menuitem">
                  <Scan size={15} />
                  <span>{t('dashboard', uiLang)}</span>
                </NavLink>
                <NavLink to="/caregiver/patients" className="nav-link" role="menuitem">
                  <Users size={15} />
                  <span>Patients</span>
                </NavLink>
                <NavLink to="/caregiver/medicine-cabinet" className="nav-link" role="menuitem">
                  <BookOpen size={15} />
                  <span>{t('cabinet', uiLang)}</span>
                </NavLink>
                <NavLink to="/caregiver/medicine-scanner" className="nav-link" role="menuitem">
                  <Scan size={15} />
                  <span>{t('scanner', uiLang)}</span>
                </NavLink>
                <NavLink to="/caregiver/prescription-scanner" className="nav-link" role="menuitem">
                  <FileText size={15} />
                  <span>{t('prescriptions', uiLang)}</span>
                </NavLink>
                <NavLink to="/caregiver/safety-checker" className="nav-link" role="menuitem">
                  <Shield size={15} />
                  <span>{t('safety', uiLang)}</span>
                </NavLink>
                <NavLink to="/caregiver/compare" className="nav-link" role="menuitem">
                  <History size={15} />
                  <span>{t('comparator', uiLang)}</span>
                </NavLink>
                <NavLink to="/library" className="nav-link" role="menuitem">
                  <BookOpen size={15} />
                  <span>{t('library', uiLang)}</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/patient/dashboard" className="nav-link" role="menuitem">
                  <Scan size={15} />
                  <span>My Dashboard</span>
                </NavLink>
                <NavLink to="/patient/medicine-cabinet" className="nav-link" role="menuitem">
                  <BookOpen size={15} />
                  <span>My Medicines</span>
                </NavLink>
                <NavLink to="/patient/medicine-scanner" className="nav-link" role="menuitem">
                  <Scan size={15} />
                  <span>Scan Medicine</span>
                </NavLink>
                <NavLink to="/patient/prescriptions" className="nav-link" role="menuitem">
                  <FileText size={15} />
                  <span>My Prescriptions</span>
                </NavLink>
                <NavLink to="/patient/safety" className="nav-link" role="menuitem">
                  <Shield size={15} />
                  <span>Safety Status</span>
                </NavLink>
                <NavLink to="/library" className="nav-link" role="menuitem">
                  <BookOpen size={15} />
                  <span>{t('library', uiLang)}</span>
                </NavLink>
              </>
            )}
          </div>

          {/* Right controls: language, theme, user logout */}
          <div className="navbar-right">
            <div className="nav-icon-dropdown">
              <AnimatedDropdown
                options={langOptions}
                value={uiLang}
                onChange={(v) => setUiLang(v as Language)}
                id="lang-select"
                iconOnly
                triggerIcon={<Languages size={18} />}
              />
            </div>
            <div className="nav-icon-dropdown">
              <AnimatedDropdown
                options={themeOptions}
                value={theme}
                onChange={(v) => setTheme(v as Theme)}
                id="theme-select"
                iconOnly
                triggerIcon={themeIcon}
              />
            </div>

            {user ? (
              <button className="auth-logout-btn" onClick={logout} title="Sign Out">
                <LogOut size={16} />
              </button>
            ) : (
              <NavLink to="/login" className="auth-login-link">
                {t('login', uiLang)}
              </NavLink>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="hamburger-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div id="mobile-menu" className="mobile-menu" role="menu" aria-label="Mobile navigation">
          {isCaregiver ? (
            <>
              <NavLink to="/caregiver/dashboard" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Scan size={16} /> {t('dashboard', uiLang)}
              </NavLink>
              <NavLink to="/caregiver/patients" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Users size={16} /> Patients
              </NavLink>
              <NavLink to="/caregiver/medicine-cabinet" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <BookOpen size={16} /> {t('cabinet', uiLang)}
              </NavLink>
              <NavLink to="/caregiver/medicine-scanner" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Scan size={16} /> {t('scanner', uiLang)}
              </NavLink>
              <NavLink to="/caregiver/prescription-scanner" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <FileText size={16} /> {t('prescriptions', uiLang)}
              </NavLink>
              <NavLink to="/caregiver/safety-checker" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Shield size={16} /> {t('safety', uiLang)}
              </NavLink>
              <NavLink to="/caregiver/compare" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <History size={16} /> {t('comparator', uiLang)}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/patient/dashboard" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Scan size={16} /> My Dashboard
              </NavLink>
              <NavLink to="/patient/medicine-cabinet" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <BookOpen size={16} /> My Medicines
              </NavLink>
              <NavLink to="/patient/medicine-scanner" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Scan size={16} /> Scan Medicine
              </NavLink>
              <NavLink to="/patient/prescriptions" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <FileText size={16} /> My Prescriptions
              </NavLink>
              <NavLink to="/patient/safety" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
                <Shield size={16} /> Safety Status
              </NavLink>
            </>
          )}
          <NavLink to="/library" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
            <BookOpen size={16} /> {t('library', uiLang)}
          </NavLink>
          <NavLink to="/settings" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
            <Settings size={16} /> {t('settings', uiLang)}
          </NavLink>
        </div>
      )}

      <style>{`
        /* ── Navbar container ── */
        .navbar {
          position: sticky; top: 0; z-index: 200;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          box-shadow:
            0 1px 0 var(--border),
            0 4px 20px rgba(0,0,0,0.04);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .navbar-inner {
          max-width: 960px; margin: 0 auto;
          padding: 0 20px; height: 56px;
          display: flex; align-items: center; gap: 16px;
        }

        /* ── Brand ── */
        .navbar-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .navbar-brand:hover {
          transform: scale(1.02);
          filter: drop-shadow(0 0 8px rgba(14,165,233,0.3));
        }
        .navbar-logo-wrap { display: flex; align-items: center; }
        .navbar-title {
          font-size: 1.1rem; font-weight: 700;
          color: var(--text-primary); letter-spacing: -0.01em;
        }
        .role-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 10px;
        }
        .role-badge.caregiver { background: rgba(14,165,233,0.12); color: var(--accent); border: 1px solid rgba(14,165,233,0.25); }
        .role-badge.patient { background: rgba(45,212,191,0.12); color: #0d9488; border: 1px solid rgba(45,212,191,0.25); }
        .auth-logout-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 8px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          color: var(--danger); cursor: pointer; transition: all 0.15s;
        }
        .auth-logout-btn:hover { background: var(--danger); color: #fff; }
        .auth-login-link {
          font-size: 0.82rem; font-weight: 700; color: var(--accent);
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.2);
        }

        /* ── Desktop nav links ── */
        .navbar-links {
          display: flex; align-items: center; gap: 2px; flex: 1;
        }
        .nav-link {
          position: relative;
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 10px;
          font-size: 0.82rem; font-weight: 500;
          color: var(--text-muted); text-decoration: none;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid transparent;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: var(--surface-secondary);
          border-color: var(--border);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(14,165,233,0.12);
        }
        .nav-link:hover svg {
          transform: scale(1.15) rotate(-3deg);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .nav-link.active {
          color: var(--accent);
          background: rgba(14,165,233,0.1);
          border-color: rgba(14,165,233,0.2);
          font-weight: 600;
          box-shadow:
            0 2px 8px rgba(14,165,233,0.15),
            inset 0 1px 0 rgba(14,165,233,0.1);
        }

        /* ── Right controls ── */
        .navbar-right {
          display: flex; align-items: center; gap: 6px;
          margin-left: auto; flex-shrink: 0;
        }
        .nav-icon-dropdown { position: relative; }

        /* ── Hamburger ── */
        .hamburger-btn {
          display: none; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 8px;
          background: var(--surface-secondary); border: 1px solid var(--border);
          color: var(--text-secondary); cursor: pointer;
          transition: all 0.2s ease;
        }
        .hamburger-btn:hover {
          background: var(--border); color: var(--text-primary);
          transform: scale(1.05);
        }
        .hamburger-btn:focus-visible {
          outline: 2px solid var(--accent); outline-offset: 2px;
        }

        /* ── Mobile slide-down menu ── */
        .mobile-menu {
          position: sticky; top: 56px; z-index: 199;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          display: flex; flex-direction: column;
          padding: 8px;
          animation: slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-menu-link {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 8px;
          font-size: 0.9rem; font-weight: 500;
          color: var(--text-secondary); text-decoration: none;
          border-left: 3px solid transparent;
          transition: all 0.18s ease;
        }
        .mobile-menu-link:hover {
          background: var(--surface-secondary);
          color: var(--accent);
          transform: translateX(4px);
          border-left: 3px solid var(--accent);
          padding-left: 11px;
        }
        .mobile-menu-link.active {
          color: var(--accent); font-weight: 600;
          background: rgba(14,165,233,0.08);
          border-left: 3px solid var(--accent);
        }

        /* ── Animations ── */
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .navbar-links { display: none; }
          .hamburger-btn { display: flex; }
          .navbar-inner { padding: 0 14px; }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .navbar-brand,
          .nav-link,
          .hamburger-btn,
          .mobile-menu,
          .mobile-menu-link {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </>
  )
}
