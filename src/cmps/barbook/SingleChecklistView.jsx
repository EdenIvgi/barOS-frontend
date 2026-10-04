import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateField, getLangText } from '../../services/translate.service.js'

export function SingleChecklistView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const [editItem, setEditItem] = useState({ index: null, value: '' })
  const [newItemText, setNewItemText] = useState('')

  const items = page.items || []

  async function commitItem(index) {
    const value = editItem.index === index ? editItem.value : ''
    const trimmed = value.trim()
    const newItems = [...items]
    if (trimmed) newItems[index] = { ...newItems[index], text: await translateField(trimmed, lang) }
    else newItems.splice(index, 1)
    onPageChange({ ...page, items: newItems })
    setEditItem({ index: null, value: '' })
  }

  function toggleCheck(index) {
    const newItems = items.map((it, i) => i === index ? { ...it, checked: !it.checked } : it)
    onPageChange({ ...page, items: newItems })
  }

  async function addItem(e) {
    if (e) e.preventDefault()
    const trimmed = newItemText.trim()
    if (!trimmed) return
    const translated = await translateField(trimmed, lang)
    onPageChange({ ...page, items: [...items, { text: translated, checked: false }] })
    setNewItemText('')
  }

  function removeItem(index) {
    onPageChange({ ...page, items: items.filter((_, i) => i !== index) })
    if (editItem.index === index) setEditItem({ index: null, value: '' })
  }

  return (
    <div className="checklist-page-view">
      <ul className="checklist-list">
        {items.map((item, i) => (
          <li key={i} className="checklist-item">
            <input type="checkbox" checked={!!item.checked} onChange={() => toggleCheck(i)} />
            {editItem.index === i ? (
              <input
                className="edit-input checklist-inline-input"
                value={editItem.value}
                autoFocus
                onChange={e => setEditItem(p => ({ ...p, value: e.target.value }))}
                onBlur={() => commitItem(i)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitItem(i)
                  if (e.key === 'Escape') setEditItem({ index: null, value: '' })
                }}
              />
            ) : (
              <span
                className={`checklist-item-text ${item.checked ? 'checked' : ''} ${isAdmin ? 'editable' : ''}`}
                onClick={() => isAdmin && setEditItem({ index: i, value: getLangText(item.text, lang) })}
              >
                {getLangText(item.text, lang)}
              </span>
            )}
            {isAdmin && (
              <button type="button" className="btn-icon btn-delete-item" onClick={() => removeItem(i)}>×</button>
            )}
          </li>
        ))}
      </ul>
      {isAdmin && (
        <form className="checklist-add-row" onSubmit={addItem}>
          <input
            type="text"
            className="checklist-add-input"
            placeholder={`+ ${t('addTask')}…`}
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
          />
        </form>
      )}
    </div>
  )
}
