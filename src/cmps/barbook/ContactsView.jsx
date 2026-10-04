import { useTranslation } from 'react-i18next'
import { InlineText } from './InlineText.jsx'

/**
 * Suppliers, technicians, the person who answers when the ice machine dies.
 *
 * The number is a tel: link, because this page gets opened on a phone with one
 * hand while something is going wrong — reading a number off a screen and typing
 * it into the dialer is the slow path.
 */
export function ContactsView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const contacts = page.contacts || []

  function setContacts(next) {
    onPageChange({ ...page, contacts: next })
  }

  function updateContact(index, patch) {
    setContacts(contacts.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  return (
    <div className="bb-contacts">
      {contacts.length === 0 && !isAdmin && <p className="dash-empty">{t('noContacts')}</p>}

      {contacts.map((contact, index) => (
        <div className="bb-contact" key={index}>
          <div className="bb-contact-id">
            <span className="bb-contact-name">
              <InlineText
                value={contact.name}
                lang={lang}
                isAdmin={isAdmin}
                placeholder={t('contactName')}
                onCommit={name => updateContact(index, { name })}
              />
            </span>
            <span className="bb-contact-role">
              <InlineText
                value={contact.role}
                lang={lang}
                isAdmin={isAdmin}
                placeholder={t('contactRole')}
                onCommit={role => updateContact(index, { role })}
              />
            </span>
          </div>

          <div className="bb-contact-reach">
            {isAdmin ? (
              <InlineText
                value={contact.phone}
                lang={lang}
                isAdmin={isAdmin}
                raw
                className="bb-contact-phone"
                placeholder={t('contactPhone')}
                onCommit={phone => updateContact(index, { phone })}
              />
            ) : contact.phone ? (
              <a className="bb-contact-phone is-link" href={`tel:${contact.phone}`} dir="ltr">
                {contact.phone}
              </a>
            ) : null}

            <span className="bb-contact-note">
              <InlineText
                value={contact.note}
                lang={lang}
                isAdmin={isAdmin}
                placeholder={t('contactNote')}
                onCommit={note => updateContact(index, { note })}
              />
            </span>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="bb-row-remove"
              aria-label={t('delete')}
              onClick={() => setContacts(contacts.filter((_, i) => i !== index))}
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
          onClick={() => setContacts([...contacts, { name: '', role: '', phone: '', note: '' }])}
        >
          + {t('addContact')}
        </button>
      )}
    </div>
  )
}
