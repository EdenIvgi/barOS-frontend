import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { logout } from '../store/actions/user.actions'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { NAV_ITEMS, IconLogout } from './icons'


function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * The persistent frame every page sits inside: an icon rail plus a topbar.
 * Pages supply their own title and actions and render their content as children.
 */
export function AppShell({ title, subtitle, actions, children, flush = false }) {
  const { t } = useTranslation()
  const user = useSelector(state => state.userModule.loggedInUser)
  const navigate = useNavigate()

  async function onLogout() {
    try {
      await logout()
      showSuccessMsg(t('logoutSuccess'))
      navigate('/')
    } catch {
      showErrorMsg(t('loginError'))
    }
  }

  return (
    <div className="app-shell">
      <nav className="rail" aria-label={t('openSidebar')}>
        <NavLink to="/home" className="rail-mark" aria-label="BarOS">B</NavLink>

        {NAV_ITEMS.map(({ to, labelKey, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => 'rail-item' + (isActive ? ' is-active' : '')}
            title={t(labelKey)}
          >
            <Icon />
            <span className="sr-only">{t(labelKey)}</span>
          </NavLink>
        ))}

        <div className="rail-spacer" />

        <NavLink to="/user" className="rail-avatar" title={user?.fullname || ''}>
          {initials(user?.fullname)}
        </NavLink>
        <button type="button" className="rail-item rail-logout" onClick={onLogout} title={t('logout')}>
          <IconLogout />
          <span className="sr-only">{t('logout')}</span>
        </button>
      </nav>

      <div className="shell-main">
        <header className="topbar">
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <span className="topbar-sub">{subtitle}</span>}
          <div className="topbar-spacer" />
          {actions}
        </header>
        <div className={'shell-content' + (flush ? ' is-flush' : '')}>
          {children}
        </div>
      </div>
    </div>
  )
}
