import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { themeService } from '../services/theme.service'
import { IconSun, IconMoon, IconAuto } from './icons'

const ICONS = { light: IconSun, dark: IconMoon, auto: IconAuto }
const NEXT = { auto: 'light', light: 'dark', dark: 'auto' }

/**
 * Light, dark, or whatever the device says.
 *
 * One button that cycles rather than three, because the rail has room for one
 * thing and this is a preference people set once. The icon shows the state it is
 * in, not the state it would move to — a control that advertises its next value
 * cannot also tell you its current one.
 */
export function ThemeToggle({ className = '' }) {
  const { t } = useTranslation()
  const [choice, setChoice] = useState(() => themeService.getChoice())

  useEffect(() => {
    themeService.applyChoice(choice)
  }, [choice])

  // While the choice is Auto the stylesheet's own media query already follows the
  // device; what still needs re-resolving is the colour-scheme hint that tells
  // the browser how to paint form controls and scrollbars.
  useEffect(() => themeService.watchSystem(() => themeService.applyChoice('auto')), [])

  const Icon = ICONS[choice] || IconAuto
  const label = t(`theme_${choice}`)

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      title={label}
      aria-label={t('themeToggle', { state: label })}
      onClick={() => setChoice(themeService.setChoice(NEXT[choice]))}
    >
      <Icon />
      <span className="sr-only">{label}</span>
    </button>
  )
}
