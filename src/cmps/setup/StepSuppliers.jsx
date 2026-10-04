import { useTranslation } from 'react-i18next'

/**
 * Step two: who do you call.
 *
 * These become a Contacts page in the book. `supplier` is only a free-text string
 * on an item, so there is no supplier record to create — and a phone number is
 * worth more behind the bar than another dropdown value.
 */
export function StepSuppliers({ rows, onChange }) {
  const { t } = useTranslation()

  function update(index, patch) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  return (
    <div className="setup-rows">
      {rows.map((row, index) => (
        <div className="setup-row" key={index}>
          <input
            className="setup-input"
            value={row.name}
            placeholder={t('contactName')}
            aria-label={t('contactName')}
            onChange={e => update(index, { name: e.target.value })}
          />
          <input
            className="setup-input"
            value={row.phone}
            placeholder={t('contactPhone')}
            aria-label={t('contactPhone')}
            dir="ltr"
            onChange={e => update(index, { phone: e.target.value })}
          />
          {rows.length > 1 && (
            <button
              type="button"
              className="setup-row-remove"
              aria-label={t('delete')}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        className="btn-add-item"
        onClick={() => onChange([...rows, { name: '', phone: '' }])}
      >
        + {t('addContact')}
      </button>
    </div>
  )
}
