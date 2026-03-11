import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { logout } from '../store/actions/user.actions'
import { CartIcon } from './CartIcon'
import { SwitchUserModal } from './SwitchUserModal'

export function AppHeader() {
  const user = useSelector(storeState => storeState.userModule.loggedInUser)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false)
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const avatarRef = useRef(null)
  const langRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false)
        setIsSwitchModalOpen(false)
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setIsLangDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function getInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  function setLanguage(lang) {
    i18n.changeLanguage(lang)
    setIsLangDropdownOpen(false)
  }

  function getCurrentLang() {
    return i18n.resolvedLanguage || 'en'
  }

  async function onLogout() {
    try {
      await logout()
      showSuccessMsg(t('logoutSuccess'))
      navigate('/')
    } catch (error) {
      showErrorMsg('OOPs try again')
    }
  }

  function closeMenu() {
    setIsMenuOpen(false)
  }

  return (
    <>
    <header className="app-header">
      <div className="header-content">
        <button
          className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <NavLink to="/home" className="header-brand">
          <span className="logo">BarOS</span>
        </NavLink>

        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          <NavLink to="/home" className="nav-link" onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="1"/><path d="M8 21h8M12 17v4"/></svg>
            {t('home')}
          </NavLink>
          <NavLink to="/products" className="nav-link" onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M12 3v10M3 8l9 5M21 8l-9 5"/></svg>
            {t('products')}
          </NavLink>
          <NavLink to="/bar-book" className="nav-link" onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2h12l4 4v16H4V2z"/><path d="M4 6h12M4 10h12M4 14h8"/><path d="M16 2v4h4"/></svg>
            {t('barBook')}
          </NavLink>
          <NavLink to="/orders" className="nav-link" onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
            {t('orders')}
          </NavLink>
          <NavLink to="/items-management" className="nav-link" onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/><path d="M8 4v4M16 10v4M12 16v4"/></svg>
            {t('itemsManagement')}
          </NavLink>
          <NavLink to="/about" className="nav-link" onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="1"/><path d="M8 21h8M12 17v4M6 8l3 2.5L6 13"/></svg>
            {t('about')}
          </NavLink>
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="user-avatar-wrapper" ref={avatarRef}>
              <button
                className="user-avatar-btn"
                onClick={() => { setIsUserDropdownOpen(prev => !prev); setIsSwitchModalOpen(false) }}
                title={user.fullname}
              >
                {getInitials(user.fullname)}
              </button>
              {(user.companyDisplayName || user.companyName) && (
                <span className="header-company-name">{user.companyDisplayName || user.companyName}</span>
              )}
              {isUserDropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span className="user-dropdown-name">{user.fullname}</span>
                    {(user.companyDisplayName || user.companyName) && (
                      <span className="user-dropdown-company">{user.companyDisplayName || user.companyName}</span>
                    )}
                  </div>
                  <Link to="/user" className="user-dropdown-link" onClick={() => setIsUserDropdownOpen(false)}>
                    {t('profileNavLink')}
                  </Link>
                  <button className="user-dropdown-switch" onClick={() => { setIsUserDropdownOpen(false); setIsSwitchModalOpen(true) }}>
                    {t('switchUser')}
                  </button>
                  <button className="user-dropdown-logout" onClick={() => { setIsUserDropdownOpen(false); onLogout() }}>
                    {t('logout')}
                  </button>
                </div>
              )}
              {isSwitchModalOpen && (
                <SwitchUserModal onClose={() => setIsSwitchModalOpen(false)} />
              )}
            </div>
          ) : (
            <Link to="/" className="header-login-link">{t('landingLoginBtn')}</Link>
          )}
          <CartIcon />
          <div className="lang-picker" ref={langRef}>
            <button
              className="lang-picker-btn"
              onClick={() => setIsLangDropdownOpen(prev => !prev)}
              title={t('toggleLanguage')}
              aria-expanded={isLangDropdownOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
              </svg>
            </button>
            {isLangDropdownOpen && (
              <div className="lang-dropdown">
                <button
                  className={`lang-option${getCurrentLang() === 'en' ? ' active' : ''}`}
                  onClick={() => setLanguage('en')}
                >EN</button>
                <button
                  className={`lang-option${getCurrentLang() === 'he' ? ' active' : ''}`}
                  onClick={() => setLanguage('he')}
                >HE</button>
              </div>
            )}
          </div>
        </div>

        {isMenuOpen && <div className="nav-overlay" onClick={closeMenu} />}
      </div>
    </header>
    </>
  )
}
