import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { translateField, getLangText } from '../../services/translate.service.js'
import { ProgressRing } from './ProgressRing.jsx'
import { ChecklistRunner } from './ChecklistRunner.jsx'

/**
 * The checklists tab: a board of cards, or one checklist being run.
 *
 * Replaces an index nested inside a page sidebar inside the rail — three levels
 * of list to reach one checkbox. Here the board is the top level and opening a
 * checklist is one tap, going back another.
 */
export function ChecklistBoard({ page, lang, isAdmin, isEditing, onPageChange }) {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState(null)
  const [newTitle, setNewTitle] = useState('')

  const lists = page.lists || []
  const open = lists.find(l => l._id === openId) || null

  function updateList(updated) {
    onPageChange({ ...page, lists: lists.map(l => (l._id === updated._id ? updated : l)) })
  }

  async function addList(e) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    // Titles are stored as { he, en } like the rest of the book, or the language
    // switch would leave this one list in whichever language it was typed in.
    const translated = await translateField(title, lang)
    onPageChange({
      ...page,
      lists: [...lists, { _id: crypto.randomUUID(), title: translated, items: [] }],
    })
    setNewTitle('')
  }

  function removeList(id) {
    if (!window.confirm(t('confirmDeletePage'))) return
    onPageChange({ ...page, lists: lists.filter(l => l._id !== id) })
  }

  if (open) {
    return (
      <ChecklistRunner
        list={open}
        lang={lang}
        isAdmin={isAdmin}
        isEditing={isEditing}
        onChange={updateList}
        onBack={() => setOpenId(null)}
      />
    )
  }

  return (
    <div className="bb-board">
      {lists.length === 0 && <p className="dash-empty">{t('barBookEmpty')}</p>}

      {lists.map(list => {
        const items = list.items || []
        const done = items.filter(i => i.checked).length
        const complete = items.length > 0 && done === items.length
        return (
          <div className={'bb-card' + (complete ? ' is-complete' : '')} key={list._id}>
            <button type="button" className="bb-card-open" onClick={() => setOpenId(list._id)}>
              <ProgressRing done={done} total={items.length} />
              <span className="bb-card-id">
                <span className="bb-card-title">{getLangText(list.title, lang)}</span>
                <span className="bb-card-sub">
                  {items.length === 0
                    ? t('noItems')
                    : t('doneOfTotal', { done, total: items.length })}
                </span>
              </span>
            </button>
            {isAdmin && isEditing && (
              <button
                type="button"
                className="bb-card-remove"
                onClick={() => removeList(list._id)}
                aria-label={t('delete')}
              >
                ×
              </button>
            )}
          </div>
        )
      })}

      {isAdmin && isEditing && (
        <form className="bb-card is-new" onSubmit={addList}>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder={t('addList')}
            aria-label={t('addList')}
          />
          <button type="submit" className="btn-shell is-primary" disabled={!newTitle.trim()}>
            {t('addList')}
          </button>
        </form>
      )}
    </div>
  )
}
