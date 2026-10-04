import { useTranslation } from 'react-i18next'
import { InlineText } from './InlineText.jsx'

/**
 * Prose the bar wants on record: house rules, service standards, how a thing is
 * done here. The format that catches everything the structured ones do not.
 *
 * A section is a heading and a body, and that is the whole shape — a bar book is
 * read standing up, so there is no rich text to fiddle with.
 */
export function InfoView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const sections = page.sections || []

  function setSections(next) {
    onPageChange({ ...page, sections: next })
  }

  function updateSection(index, patch) {
    setSections(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function addSection() {
    setSections([...sections, { heading: '', body: '' }])
  }

  return (
    <div className="bb-info">
      {sections.length === 0 && !isAdmin && <p className="dash-empty">{t('noSections')}</p>}

      {sections.map((section, index) => (
        <article className="bb-info-section" key={index}>
          <h3>
            <InlineText
              value={section.heading}
              lang={lang}
              isAdmin={isAdmin}
              placeholder={t('sectionHeading')}
              onCommit={heading => updateSection(index, { heading })}
            />
          </h3>
          <div className="bb-info-body">
            <InlineText
              value={section.body}
              lang={lang}
              isAdmin={isAdmin}
              multiline
              placeholder={t('sectionBody')}
              onCommit={body => updateSection(index, { body })}
            />
          </div>
          {isAdmin && (
            <button
              type="button"
              className="bb-row-remove"
              aria-label={t('delete')}
              onClick={() => setSections(sections.filter((_, i) => i !== index))}
            >
              ×
            </button>
          )}
        </article>
      ))}

      {isAdmin && (
        <button type="button" className="btn-add-item" onClick={addSection}>
          + {t('addSection')}
        </button>
      )}
    </div>
  )
}
