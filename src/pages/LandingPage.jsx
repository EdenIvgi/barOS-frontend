import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login, signup } from '../store/actions/user.actions'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { AnimatedBackground } from '../cmps/AnimatedBackground'

// Client-side company name validation — mirrors the backend sanitise logic
function validateCompanyName(name) {
  if (!name || !name.trim()) return false
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
  return sanitized.length > 0
}

export function LandingPage() {
  const { t, i18n } = useTranslation()
  const user = useSelector(state => state.userModule.loggedInUser)
  const navigate = useNavigate()

  const [isSignup, setIsSignup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '', fullname: '', companyName: '', inviteCode: '' })
  const [companyError, setCompanyError] = useState(false)

  useEffect(() => {
    if (user) navigate('/home')
  }, [user, navigate])

  function handleChange({ target }) {
    const { name, value } = target
    setCredentials(prev => ({ ...prev, [name]: value }))
    if (name === 'companyName') setCompanyError(false)
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    if (isSignup && !validateCompanyName(credentials.companyName)) {
      setCompanyError(true)
      return
    }
    setIsLoading(true)
    try {
      if (isSignup) {
        await signup(credentials)
        showSuccessMsg(t('welcomeMsg'))
      } else {
        await login(credentials)
        showSuccessMsg(t('welcomeMsg'))
      }
      navigate('/home')
    } catch (err) {
      // Surface the server's own message (e.g. "Username already exists") when there
      // is one — the generic fallback hides the actual reason from the user.
      showErrorMsg(err?.response?.data?.error || t('loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  function toggleLanguage() {
    const currentLang = i18n.resolvedLanguage || 'en'
    i18n.changeLanguage(currentLang === 'en' ? 'he' : 'en')
  }

  const isHe = (i18n.resolvedLanguage || 'en') === 'he'

  return (
    <section className="landing-page" dir={isHe ? 'rtl' : 'ltr'}>
      <AnimatedBackground />

      <button className="landing-lang-btn" onClick={toggleLanguage}>
        {isHe ? 'EN' : 'HE'}
      </button>

      <div className="landing-center">

        {/* Hero */}
        <div className="landing-hero">
          <div className="landing-logo-wrap">
            <svg className="landing-logo-icon" viewBox="0 0 100 140" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M15 12 L50 58 L85 12" strokeLinecap="round" strokeLinejoin="round" />
              <ellipse cx="50" cy="12" rx="35" ry="6" />
              <line x1="50" y1="58" x2="50" y2="115" />
              <ellipse cx="50" cy="115" rx="22" ry="5" />
              <line x1="28" y1="115" x2="72" y2="115" strokeLinecap="round" strokeWidth="1.5" />
              <circle cx="38" cy="28" r="5" strokeWidth="1" />
              <line x1="38" y1="23" x2="38" y2="15" strokeWidth="0.8" />
            </svg>
            <h1 className="landing-app-name">BarOS</h1>
          </div>
          <p className="landing-tagline">{t('landingTagline')}</p>
        </div>

        {/* Auth card */}
        <div className="landing-auth-card">
          <p className="auth-mode-label">
            {isSignup ? t('landingSignupTitle') : t('landingLoginTitle')}
          </p>

          <form className="landing-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="form-field">
                <input
                  id="l-fullname"
                  type="text"
                  name="fullname"
                  value={credentials.fullname}
                  onChange={handleChange}
                  placeholder={t('fullnamePlaceholder')}
                  required
                />
              </div>
            )}

            <div className="form-field">
              <input
                id="l-username"
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder={t('usernamePlaceholder')}
                autoFocus
                required
              />
            </div>

            <div className="form-field">
              <input
                id="l-password"
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder={t('passwordPlaceholder')}
                required
              />
            </div>

            {isSignup && (
              <div className={`form-field company-field${companyError ? ' has-error' : ''}`}>
                <input
                  id="l-company"
                  type="text"
                  name="companyName"
                  value={credentials.companyName}
                  onChange={handleChange}
                  placeholder={t('companyNamePlaceholder')}
                  required
                />
                {companyError
                  ? <span className="field-error">{t('companyNameError')}</span>
                  : <span className="field-hint">{t('companyNameHelp')}</span>
                }
              </div>
            )}

            {isSignup && (
              <div className="form-field">
                <input
                  id="l-invite"
                  type="text"
                  name="inviteCode"
                  value={credentials.inviteCode}
                  onChange={handleChange}
                  placeholder={t('inviteCodePlaceholder')}
                  autoComplete="off"
                />
                <span className="field-hint">{t('inviteCodeHelp')}</span>
              </div>
            )}

            <button type="submit" className="landing-submit-btn" disabled={isLoading}>
              {isLoading ? t('loading') : isSignup ? t('landingSignupBtn') : t('landingLoginBtn')}
            </button>
          </form>

          <button
            type="button"
            className="landing-toggle-btn"
            onClick={() => {
              setIsSignup(p => !p)
              setCredentials({ username: '', password: '', fullname: '', companyName: '', inviteCode: '' })
              setCompanyError(false)
            }}
          >
            {isSignup ? t('alreadyMember') : t('newUser')}
          </button>
        </div>

        {/* Feature pills */}
        <div className="landing-pills">
          <span>{t('featureInventoryTitle')}</span>
          <span className="pill-dot" aria-hidden="true" />
          <span>{t('featureOrdersTitle')}</span>
          <span className="pill-dot" aria-hidden="true" />
          <span>{t('featureBarBookTitle')}</span>
          <span className="pill-dot" aria-hidden="true" />
          <span>{t('featureDashboardTitle')}</span>
        </div>

      </div>
    </section>
  )
}
