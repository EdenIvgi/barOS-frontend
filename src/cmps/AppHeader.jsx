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
  const avatarRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false)
        setIsSwitchModalOpen(false)
      }
    }
    if (isUserDropdownOpen || isSwitchModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isUserDropdownOpen, isSwitchModalOpen])

  function getInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  function toggleLanguage() {
    const currentLang = i18n.resolvedLanguage || 'en'
    const nextLang = currentLang === 'en' ? 'he' : 'en'
    i18n.changeLanguage(nextLang)
  }

  function getLanguageLabel() {
    const currentLang = i18n.resolvedLanguage || 'en'
    return currentLang === 'en' ? 'EN' : 'HE'
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
          <NavLink to="/home" className="nav-link" onClick={closeMenu}>{t('home')}</NavLink>
          <NavLink to="/products" className="nav-link" onClick={closeMenu}>{t('products')}</NavLink>
          <NavLink to="/bar-book" className="nav-link" onClick={closeMenu}>{t('barBook')}</NavLink>
          <NavLink to="/orders" className="nav-link" onClick={closeMenu}>{t('orders')}</NavLink>
          <NavLink to="/items-management" className="nav-link" onClick={closeMenu}>{t('itemsManagement')}</NavLink>
          <NavLink to="/about" className="nav-link" onClick={closeMenu}>{t('about')}</NavLink>
          <button
            className="nav-language-toggle"
            onClick={() => { toggleLanguage(); closeMenu() }}
            title={t('toggleLanguage')}
          >
            {t('toggleLanguage')}: {getLanguageLabel()}
          </button>
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
          <button
            className="language-toggle-btn"
            onClick={toggleLanguage}
            title={t('toggleLanguage')}
          >
            {getLanguageLabel()}
          </button>
        </div>

        {isMenuOpen && <div className="nav-overlay" onClick={closeMenu} />}
      </div>
    </header>
    </>
  )
}
