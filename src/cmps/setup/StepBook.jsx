import { useTranslation } from 'react-i18next'
import { SETUP_TEMPLATES } from './setupTemplates.js'
import { getPageType } from '../barbook/pageTypes.js'

/**
 * Step one: what does this bar keep?
 *
 * The question the app cannot answer for itself, asked as a set of cards rather
 * than a list of checkboxes, because each one is a decision about what the book
 * will look like. Nothing is pre-selected except the two checklists almost every
 * bar runs.
 */
export function StepBook({ chosen, onToggle }) {
  const { t } = useTranslation()

  return (
    <div className="setup-templates">
      {SETUP_TEMPLATES.map(tpl => {
        const Icon = getPageType(tpl.type)?.Icon
        const isChosen = chosen.includes(tpl.id)
        return (
          <button
            type="button"
            key={tpl.id}
            className={'setup-tpl' + (isChosen ? ' is-chosen' : '')}
            aria-pressed={isChosen}
            onClick={() => onToggle(tpl.id)}
          >
            <span className="setup-tpl-icon" aria-hidden="true">{Icon && <Icon />}</span>
            <span className="setup-tpl-text">
              <span className="setup-tpl-title">{t(tpl.labelKey)}</span>
              <span className="setup-tpl-desc">{t(tpl.descKey)}</span>
            </span>
            <span className="setup-tpl-check" aria-hidden="true">{isChosen ? '✓' : ''}</span>
          </button>
        )
      })}
    </div>
  )
}
