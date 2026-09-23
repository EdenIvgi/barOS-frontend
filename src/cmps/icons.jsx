/**
 * One icon set for the whole app. The rail and the phone's bottom nav draw the
 * same glyphs, so a screen looks like the same product on both.
 * Size and colour come from CSS; every icon inherits currentColor.
 */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

export const IconHome = () => (
  <svg {...base}>
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21v-9h6v9" />
  </svg>
)

export const IconStock = () => (
  <svg {...base}>
    <path d="M4 6h16M4 12h16M4 18h16" />
    <path d="M8 4v4M16 10v4M12 16v4" />
  </svg>
)

export const IconProducts = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

export const IconOrders = () => (
  <svg {...base}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </svg>
)

export const IconBarBook = () => (
  <svg {...base}>
    <path d="M4 2h12l4 4v16H4V2z" />
    <path d="M4 6h12M4 10h12M4 14h8" />
    <path d="M16 2v4h4" />
  </svg>
)

export const IconProfile = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

export const IconAbout = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8h.01M11 12h1v4h1" />
  </svg>
)

export const IconMore = () => (
  <svg {...base}>
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </svg>
)

export const IconLogout = () => (
  <svg {...base}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h11" />
  </svg>
)

export const IconMinus = () => (
  <svg {...base} strokeWidth="2.2"><path d="M5 12h14" /></svg>
)

export const IconPlus = () => (
  <svg {...base} strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
)

/** Navigation shared by the rail and the bottom nav, in one order. */
export const NAV_ITEMS = [
  { to: '/home', labelKey: 'home', Icon: IconHome },
  { to: '/items-management', labelKey: 'navItemsMgmt', Icon: IconStock },
  { to: '/orders', labelKey: 'orders', Icon: IconOrders },
  { to: '/bar-book', labelKey: 'barBook', Icon: IconBarBook },
  { to: '/products', labelKey: 'products', Icon: IconProducts },
]
