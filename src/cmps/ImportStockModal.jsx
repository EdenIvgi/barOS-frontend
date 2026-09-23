import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export function ImportStockModal({ importState, onApply, onClose }) {
  const { t } = useTranslation()
  // Creating products is opt-in: fuzzy matching can miss, and silently adding a
  // near-duplicate of something already in stock is worse than reporting it.
  const [createMissing, setCreateMissing] = useState(false)

  if (!importState.isOpen) return null

  const creatable = importState.report?.summary?.creatableRows || 0

  return (
    <div className="form-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        <h2>{t('importStockTitle')}</h2>
        {importState.fileName && (
          <p style={{ marginTop: '0.5rem' }}>{t('fileLabel')}: {importState.fileName}</p>
        )}

        {importState.isLoading && <p>{t('loading')}</p>}
        {importState.error && <p style={{ color: 'crimson' }}>{importState.error}</p>}

        {!!importState.report && (
          <>
            <div style={{ marginTop: '1rem' }}>
              <div>{t('totalRows')}: {importState.report.summary?.totalRows}</div>
              <div>{t('matchedRows')}: {importState.report.summary?.matchedRows}</div>
              <div>{t('uniqueItemsToUpdate')}: {importState.report.summary?.uniqueMatchedItems}</div>
              <div>{t('unmatchedRows')}: {importState.report.summary?.unmatchedRows}</div>
            </div>

            {Array.isArray(importState.report.unmatched) && importState.report.unmatched.length > 0 && (
              <details style={{ marginTop: '1rem' }}>
                <summary>{t('showUnmatched')}</summary>
                <ul style={{ marginTop: '0.5rem' }}>
                  {importState.report.unmatched.slice(0, 20).map((u) => (
                    <li key={`${u.rowIndex}-${u.inputName}`}>
                      #{u.rowIndex + 1} — {u.inputName} ({u.quantity})
                    </li>
                  ))}
                  {importState.report.unmatched.length > 20 && (
                    <li>{t('andMore', { n: importState.report.unmatched.length - 20 })}</li>
                  )}
                </ul>
              </details>
            )}
          </>
        )}

        {creatable > 0 && (
          <label className="import-create-row">
            <input
              type="checkbox"
              checked={createMissing}
              onChange={e => setCreateMissing(e.target.checked)}
            />
            <span>
              <strong>{t('createMissingProducts', { n: creatable })}</strong>
              <em>{t('createMissingHint')}</em>
            </span>
          </label>
        )}

        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn-save"
            disabled={importState.isLoading || !importState.rows.length}
            onClick={() => onApply(createMissing)}
          >
            {t('applyStockUpdate')}
          </button>
          <button type="button" className="btn-cancel" onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  )
}
