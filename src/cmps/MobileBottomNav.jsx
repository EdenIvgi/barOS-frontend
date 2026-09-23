import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom'
import { NAV_ITEMS, IconProfile, IconAbout, IconMore } from './icons'

// The rail shows five destinations; the phone shows the first four and folds the
// rest behind "more", so both draw the same glyphs in the same order.
const PRIMARY = NAV_ITEMS.slice(0, 4)
const SECONDARY = NAV_ITEMS.slice(4)

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
          {SECONDARY.map(({ to, labelKey, Icon }) => (
            <button key={to} type="button" className="more-menu-item" onClick={() => goTo(to)}>
              <Icon />
              <span>{t(labelKey)}</span>
            </button>
          ))}
          <button type="button" className="more-menu-item" onClick={() => goTo('/user')}>
            <IconProfile />
            <span>{t('profileNavLink')}</span>
          </button>
          <button type="button" className="more-menu-item" onClick={() => goTo('/about')}>
            <IconAbout />
            <span>{t('about')}</span>
          </button>
        </div>
      )}

      <nav className="mobile-bottom-nav">
        {PRIMARY.map(({ to, labelKey, Icon }) => (
          <NavLink key={to} to={to} className="bottom-nav-item">
            <Icon />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className={`bottom-nav-item bottom-nav-more${isMoreOpen ? ' active' : ''}`}
          onClick={() => setIsMoreOpen(prev => !prev)}
        >
          <IconMore />
          <span>{t('more')}</span>
        </button>
      </nav>
    </>
  )
}
