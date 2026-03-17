import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'

export function MobileBottomNav() {
  const { t } = useTranslation()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const navigate = useNavigate()

  function goTo(path) {
    setIsMoreOpen(false)
    navigate(path)
  }

  return (
    <>
      {isMoreOpen && (
        <div className="more-menu-overlay" onClick={() => setIsMoreOpen(false)} />
      )}

      {isMoreOpen && (
        <div className="more-menu">
          <button className="more-menu-item" onClick={() => goTo('/user')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <span>{t('profileNavLink')}</span>
          </button>

          <button className="more-menu-item" onClick={() => goTo('/products')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/>
              <path d="M12 3v10M3 8l9 5M21 8l-9 5"/>
            </svg>
            <span>{t('products')}</span>
          </button>

          <button className="more-menu-item" onClick={() => goTo('/about')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8h.01M11 12h1v4h1"/>
            </svg>
            <span>{t('about')}</span>
          </button>
        </div>
      )}

      <nav className="mobile-bottom-nav">
        <NavLink to="/home" className="bottom-nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
          </svg>
          <span>{t('home')}</span>
        </NavLink>

        <NavLink to="/items-management" className="bottom-nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
            <path d="M8 4v4M16 10v4M12 16v4"/>
          </svg>
          <span>{t('navItemsMgmt')}</span>
        </NavLink>

        <NavLink to="/bar-book" className="bottom-nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2h12l4 4v16H4V2z"/>
            <path d="M4 6h12M4 10h12M4 14h8"/>
            <path d="M16 2v4h4"/>
          </svg>
          <span>{t('barBook')}</span>
        </NavLink>

        <NavLink to="/orders" className="bottom-nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 12h6M9 16h4"/>
          </svg>
          <span>{t('orders')}</span>
        </NavLink>

        <button
          className={`bottom-nav-item bottom-nav-more${isMoreOpen ? ' active' : ''}`}
          onClick={() => setIsMoreOpen(prev => !prev)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="12" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="19" cy="12" r="1.5"/>
          </svg>
          <span>{t('more')}</span>
        </button>
      </nav>
    </>
  )
}
