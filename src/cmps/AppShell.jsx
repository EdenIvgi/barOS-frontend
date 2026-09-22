import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { logout } from '../store/actions/user.actions'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'

const IconHome = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V21H3z" /></svg>
)
const IconStock = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
)
const IconProducts = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
const IconOrders = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16l-7-3-7 3z" /></svg>
)
const IconBarBook = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3z" /><path d="M5 4v16" />
  </svg>
)

const NAV = [
  { to: '/home', labelKey: 'home', Icon: IconHome },
  { to: '/items-management', labelKey: 'navItemsMgmt', Icon: IconStock },
  { to: '/products', labelKey: 'products', Icon: IconProducts },
  { to: '/orders', labelKey: 'orders', Icon: IconOrders },
  { to: '/bar-book', labelKey: 'barBook', Icon: IconBarBook },
]

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

        {NAV.map(({ to, labelKey, Icon }) => (
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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h11" />
          </svg>
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
