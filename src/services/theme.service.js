const STORAGE_KEY = 'baros_theme'
const CHOICES = ['light', 'dark', 'auto']

export const themeService = {
  getChoice,
  setChoice,
  getResolved,
  applyChoice,
  watchSystem,
  CHOICES,
}

/**
 * The theme a device is set to use.
 *
 * Stored per device rather than per account: the same bartender wants dark on the
 * bar's dim tablet and light on their phone outside, and the choice has to apply
 * on the landing page, before anyone has logged in.
 */
function getChoice() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return CHOICES.includes(stored) ? stored : 'auto'
  } catch {
    // Private browsing can refuse storage entirely; following the device is a
    // reasonable thing to do when we cannot remember anything.
    return 'auto'
  }
}

function setChoice(choice) {
  const next = CHOICES.includes(choice) ? choice : 'auto'
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Not being able to remember the choice is no reason not to honour it now.
  }
  applyChoice(next)
  return next
}

function systemPrefersLight() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: light)').matches
}

/** What the choice actually resolves to right now: 'light' or 'dark'. */
function getResolved(choice = getChoice()) {
  if (choice === 'light' || choice === 'dark') return choice
  return systemPrefersLight() ? 'light' : 'dark'
}

/**
 * Auto deliberately leaves `data-theme` off, so the stylesheet's
 * prefers-color-scheme rule decides and the page keeps following the device if it
 * changes while the app is open.
 */
function applyChoice(choice = getChoice()) {
  const root = document.documentElement
  if (choice === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', choice)
  root.style.colorScheme = getResolved(choice)
  return getResolved(choice)
}

/** Calls back when the device switches theme, but only while the choice is Auto. */
function watchSystem(onChange) {
  const mq = window.matchMedia?.('(prefers-color-scheme: light)')
  if (!mq) return () => {}
  const handler = () => {
    if (getChoice() === 'auto') onChange(getResolved('auto'))
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
