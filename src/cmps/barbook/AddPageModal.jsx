import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { createPage } from '../../services/barBook.service.js'
import { ADDABLE_PAGE_TYPES } from './pageTypes.js'
import { translateField } from '../../services/translate.service.js'

export function AddPageModal({ onAdd, onClose }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const [type, setType] = useState('checklist')
  const [title, setTitle] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // The title is stored as { he, en } like everything else in the book, so a page
  // named in one language still reads in the other.
  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(createPage(type, await translateField(trimmed, lang)))
    onClose()
  }

  return (
    <div className="add-page-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="add-page-modal">
        <h3>{t('addPage')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="page-type-grid">
            {ADDABLE_PAGE_TYPES.map(pt => (
              <button
                key={pt.type}
                type="button"
                className={`page-type-btn ${type === pt.type ? 'active' : ''}`}
                onClick={() => setType(pt.type)}
              >
                <span className="pt-symbol"><pt.Icon /></span>
                <span className="pt-label">{t(pt.labelKey)}</span>
              </button>
            ))}
          </div>
          <input
            ref={inputRef}
            type="text"
            className="edit-input"
            placeholder={t('pageTitlePlaceholder')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <div className="add-page-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn-save" disabled={!title.trim()}>{t('addPage')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
