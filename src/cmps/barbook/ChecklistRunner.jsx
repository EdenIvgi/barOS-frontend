import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateField, getLangText } from '../../services/translate.service.js'
import { ProgressRing } from './ProgressRing.jsx'

/**
 * Runs one checklist.
 *
 * Checking something off is the whole point of this screen, so a tap anywhere on
 * the row does it and the row is sized for a thumb. Editing lives behind a mode
 * switch rather than putting a pencil and an × beside every line — a checklist is
 * run every shift and edited a few times a year.
 */
export function ChecklistRunner({ list, lang, isAdmin, isEditing, onChange, onBack }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const [editIndex, setEditIndex] = useState(null)
  const [editValue, setEditValue] = useState('')

  const items = list.items || []
  const done = items.filter(i => i.checked).length

  function setItems(next) {
    onChange({ ...list, items: next })
  }

  function toggle(index) {
    setItems(items.map((it, i) => (i === index ? { ...it, checked: !it.checked } : it)))
  }

  // Item text is stored as { he, en } like the rest of the book, so anything
  // added or renamed here goes through the translator first.
  async function addItem(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setItems([...items, { text: await translateField(text, lang), checked: false }])
    setDraft('')
  }

  async function commitEdit(index) {
    const text = editValue.trim()
    if (text) {
      const translated = await translateField(text, lang)
      setItems(items.map((it, i) => (i === index ? { ...it, text: translated } : it)))
    }
    setEditIndex(null)
    setEditValue('')
  }

  return (
    <section className="runner">
      <header className="runner-head">
        {/* A page with one list is run directly, and has no board behind it. */}
        {onBack && (
          <button type="button" className="runner-back" onClick={onBack} aria-label={t('back')}>
            ‹
          </button>
        )}
        <div className="runner-id">
          <h2>{getLangText(list.title, lang)}</h2>
          <p>{t('doneOfTotal', { done, total: items.length })}</p>
        </div>
        <ProgressRing done={done} total={items.length} />
      </header>

      <ol className="runner-items">
        {items.map((item, index) => {
          const text = getLangText(item.text, lang)
          const editingThis = isEditing && editIndex === index

          if (editingThis) {
            return (
              <li className="runner-item is-editing" key={index}>
                <input
                  className="runner-edit-input"
                  value={editValue}
                  autoFocus
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(index)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit(index)
                    if (e.key === 'Escape') { setEditIndex(null); setEditValue('') }
                  }}
                />
                <button
                  type="button"
                  className="runner-remove"
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                  aria-label={t('deleteItem')}
                >
                  ×
                </button>
              </li>
            )
          }

          return (
            <li className={'runner-item' + (item.checked ? ' is-done' : '')} key={index}>
              <button
                type="button"
                className="runner-tap"
                onClick={() => (isEditing ? (setEditIndex(index), setEditValue(text)) : toggle(index))}
                aria-pressed={!isEditing ? !!item.checked : undefined}
              >
                <span className="runner-box" aria-hidden="true">
                  {item.checked && !isEditing ? '✓' : ''}
                </span>
                <span className="runner-text">{text}</span>
                {isEditing && <span className="runner-hint">{t('clickToEdit')}</span>}
              </button>
            </li>
          )
        })}
      </ol>

      {isAdmin && isEditing && (
        <form className="runner-add" onSubmit={addItem}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={t('addTask')}
            aria-label={t('addTask')}
          />
          <button type="submit" className="btn-shell" disabled={!draft.trim()}>
            {t('addTask')}
          </button>
        </form>
      )}
    </section>
  )
}
