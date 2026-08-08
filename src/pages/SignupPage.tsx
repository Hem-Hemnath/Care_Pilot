import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, UserCheck, HeartHandshake, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { CarePilotIcon } from '../components/CarePilotIcon'
import type { UserRole } from '../types'

export function SignupPage() {
  const { signup } = useAuth()
  const { uiLang } = useApp()
  const navigate = useNavigate()

  const [role, setRole] = useState<UserRole>('caregiver')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await signup(name.trim(), email.trim(), role)
      navigate(role === 'caregiver' ? '/caregiver/dashboard' : '/patient/dashboard')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-root">
      <div className="signup-card">
        <div className="signup-header">
          <CarePilotIcon size={52} />
          <h1 className="signup-title">{t('signup', uiLang)}</h1>
          <p className="signup-sub">Create your CarePilot account to organize and protect your medication schedules.</p>
        </div>

        {error && <div className="signup-error">{error}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="role-selector-block">
            <label className="block-label">I am registering as a...</label>
            <div className="role-grid">
              <button
                type="button"
                className={`role-option-card ${role === 'caregiver' ? 'selected' : ''}`}
                onClick={() => setRole('caregiver')}
              >
                <HeartHandshake size={24} />
                <div className="role-option-text">
                  <strong>{t('caregiverRole', uiLang)}</strong>
                  <span>Manage family or patient medications & safety alerts</span>
                </div>
              </button>

              <button
                type="button"
                className={`role-option-card ${role === 'patient' ? 'selected' : ''}`}
                onClick={() => setRole('patient')}
              >
                <UserCheck size={24} />
                <div className="role-option-text">
                  <strong>{t('patientRole', uiLang)}</strong>
                  <span>View my medication schedule & ask questions</span>
                </div>
              </button>
            </div>
          </div>

          <div className="field-group">
            <label><UserIcon size={14} /> Full Name</label>
            <input
              type="text"
              placeholder="e.g. Lakshmi Narayanan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label><Mail size={14} /> Email Address</label>
            <input
              type="email"
              placeholder="e.g. lakshmi@carepilot.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="field-group">
              <label><Lock size={14} /> Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label><Lock size={14} /> Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="signup-submit-btn" disabled={loading}>
            <span>{loading ? 'Creating Account...' : t('signup', uiLang)}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have a CarePilot account?{' '}
            <Link to="/login" className="login-link">
              {t('login', uiLang)}
            </Link>
          </p>
        </div>

        <div className="security-notice">
          <Shield size={14} />
          <span>CarePilot encrypted security — strictly protects patient privacy.</span>
        </div>
      </div>

      <style>{`
        .signup-root { display:flex;align-items:center;justify-content:center;min-height:calc(100dvh - 60px);padding:24px 20px; }
        .signup-card { background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:32px 28px;width:100%;max-width:480px;box-shadow:0 12px 36px rgba(0,0,0,0.12);display:flex;flex-direction:column;gap:20px;backdrop-filter:blur(10px); }
        .signup-header { text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px; }
        .signup-title { font-size:1.6rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.03em; }
        .signup-sub { font-size:0.85rem;color:var(--text-muted);line-height:1.4; }
        .signup-error { padding:10px 14px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:10px;font-size:0.82rem;color:var(--danger); }
        .signup-form { display:flex;flex-direction:column;gap:16px; }
        .role-selector-block { display:flex;flex-direction:column;gap:8px; }
        .block-label { font-size:0.8rem;font-weight:700;color:var(--text-secondary); }
        .role-grid { display:flex;flex-direction:column;gap:10px; }
        .role-option-card { display:flex;align-items:flex-start;gap:12px;padding:12px 14px;background:var(--surface-secondary);border:1.5px solid var(--border);border-radius:14px;cursor:pointer;text-align:left;transition:all 0.15s;font-family:inherit; }
        .role-option-card.selected { border-color:var(--accent);background:rgba(14,165,233,0.1);color:var(--accent); }
        .role-option-text { display:flex;flex-direction:column;gap:2px; }
        .role-option-text strong { font-size:0.9rem;color:var(--text-primary); }
        .role-option-text span { font-size:0.75rem;color:var(--text-muted); }
        .field-group { display:flex;flex-direction:column;gap:5px; }
        .field-group label { font-size:0.78rem;font-weight:600;color:var(--text-secondary);display:flex;align-items:center;gap:5px; }
        .field-group input { padding:11px 14px;background:var(--input-background);border:1px solid var(--input-border);border-radius:12px;font-family:inherit;font-size:0.88rem;color:var(--text-primary);outline:none; }
        .field-group input:focus { border-color:var(--accent); }
        .form-row { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
        .signup-submit-btn { display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;background:var(--accent);color:#fff;border:none;border-radius:14px;font-family:inherit;font-size:0.92rem;font-weight:700;cursor:pointer;transition:background 0.15s,transform 0.15s;margin-top:6px; }
        .signup-submit-btn:hover { background:var(--accent-hover);transform:translateY(-1px); }
        .signup-footer { text-align:center;font-size:0.82rem;color:var(--text-secondary); }
        .login-link { color:var(--accent);font-weight:700;text-decoration:none;margin-left:4px; }
        .security-notice { display:flex;align-items:center;gap:8px;font-size:0.72rem;color:var(--text-muted);background:var(--surface-secondary);padding:8px 12px;border-radius:8px; }
      `}</style>
    </div>
  )
}
