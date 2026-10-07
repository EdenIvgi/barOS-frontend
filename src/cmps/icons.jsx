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

export const IconFilter = () => (
  <svg {...base}>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </svg>
)

export const IconMinus = () => (
  <svg {...base} strokeWidth="2.2"><path d="M5 12h14" /></svg>
)

export const IconPlus = () => (
  <svg {...base} strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
)

// ─── Theme ──────────────────────────────────────────────

export const IconSun = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
  </svg>
)

export const IconMoon = () => (
  <svg {...base}>
    <path d="M20 13.5A8 8 0 0 1 10.5 4a8 8 0 1 0 9.5 9.5z" />
  </svg>
)

// Half lit, half not: the theme is whatever the device says.
export const IconAuto = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none" />
  </svg>
)

// ─── Bar Book page types ────────────────────────────────
// One icon per format a bar can keep in its book. Drawn on the same 24px grid
// as the navigation above, so the tab strip reads as part of the app rather
// than a row of text symbols.

export const IconChecklists = () => (
  <svg {...base}>
    <path d="M3.5 6.5 5 8l2.5-2.5" />
    <path d="M3.5 12.5 5 14l2.5-2.5" />
    <path d="M3.5 18.5 5 20l2.5-2.5" />
    <path d="M11 7h9M11 13h9M11 19h6" />
  </svg>
)

export const IconChecklist = () => (
  <svg {...base}>
    <rect x="4" y="3.5" width="16" height="17" rx="2" />
    <path d="M8.5 11.5 11 14l4.5-4.5" />
  </svg>
)

export const IconTable = () => (
  <svg {...base}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" />
  </svg>
)

export const IconRecipes = () => (
  <svg {...base}>
    <path d="M4.5 4.5h15L12 13z" />
    <path d="M12 13v6.5M8.5 19.5h7" />
  </svg>
)

export const IconInfo = () => (
  <svg {...base}>
    <path d="M6 3.5h8l4.5 4.5v12.5H6z" />
    <path d="M13.5 3.5V8h4.5" />
    <path d="M9 12.5h6M9 16h4" />
  </svg>
)

export const IconContacts = () => (
  <svg {...base}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
  </svg>
)

export const IconLinks = () => (
  <svg {...base}>
    <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 0 0-5.7-5.7l-1.3 1.3" />
    <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.3 2.3a4 4 0 0 0 5.7 5.7l1.3-1.3" />
  </svg>
)

export const IconGallery = () => (
  <svg {...base}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M3.5 16.5 9 11l5 5 2.5-2.5 3 3" />
  </svg>
)

/** Navigation shared by the rail and the bottom nav, in one order. */
export const NAV_ITEMS = [
  { to: '/home', labelKey: 'home', Icon: IconHome },
  { to: '/items-management', labelKey: 'navItemsMgmt', Icon: IconStock },
  { to: '/orders', labelKey: 'orders', Icon: IconOrders },
  { to: '/bar-book', labelKey: 'barBook', Icon: IconBarBook },
  { to: '/products', labelKey: 'products', Icon: IconProducts },
  { to: '/recipes', labelKey: 'recipesTitle', Icon: IconRecipes },
]
