import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, UserCheck, HeartHandshake, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { CarePilotIcon } from '../components/CarePilotIcon'
import { firebaseSendPasswordResetEmail, auth as firebaseAuth } from '../services/firebaseService'
import type { UserRole } from '../types'

export function LoginPage() {
  const { login, signup } = useAuth()
  const { uiLang } = useApp()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [role, setRole] = useState<UserRole>('caregiver')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotModal, setForgotModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const handleDemoLogin = async (targetRole: UserRole) => {
    setLoading(true)
    setError(null)
    try {
      const demoEmail = targetRole === 'caregiver' ? 'lakshmi@carepilot.org' : 'meenakshi@carepilot.org'
      await login(demoEmail, targetRole)
      navigate(targetRole === 'caregiver' ? '/caregiver/dashboard' : '/patient/dashboard')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter a valid email address.')
      return
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(email.trim(), role)
      } else {
        await signup(name.trim(), email.trim(), role)
      }
      navigate(role === 'caregiver' ? '/caregiver/dashboard' : '/patient/dashboard')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) return
    try {
      if (firebaseAuth) {
        await firebaseSendPasswordResetEmail(firebaseAuth, resetEmail.trim())
      }
      setSuccessMsg(`Password reset link sent to ${resetEmail.trim()}`)
      setForgotModal(false)
      setResetEmail('')
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="login-root">
      <div className="login-card glass-card">
        <div className="login-header">
          <CarePilotIcon size={56} />
          <h1 className="login-title">CarePilot</h1>
          <p className="login-tagline">{t('appTagline', uiLang)}</p>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="login-demo-box">
          <p className="login-demo-label">⚡ Fast Demo Logins:</p>
          <div className="login-demo-grid">
            <button
              type="button"
              className="login-demo-btn caregiver"
              onClick={() => handleDemoLogin('caregiver')}
              disabled={loading}
            >
              <HeartHandshake size={18} />
              <span>Caregiver Demo</span>
            </button>
            <button
              type="button"
              className="login-demo-btn patient"
              onClick={() => handleDemoLogin('patient')}
              disabled={loading}
            >
              <UserCheck size={18} />
              <span>Patient Demo</span>
            </button>
          </div>
        </div>

        <div className="login-divider">
          <span>or sign in with email</span>
        </div>

        {error && <div className="login-error">{error}</div>}
        {successMsg && <div className="login-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-role-selector">
            <button
              type="button"
              className={`role-tab ${role === 'caregiver' ? 'active' : ''}`}
              onClick={() => setRole('caregiver')}
            >
              <HeartHandshake size={16} />
              <span>{t('caregiverRole', uiLang)}</span>
            </button>
            <button
              type="button"
              className={`role-tab ${role === 'patient' ? 'active' : ''}`}
              onClick={() => setRole('patient')}
            >
              <UserCheck size={16} />
              <span>{t('patientRole', uiLang)}</span>
            </button>
          </div>

          {mode === 'signup' && (
            <div className="field-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Lakshmi Narayanan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="field-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="e.g. lakshmi@carepilot.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <div className="label-row">
              <label><Lock size={13} /> Password</label>
              {mode === 'login' && (
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setForgotModal(true)}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            <span>{mode === 'login' ? t('login', uiLang) : t('signup', uiLang)}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="login-footer-toggle">
          {mode === 'login' ? (
            <p>
              New to CarePilot?{' '}
              <Link to="/signup" className="register-link">
                {t('signup', uiLang)}
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')}>
                {t('login', uiLang)}
              </button>
            </p>
          )}
        </div>

        {/* Forgot Password Modal */}
        {forgotModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Reset Password</h3>
              <p className="modal-sub">Enter your account email to receive a password reset link.</p>
              <form onSubmit={handleForgotSubmit} className="modal-form">
                <div className="field-group">
                  <label>Account Email</label>
                  <input
                    type="email"
                    placeholder="e.g. lakshmi@carepilot.org"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setForgotModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    Send Reset Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="login-disclaimer">
          <Shield size={14} />
          <span>{t('disclaimer', uiLang)}</span>
        </div>
      </div>

      <style>{`
        .login-root { display:flex;align-items:center;justify-content:center;min-height:calc(100dvh - 60px);padding:20px; }
        .login-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px 28px;width:100%;max-width:440px;box-shadow:0 8px 32px rgba(0,0,0,0.12);display:flex;flex-direction:column;gap:20px; }
        .login-header { text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px; }
        .login-title { font-size:1.6rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.03em; }
        .login-tagline { font-size:0.85rem;color:var(--text-muted); }
        .login-demo-box { background:var(--surface-secondary);border:1px solid var(--border);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px; }
        .login-demo-label { font-size:0.78rem;font-weight:600;color:var(--text-secondary); }
        .login-demo-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
        .login-demo-btn { display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 14px;border:none;border-radius:10px;font-family:inherit;font-size:0.82rem;font-weight:600;cursor:pointer;transition:transform 0.15s,opacity 0.15s; }
        .login-demo-btn.caregiver { background:rgba(14,165,233,0.15);color:var(--accent);border:1px solid rgba(14,165,233,0.3); }
        .login-demo-btn.patient { background:rgba(45,212,191,0.15);color:#0d9488;border:1px solid rgba(45,212,191,0.3); }
        .login-demo-btn:hover { transform:translateY(-1px);opacity:0.9; }
        .login-divider { display:flex;align-items:center;text-align:center;color:var(--text-muted);font-size:0.75rem;margin:2px 0; }
        .login-divider::before,.login-divider::after { content:'';flex:1;border-bottom:1px solid var(--border); }
        .login-divider span { padding:0 10px; }
        .login-error { padding:10px 14px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:10px;font-size:0.8rem;color:var(--danger); }
        .login-success { padding:10px 14px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:10px;font-size:0.8rem;color:var(--success); }
        .login-form { display:flex;flex-direction:column;gap:14px; }
        .login-role-selector { display:grid;grid-template-columns:1fr 1fr;background:var(--surface-secondary);padding:4px;border-radius:12px;gap:4px;border:1px solid var(--border); }
        .role-tab { display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 12px;border:none;border-radius:9px;font-family:inherit;font-size:0.82rem;font-weight:600;color:var(--text-muted);background:transparent;cursor:pointer;transition:all 0.15s; }
        .role-tab.active { background:var(--surface);color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        .field-group { display:flex;flex-direction:column;gap:5px; }
        .label-row { display:flex;align-items:center;justify-content:space-between; }
        .forgot-link { font-size:0.75rem;color:var(--accent);font-weight:600;background:none;border:none;cursor:pointer;padding:0; }
        .field-group label { font-size:0.78rem;font-weight:600;color:var(--text-secondary);display:flex;align-items:center;gap:4px; }
        .field-group input { padding:11px 14px;background:var(--input-background);border:1px solid var(--input-border);border-radius:10px;font-family:inherit;font-size:0.88rem;color:var(--text-primary);outline:none; }
        .field-group input:focus { border-color:var(--accent); }
        .password-input-wrap { position:relative;display:flex;align-items:center; }
        .password-input-wrap input { width:100%;padding-right:40px; }
        .eye-toggle { position:absolute;right:10px;background:none;border:none;color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:4px; }
        .login-submit-btn { display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:12px;font-family:inherit;font-size:0.9rem;font-weight:700;cursor:pointer;transition:background 0.15s,transform 0.15s;margin-top:4px; }
        .login-submit-btn:hover { background:var(--accent-hover);transform:translateY(-1px); }
        .login-footer-toggle { text-align:center;font-size:0.8rem;color:var(--text-secondary); }
        .login-footer-toggle button, .register-link { color:var(--accent);font-weight:700;text-decoration:none;margin-left:4px; }
        .login-disclaimer { display:flex;align-items:center;gap:8px;font-size:0.72rem;color:var(--text-muted);line-height:1.4;background:var(--surface-secondary);padding:8px 12px;border-radius:8px; }
        .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:300;backdrop-filter:blur(4px); }
        .modal-card { background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;width:100%;max-width:400px;display:flex;flex-direction:column;gap:12px;box-shadow:0 12px 36px rgba(0,0,0,0.2); }
        .modal-sub { font-size:0.8rem;color:var(--text-muted); }
        .modal-form { display:flex;flex-direction:column;gap:12px; }
        .modal-actions { display:flex;justify-content:flex-end;gap:10px;margin-top:6px; }
        .btn-cancel { padding:9px 16px;background:var(--surface-secondary);border:1px solid var(--border);border-radius:10px;font-family:inherit;font-size:0.85rem;font-weight:600;color:var(--text-secondary);cursor:pointer; }
        .btn-save { padding:9px 18px;background:var(--accent);border:none;border-radius:10px;font-family:inherit;font-size:0.85rem;font-weight:600;color:#fff;cursor:pointer; }
      `}</style>
    </div>
  )
}
