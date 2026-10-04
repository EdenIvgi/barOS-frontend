import { useTranslation } from 'react-i18next'
import { InlineText } from './InlineText.jsx'

/**
 * Things that live outside the app: a supplier catalogue, the POS manual, a
 * shared drive.
 *
 * Links open in a new tab with noreferrer, since the addresses are typed in by
 * whoever manages the bar and are not otherwise checked.
 */
export function LinksView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const links = page.links || []

  function setLinks(next) {
    onPageChange({ ...page, links: next })
  }

  function updateLink(index, patch) {
    setLinks(links.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  return (
    <div className="bb-links">
      {links.length === 0 && !isAdmin && <p className="dash-empty">{t('noLinks')}</p>}

      {links.map((link, index) => (
        <div className="bb-link" key={index}>
          <div className="bb-link-id">
            {isAdmin ? (
              <>
                <InlineText
                  value={link.title}
                  lang={lang}
                  isAdmin={isAdmin}
                  className="bb-link-title"
                  placeholder={t('linkTitle')}
                  onCommit={title => updateLink(index, { title })}
                />
                <InlineText
                  value={link.url}
                  lang={lang}
                  isAdmin={isAdmin}
                  raw
                  className="bb-link-url"
                  placeholder={t('linkUrl')}
                  onCommit={url => updateLink(index, { url })}
                />
              </>
            ) : (
              <a
                className="bb-link-open"
                href={link.url || '#'}
                target="_blank"
                rel="noreferrer noopener"
              >
                <span className="bb-link-title">
                  <InlineText value={link.title} lang={lang} isAdmin={false} onCommit={() => {}} />
                </span>
                <span className="bb-link-url" dir="ltr">{link.url}</span>
              </a>
            )}
          </div>

          {isAdmin && (
            <button
              type="button"
              className="bb-row-remove"
              aria-label={t('delete')}
              onClick={() => setLinks(links.filter((_, i) => i !== index))}
            >
              ×
            </button>
          )}
        </div>
      ))}

      {isAdmin && (
        <button
          type="button"
          className="btn-add-item"
          onClick={() => setLinks([...links, { title: '', url: '' }])}
        >
          + {t('addLink')}
        </button>
      )}
    </div>
  )
}
