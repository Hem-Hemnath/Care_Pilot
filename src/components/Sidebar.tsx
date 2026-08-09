import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Scan, BookOpen, History, Settings, FileText, Users, Shield, LogOut,
  UserCheck, HeartHandshake, ChevronLeft, ChevronRight, Menu, X, Sun, Moon, Monitor, Languages, Pill
} from 'lucide-react'
import { CarePilotIcon } from './CarePilotIcon'
import { AnimatedDropdown } from './ui/AnimatedDropdown'
import { useApp } from '../hooks/useApp'
import { useAuth } from '../contexts/AuthContext'
import { t } from '../i18n'
import type { Language, Theme } from '../types'

const langOptions = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ்' },
]

const themeOptions = [
  { value: 'light', label: 'Light', icon: <Sun size={14} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
  { value: 'system', label: 'System', icon: <Monitor size={14} /> },
]

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { uiLang, setUiLang, theme, setTheme } = useApp()
  const { user, role, logout } = useAuth()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const location = useLocation()

  // Track window resize to detect tablet screen range (640px - 1024px)
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth >= 640 && window.innerWidth <= 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname])

  const themeIcon =
    theme === 'dark' ? <Moon size={16} /> :
    theme === 'light' ? <Sun size={16} /> :
    <Monitor size={16} />

  const isCaregiver = role === 'caregiver'
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup'
  const isIconOnly = collapsed || isTablet

  if (isAuthRoute) return null

  return (
    <>
      {/* Mobile Top App Header (< 640px) */}
      <header className="mobile-header">
        <NavLink to={isCaregiver ? "/caregiver/dashboard" : "/patient/dashboard"} className="mobile-brand">
          <CarePilotIcon size={28} />
          <span className="brand-title">CarePilot</span>
          <span className={`role-badge ${role}`}>
            {isCaregiver ? 'Caregiver' : 'Patient'}
          </span>
        </NavLink>

        <button
          className="mobile-hamburger-btn"
          onClick={() => setMobileDrawerOpen((v) => !v)}
          aria-label={mobileDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileDrawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileDrawerOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Responsive Sidebar & Drawer Container */}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileDrawerOpen ? 'mobile-open' : ''}`}>
        {/* Top Section 1: Brand & Logo */}
        <div className="sidebar-brand-container">
          <NavLink
            to={isCaregiver ? "/caregiver/dashboard" : "/patient/dashboard"}
            className="sidebar-brand-link"
            title="CarePilot Dashboard"
          >
            <div className="logo-glow-wrap">
              <CarePilotIcon size={34} />
            </div>
            {!isIconOnly && (
              <div className="brand-text-block">
                <span className="brand-name">CarePilot</span>
                <span className={`role-pill ${role}`}>
                  {isCaregiver ? <HeartHandshake size={10} /> : <UserCheck size={10} />}
                  {isCaregiver ? 'Caregiver' : 'Patient'}
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop Sidebar Collapse Toggle Button */}
          <button
            className="collapse-toggle-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Top Section 2: Repositioned Controls (Language Selector & Theme Toggle) */}
        <div className="sidebar-top-controls">
          <div className="controls-row">
            <div className="dropdown-wrapper" title="Change Language">
              <AnimatedDropdown
                options={langOptions}
                value={uiLang}
                onChange={(v) => setUiLang(v as Language)}
                id="sidebar-lang-select"
                iconOnly={isIconOnly}
                align="left"
                triggerIcon={<Languages size={17} />}
              />
            </div>
            <div className="dropdown-wrapper" title="Change Theme">
              <AnimatedDropdown
                options={themeOptions}
                value={theme}
                onChange={(v) => setTheme(v as Theme)}
                id="sidebar-theme-select"
                iconOnly={isIconOnly}
                align="left"
                triggerIcon={themeIcon}
              />
            </div>
          </div>
        </div>

        {/* Nav Links Section with 3D Hover & Hover Tooltips */}
        <div className="sidebar-menu-perspective">
          <nav className="sidebar-nav-list" role="navigation" aria-label="Sidebar main navigation">
            {isCaregiver ? (
              <>
                <NavLink
                  to="/caregiver/dashboard"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={t('dashboard', uiLang)}
                >
                  <Scan size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">{t('dashboard', uiLang)}</span>}
                  <span className="sidebar-tooltip">{t('dashboard', uiLang)}</span>
                </NavLink>

                <NavLink
                  to="/caregiver/patients"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title="Managed Patients"
                >
                  <Users size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">Patients</span>}
                  <span className="sidebar-tooltip">Patients</span>
                </NavLink>

                <NavLink
                  to="/caregiver/medicine-cabinet"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={t('cabinet', uiLang)}
                >
                  <Pill size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">{t('cabinet', uiLang)}</span>}
                  <span className="sidebar-tooltip">{t('cabinet', uiLang)}</span>
                </NavLink>

                <NavLink
                  to="/caregiver/medicine-scanner"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={t('scanner', uiLang)}
                >
                  <Scan size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">{t('scanner', uiLang)}</span>}
                  <span className="sidebar-tooltip">{t('scanner', uiLang)}</span>
                </NavLink>

                <NavLink
                  to="/caregiver/prescription-scanner"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={t('prescriptions', uiLang)}
                >
                  <FileText size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">{t('prescriptions', uiLang)}</span>}
                  <span className="sidebar-tooltip">{t('prescriptions', uiLang)}</span>
                </NavLink>

                <NavLink
                  to="/caregiver/compare"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={t('comparator', uiLang)}
                >
                  <History size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">{t('comparator', uiLang)}</span>}
                  <span className="sidebar-tooltip">{t('comparator', uiLang)}</span>
                </NavLink>

                <NavLink
                  to="/library"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={t('library', uiLang)}
                >
                  <BookOpen size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">{t('library', uiLang)}</span>}
                  <span className="sidebar-tooltip">{t('library', uiLang)}</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/patient/dashboard"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title="My Dashboard"
                >
                  <Scan size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">My Dashboard</span>}
                  <span className="sidebar-tooltip">My Dashboard</span>
                </NavLink>

                <NavLink
                  to="/patient/medicine-cabinet"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title="My Medicines"
                >
                  <Pill size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">My Medicines</span>}
                  <span className="sidebar-tooltip">My Medicines</span>
                </NavLink>

                <NavLink
                  to="/patient/medicine-scanner"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title="Scan Medicine"
                >
                  <Scan size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">Scan Medicine</span>}
                  <span className="sidebar-tooltip">Scan Medicine</span>
                </NavLink>

                <NavLink
                  to="/patient/prescriptions"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title="My Prescriptions"
                >
                  <FileText size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">My Prescriptions</span>}
                  <span className="sidebar-tooltip">My Prescriptions</span>
                </NavLink>

                <NavLink
                  to="/library"
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  title={t('library', uiLang)}
                >
                  <BookOpen size={19} className="item-icon" />
                  {!isIconOnly && <span className="item-text">{t('library', uiLang)}</span>}
                  <span className="sidebar-tooltip">{t('library', uiLang)}</span>
                </NavLink>
              </>
            )}

            <NavLink
              to="/settings"
              className={({ isActive }) => `sidebar-item settings-item ${isActive ? 'active' : ''}`}
              title={t('settings', uiLang)}
            >
              <Settings size={19} className="item-icon" />
              {!isIconOnly && <span className="item-text">{t('settings', uiLang)}</span>}
              <span className="sidebar-tooltip">{t('settings', uiLang)}</span>
            </NavLink>
          </nav>
        </div>

        {/* Bottom Actions Section: ONLY Logout / Exit Button Pinned at Bottom */}
        {user && (
          <div className="sidebar-bottom-controls">
            <button
              className="sidebar-logout-btn"
              onClick={logout}
              title="Sign Out of CarePilot"
            >
              <LogOut size={18} />
              {!isIconOnly && <span className="logout-text">Sign Out</span>}
            </button>
          </div>
        )}
      </aside>

      <style>{`
        /* ── Mobile Top Header (< 640px) ── */
        .mobile-header {
          display: none;
          position: sticky; top: 0; z-index: 210;
          height: 56px; padding: 0 16px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          align-items: center; justify-content: space-between;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .mobile-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; }
        .brand-title { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
        .mobile-hamburger-btn {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          background: var(--surface-secondary); border: 1px solid var(--border);
          color: var(--text-primary); cursor: pointer;
        }
        .mobile-backdrop {
          position: fixed; inset: 0; z-index: 215;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
        }

        /* ── Sidebar Layout Container ── */
        .app-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 220;
          width: 260px; height: 100vh; height: 100dvh;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          box-shadow: 4px 0 24px rgba(0,0,0,0.06);
          transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        }
        .app-sidebar.collapsed { width: 78px; }

        /* ── Top Brand Header ── */
        .sidebar-brand-container {
          padding: 14px; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid var(--border); height: 64px; flex-shrink: 0;
        }
        .sidebar-brand-link { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-glow-wrap {
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.25s ease;
        }
        .sidebar-brand-link:hover .logo-glow-wrap {
          transform: scale(1.08) rotate(4deg);
          filter: drop-shadow(0 0 10px rgba(14,165,233,0.4));
        }
        .brand-text-block { display: flex; flex-direction: column; gap: 2px; }
        .brand-name { font-size: 1.15rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
        .role-pill {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 8px; width: fit-content;
        }
        .role-pill.caregiver { background: rgba(14,165,233,0.12); color: var(--accent); border: 1px solid rgba(14,165,233,0.25); }
        .role-pill.patient { background: rgba(45,212,191,0.12); color: #0d9488; border: 1px solid rgba(45,212,191,0.25); }
        .collapse-toggle-btn {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 8px;
          background: var(--surface-secondary); border: 1px solid var(--border);
          color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease;
        }
        .collapse-toggle-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }

        /* ── Top Controls Bar (Repositioned Theme & Language Dropdowns) ── */
        .sidebar-top-controls {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          position: relative; z-index: 50;
          background: var(--surface);
          flex-shrink: 0;
        }
        .controls-row {
          display: flex; align-items: center; gap: 8px; justify-content: center;
        }
        .dropdown-wrapper { flex: 1; display: flex; justify-content: center; }

        /* ── Nav Menu Container & Perspective ── */
        .sidebar-menu-perspective {
          flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 10px;
          perspective: 1000px; transform-style: preserve-3d;
          position: relative; z-index: 10;
        }
        .sidebar-nav-list { display: flex; flex-direction: column; gap: 6px; transform-style: preserve-3d; }

        .sidebar-item {
          position: relative;
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 14px;
          font-size: 0.88rem; font-weight: 600;
          color: var(--text-secondary); text-decoration: none;
          border: 1px solid transparent;
          transform-style: preserve-3d;
          transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .app-sidebar.collapsed .sidebar-item { justify-content: center; padding: 12px; }

        /* ── 3D Hover & Active Effects ── */
        .sidebar-item:hover {
          color: var(--text-primary);
          background: var(--surface-secondary);
          border-color: rgba(20, 184, 166, 0.35);
          transform: translateZ(12px) rotateX(4deg) scale(1.02);
          box-shadow: 0 10px 25px -5px rgba(20, 184, 166, 0.25);
        }
        .sidebar-item:hover .item-icon {
          color: var(--accent);
          transform: scale(1.15) rotate(-4deg);
          transition: transform 0.2s ease;
        }

        .sidebar-item.active {
          color: var(--accent);
          background: linear-gradient(135deg, rgba(14,165,233,0.14), rgba(45,212,191,0.08));
          border: 1.5px solid var(--accent);
          font-weight: 700;
          transform: translateZ(16px) scale(1.03);
          box-shadow: 0 12px 28px -4px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .sidebar-item.active .item-icon { color: var(--accent); }

        /* ── Hover Tooltip for Icon-only / Tablet view ── */
        .sidebar-tooltip { display: none; }
        .app-sidebar.collapsed .sidebar-item .sidebar-tooltip,
        @media (min-width: 640px) and (max-width: 1024px) {
          .sidebar-item .sidebar-tooltip {
            display: block;
            position: absolute;
            left: calc(100% + 12px);
            top: 50%;
            transform: translateY(-50%) scale(0.95);
            background: var(--surface-elevated);
            color: var(--text-primary);
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.78rem;
            font-weight: 600;
            white-space: nowrap;
            border: 1px solid var(--border);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.18s ease, transform 0.18s ease;
            z-index: 100;
          }
          .sidebar-item:hover .sidebar-tooltip {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        .settings-item { margin-top: 4px; }

        /* ── Bottom Controls: Pinned Logout Button ── */
        .sidebar-bottom-controls {
          margin-top: auto;
          padding: 14px; border-top: 1px solid var(--border);
          display: flex; flex-direction: column; flex-shrink: 0;
          background: var(--surface); position: relative; z-index: 20;
        }
        .sidebar-logout-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 10px 14px; border-radius: 12px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          color: var(--danger); font-family: inherit; font-size: 0.85rem; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
        }
        .sidebar-logout-btn:hover { background: var(--danger); color: #fff; }
        .app-sidebar.collapsed .sidebar-logout-btn { padding: 10px; justify-content: center; }

        /* ── Responsive Breakpoints ── */
        /* Mobile (< 640px): Hide sidebar by default, use drawer */
        @media (max-width: 639px) {
          .mobile-header { display: flex; }
          .collapse-toggle-btn { display: none; }
          .app-sidebar {
            top: 56px; width: 280px; height: calc(100vh - 56px); height: calc(100dvh - 56px);
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            box-shadow: 8px 0 32px rgba(0,0,0,0.2);
          }
          .app-sidebar.mobile-open { transform: translateX(0); }
        }

        /* Tablet (640px - 1024px): Collapsed Icon-only Sidebar */
        @media (min-width: 640px) and (max-width: 1024px) {
          .mobile-header { display: none; }
          .collapse-toggle-btn { display: none; }
          .app-sidebar {
            width: 78px !important;
            transform: translateX(0) !important;
          }
          .sidebar-item { justify-content: center; padding: 12px; }
          .dropdown-wrapper { flex: initial; }
        }

        /* Desktop (> 1024px): Full or Expandable Sidebar */
        @media (min-width: 1025px) {
          .mobile-header { display: none; }
          .app-sidebar { transform: translateX(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .app-sidebar, .sidebar-item, .sidebar-item:hover, .sidebar-item.active {
            transform: none !important;
            transition: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  )
}
