import { useTranslation } from 'react-i18next'
import { AppShell } from '../cmps/AppShell'
import { Link } from 'react-router-dom'

const FEATURES = [
  {
    key: 'inventory',
    link: '/items-management',
    titleKey: 'aboutInventoryTitle',
    descKey: 'aboutInventoryDesc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  {
    key: 'orders',
    link: '/orders',
    titleKey: 'aboutOrdersTitle',
    descKey: 'aboutOrdersDesc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    key: 'barbook',
    link: '/bar-book',
    titleKey: 'aboutBarBookTitle',
    descKey: 'aboutBarBookDesc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="15" y2="11" />
        <line x1="9" y1="15" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    key: 'dashboard',
    link: '/home',
    titleKey: 'aboutDashboardTitle',
    descKey: 'aboutDashboardDesc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
]

export function About() {
  const { t } = useTranslation()

  return (
    <AppShell title={t('about')}>
    <div className="about-page">

      {/* ── Hero ── */}
      <div className="about-hero">
        <div className="about-logo">BarOS</div>
        <h1 className="about-title">{t('aboutTagline')}</h1>
        <p className="about-subtitle">{t('aboutSubtitle')}</p>
      </div>

      {/* ── Features header ── */}
      <div className="about-section-label">
        <span>{t('aboutFeaturesTitle')}</span>
      </div>

      {/* ── Features grid ── */}
      <div className="about-features-grid">
        {FEATURES.map(f => (
          <Link key={f.key} to={f.link} className="about-feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h2 className="feature-title">{t(f.titleKey)}</h2>
            <p className="feature-desc">{t(f.descKey)}</p>
          </Link>
        ))}
      </div>

      {/* ── Description ── */}
      <div className="about-description">
        <p>{t('aboutDescription')}</p>
      </div>

      {/* ── Footer meta ── */}
      <div className="about-meta">
        <span className="about-tech">{t('aboutDescription2')}</span>
        <span className="about-version">{t('aboutVersion')}</span>
      </div>

    </div>
    </AppShell>
  )
}
