import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { barBookService, createPage } from '../services/barBook.service.js'
import { translateField, translateArray, getLangText, migrateAllContent } from '../services/translate.service.js'

// ─── helpers ────────────────────────────────────────────
function linesToArray(text) {
  if (!text || typeof text !== 'string') return []
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
}
function arrayToLines(arr) {
  return Array.isArray(arr) ? arr.join('\n') : ''
}
function getRecipeSchema(t) {
  return Yup.object().shape({
    title: Yup.string().trim().required(t('recipeTitleRequired')),
    ingredientsText: Yup.string().trim().required(t('minOneIngredient'))
      .test('minLines', t('minOneIngredient'), v => linesToArray(v || '').length > 0),
    instructionsText: Yup.string().trim().required(t('minOneStep'))
      .test('minLines', t('minOneStep'), v => linesToArray(v || '').length > 0),
  })
}

const PAGE_TYPES = [
  { type: 'checklists', symbol: '✓', labelKey: 'typeChecklists' },
  { type: 'checklist',  symbol: '☑', labelKey: 'typeChecklist' },
  { type: 'daily',      symbol: '◷', labelKey: 'typeDaily' },
  { type: 'stock',      symbol: '▤', labelKey: 'typeStock' },
  { type: 'recipes',    symbol: '✦', labelKey: 'typeRecipes' },
]

// ─── Stock table (TanStack) ──────────────────────────────
function StockPageView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const [editCell, setEditCell] = useState({ row: null, col: null, value: '' })
  const [editHeader, setEditHeader] = useState({ col: null, value: '' })

  const headers = page.headers || []
  const rows = page.rows || []

  const data = useMemo(() =>
    rows.map(row => Object.fromEntries(headers.map((_, i) => [`c${i}`, row[i] ?? ''])))
  , [rows, headers])

  const columns = useMemo(() =>
    headers.map((h, colIdx) => ({
      id: `c${colIdx}`,
      accessorKey: `c${colIdx}`,
      header: getLangText(h, lang),
      _colIdx: colIdx,
    }))
  , [headers, lang])

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  function commitCell() {
    const { row, col, value } = editCell
    if (row == null) return
    const newRows = rows.map((r, ri) => {
      if (ri !== row) return r
      const nr = [...r]
      nr[col] = value
      return nr
    })
    onPageChange({ ...page, rows: newRows })
    setEditCell({ row: null, col: null, value: '' })
  }

  async function commitHeader() {
    const { col, value } = editHeader
    if (col == null) return
    const newHeaders = [...headers]
    const trimmed = value.trim() || getLangText(headers[col], lang)
    newHeaders[col] = await translateField(trimmed, lang)
    onPageChange({ ...page, headers: newHeaders })
    setEditHeader({ col: null, value: '' })
  }

  async function addColumn() {
    const translated = await translateField(t('newColumn'), lang)
    const newHeaders = [...headers, translated]
    const newRows = rows.map(r => [...r, ''])
    onPageChange({ ...page, headers: newHeaders, rows: newRows })
  }

  function removeColumn(colIdx) {
    const newHeaders = headers.filter((_, i) => i !== colIdx)
    const newRows = rows.map(r => r.filter((_, i) => i !== colIdx))
    onPageChange({ ...page, headers: newHeaders, rows: newRows })
  }

  function addRow() {
    onPageChange({ ...page, rows: [...rows, Array(headers.length).fill('')] })
  }

  function removeRow(rowIdx) {
    onPageChange({ ...page, rows: rows.filter((_, i) => i !== rowIdx) })
  }

  return (
    <div className="stock-page-view">
      <div className="stock-table-wrap">
        <table className="stock-table">
          <thead>
            <tr>
              {table.getHeaderGroups()[0]?.headers.map((header) => {
                const colIdx = header.column.columnDef._colIdx
                return (
                  <th key={header.id}>
                    {editHeader.col === colIdx ? (
                      <input
                        className="edit-input cell-input"
                        value={editHeader.value}
                        autoFocus
                        onChange={e => setEditHeader(p => ({ ...p, value: e.target.value }))}
                        onBlur={commitHeader}
                        onKeyDown={e => e.key === 'Enter' && commitHeader()}
                      />
                    ) : (
                      <span
                        className={isAdmin ? 'editable' : ''}
                        onClick={() => isAdmin && setEditHeader({ col: colIdx, value: getLangText(headers[colIdx], lang) })}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                    )}
                    {isAdmin && (
                      <button type="button" className="btn-icon col-delete" onClick={() => removeColumn(colIdx)} title={t('deleteColumn')}>×</button>
                    )}
                  </th>
                )
              })}
              {isAdmin && <th className="th-actions"><button type="button" className="btn-add-col" onClick={addColumn}>+</button></th>}
              {isAdmin && <th className="th-actions"></th>}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIdx) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const colIdx = cell.column.columnDef._colIdx
                  const isEditing = editCell.row === rowIdx && editCell.col === colIdx
                  return (
                    <td key={cell.id}>
                      {isEditing ? (
                        <input
                          className="edit-input cell-input"
                          value={editCell.value}
                          autoFocus
                          onChange={e => setEditCell(p => ({ ...p, value: e.target.value }))}
                          onBlur={commitCell}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitCell()
                            if (e.key === 'Escape') setEditCell({ row: null, col: null, value: '' })
                          }}
                        />
                      ) : (
                        <span
                          className={isAdmin ? 'editable' : ''}
                          onClick={() => isAdmin && setEditCell({ row: rowIdx, col: colIdx, value: cell.getValue() ?? '' })}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      )}
                    </td>
                  )
                })}
                {isAdmin && <td />}
                {isAdmin && (
                  <td className="td-actions">
                    <button type="button" className="btn-icon btn-delete-row" onClick={() => removeRow(rowIdx)}>×</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isAdmin && (
        <button type="button" className="btn-add-item" onClick={addRow}>+ {t('addRow')}</button>
      )}
    </div>
  )
}

// ─── Multi-checklist page (recipes-style) ───────────────
function ChecklistsPageView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const [selectedId, setSelectedId] = useState(null)
  const [editItem, setEditItem] = useState({ listId: null, index: null, value: '' })
  const [newItemText, setNewItemText] = useState('')
  const [editListTitle, setEditListTitle] = useState({ id: null, value: '' })
  const [newListTitle, setNewListTitle] = useState('')
  const [showNewListInput, setShowNewListInput] = useState(false)
  const newListRef = useRef(null)

  const lists = page.lists || []
  const selectedList = lists.find(l => l._id === selectedId) || lists[0] || null

  useEffect(() => {
    if (!selectedId && lists.length > 0) setSelectedId(lists[0]._id)
  }, [lists.length])

  useEffect(() => {
    if (showNewListInput) newListRef.current?.focus()
  }, [showNewListInput])

  function updateList(updatedList) {
    onPageChange({ ...page, lists: lists.map(l => l._id === updatedList._id ? updatedList : l) })
  }

  function toggleCheck(listId, index) {
    const list = lists.find(l => l._id === listId)
    if (!list) return
    updateList({ ...list, items: list.items.map((it, i) => i === index ? { ...it, checked: !it.checked } : it) })
  }

  async function commitItem(listId, index) {
    if (editItem.listId !== listId || editItem.index !== index) return
    const list = lists.find(l => l._id === listId)
    if (!list) return
    const trimmed = editItem.value.trim()
    const newItems = [...list.items]
    if (trimmed) newItems[index] = { ...newItems[index], text: await translateField(trimmed, lang) }
    else newItems.splice(index, 1)
    updateList({ ...list, items: newItems })
    setEditItem({ listId: null, index: null, value: '' })
  }

  async function addItem(listId, e) {
    if (e) e.preventDefault()
    const trimmed = newItemText.trim()
    if (!trimmed) return
    const list = lists.find(l => l._id === listId)
    if (!list) return
    const translated = await translateField(trimmed, lang)
    updateList({ ...list, items: [...list.items, { text: translated, checked: false }] })
    setNewItemText('')
  }

  function removeItem(listId, index) {
    const list = lists.find(l => l._id === listId)
    if (!list) return
    updateList({ ...list, items: list.items.filter((_, i) => i !== index) })
  }

  async function commitListTitle(id) {
    const v = editListTitle.value.trim()
    if (v) {
      const translated = await translateField(v, lang)
      onPageChange({ ...page, lists: lists.map(l => l._id === id ? { ...l, title: translated } : l) })
    }
    setEditListTitle({ id: null, value: '' })
  }

  async function addList(e) {
    if (e) e.preventDefault()
    const trimmed = newListTitle.trim()
    if (!trimmed) return
    const translated = await translateField(trimmed, lang)
    const newList = { _id: crypto.randomUUID(), title: translated, items: [] }
    onPageChange({ ...page, lists: [...lists, newList] })
    setSelectedId(newList._id)
    setNewListTitle('')
    setShowNewListInput(false)
  }

  function deleteList(id) {
    if (!window.confirm(t('confirmDeletePage'))) return
    const remaining = lists.filter(l => l._id !== id)
    onPageChange({ ...page, lists: remaining })
    setSelectedId(remaining[0]?._id || null)
  }

  return (
    <div className="checklists-page-view">
      <div className="checklists-layout">
        {/* Left panel — list of checklist names */}
        <div className="checklists-list-panel">
          {lists.map(list => (
            <button
              key={list._id}
              type="button"
              className={`checklist-index-item ${selectedList?._id === list._id ? 'active' : ''}`}
              onClick={() => setSelectedId(list._id)}
            >
              {editListTitle.id === list._id ? (
                <input
                  className="edit-input checklist-title-edit-input"
                  value={editListTitle.value}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onChange={e => setEditListTitle(p => ({ ...p, value: e.target.value }))}
                  onBlur={() => commitListTitle(list._id)}
                  onKeyDown={e => { if (e.key === 'Enter') commitListTitle(list._id); if (e.key === 'Escape') setEditListTitle({ id: null, value: '' }) }}
                />
              ) : (
                <>
                  <span className="checklist-index-title">{getLangText(list.title, lang)}</span>
                  <span className="checklist-index-meta">{list.items?.length || 0} {t('items')}</span>
                </>
              )}
              {isAdmin && selectedList?._id === list._id && editListTitle.id !== list._id && (
                <span className="checklist-index-actions">
                  <button type="button" className="btn-icon" onClick={e => { e.stopPropagation(); setEditListTitle({ id: list._id, value: getLangText(list.title, lang) }) }}>✎</button>
                  <button type="button" className="btn-icon" onClick={e => { e.stopPropagation(); deleteList(list._id) }}>×</button>
                </span>
              )}
            </button>
          ))}
          {isAdmin && (
            showNewListInput ? (
              <form className="checklist-new-list-form" onSubmit={addList}>
                <input
                  ref={newListRef}
                  type="text"
                  className="checklist-add-input"
                  placeholder={t('pageTitlePlaceholder')}
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                  onBlur={() => { if (!newListTitle.trim()) setShowNewListInput(false) }}
                  onKeyDown={e => e.key === 'Escape' && setShowNewListInput(false)}
                />
              </form>
            ) : (
              <button type="button" className="btn-add-checklist-list" onClick={() => setShowNewListInput(true)}>
                + {t('addList')}
              </button>
            )
          )}
        </div>

        {/* Right panel — selected checklist items */}
        <div className="checklists-detail-panel">
          {selectedList ? (
            <div className="checklist-detail">
              <ul className="checklist-list">
                {selectedList.items.map((item, i) => (
                  <li key={i} className="checklist-item">
                    <input type="checkbox" checked={!!item.checked} onChange={() => toggleCheck(selectedList._id, i)} />
                    {editItem.listId === selectedList._id && editItem.index === i ? (
                      <input
                        className="edit-input checklist-inline-input"
                        value={editItem.value}
                        autoFocus
                        onChange={e => setEditItem(p => ({ ...p, value: e.target.value }))}
                        onBlur={() => commitItem(selectedList._id, i)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitItem(selectedList._id, i)
                          if (e.key === 'Escape') setEditItem({ listId: null, index: null, value: '' })
                        }}
                      />
                    ) : (
                      <span
                        className={`checklist-item-text ${item.checked ? 'checked' : ''} ${isAdmin ? 'editable' : ''}`}
                        onClick={() => isAdmin && setEditItem({ listId: selectedList._id, index: i, value: getLangText(item.text, lang) })}
                      >
                        {getLangText(item.text, lang)}
                      </span>
                    )}
                    {isAdmin && (
                      <button type="button" className="btn-icon btn-delete-item" onClick={() => removeItem(selectedList._id, i)}>×</button>
                    )}
                  </li>
                ))}
              </ul>
              {isAdmin && (
                <form className="checklist-add-row" onSubmit={e => addItem(selectedList._id, e)}>
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
          ) : (
            <div className="checklist-detail-placeholder"><p>{t('selectChecklistPrompt')}</p></div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Single checklist page ───────────────────────────────
function ChecklistPageView({ page, isAdmin, onPageChange }) {
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

// ─── Daily tasks page ───────────────────────────────────
function DailyPageView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const [editTask, setEditTask] = useState({ index: null, value: '' })
  const [editDay, setEditDay] = useState({ index: null, value: '' })

  const tasks = page.tasks || []

  async function commitTask(i) {
    if (editTask.index !== i) return
    const translated = await translateField(editTask.value, lang)
    const newTasks = tasks.map((d, idx) => idx === i ? { ...d, task: translated } : d)
    onPageChange({ ...page, tasks: newTasks })
    setEditTask({ index: null, value: '' })
  }

  async function commitDay(i) {
    if (editDay.index !== i) return
    const v = editDay.value.trim()
    if (v) {
      const translated = await translateField(v, lang)
      const newTasks = tasks.map((d, idx) => idx === i ? { ...d, day: translated } : d)
      onPageChange({ ...page, tasks: newTasks })
    }
    setEditDay({ index: null, value: '' })
  }

  async function addDay() {
    const translated = await translateField(t('newDay'), lang)
    const newTasks = [...tasks, { day: translated, task: '' }]
    onPageChange({ ...page, tasks: newTasks })
    setEditDay({ index: newTasks.length - 1, value: getLangText(translated, lang) })
  }

  function removeDay(i) {
    onPageChange({ ...page, tasks: tasks.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="daily-page-view">
      <div className="daily-tasks-table-wrap">
        <table className="daily-tasks-table daily-tasks-vertical">
          <thead>
            <tr>
              <th>{t('dayColumn')}</th>
              <th>{t('dailyTaskColumn')}</th>
              {isAdmin && <th className="th-actions" />}
            </tr>
          </thead>
          <tbody>
            {tasks.map((d, i) => (
              <tr key={i}>
                <td className="daily-task-day-cell">
                  {editDay.index === i ? (
                    <input className="edit-input cell-input" value={editDay.value} autoFocus
                      onChange={e => setEditDay(p => ({ ...p, value: e.target.value }))}
                      onBlur={() => commitDay(i)} onKeyDown={e => e.key === 'Enter' && commitDay(i)} />
                  ) : (
                    <span className={isAdmin ? 'editable' : ''} onClick={() => isAdmin && setEditDay({ index: i, value: getLangText(d.day, lang) })}>
                      {getLangText(d.day, lang)}
                    </span>
                  )}
                </td>
                <td className="daily-task-details-cell">
                  {editTask.index === i ? (
                    <textarea className="edit-input daily-task-textarea" rows={5} value={editTask.value} autoFocus
                      onChange={e => setEditTask(p => ({ ...p, value: e.target.value }))}
                      onBlur={() => commitTask(i)}
                      onKeyDown={e => e.key === 'Escape' && setEditTask({ index: null, value: '' })}
                      placeholder={t('dailyTaskPlaceholder')}
                    />
                  ) : (
                    <div className={`daily-task-text ${isAdmin ? 'editable' : ''}`}
                      onClick={() => isAdmin && setEditTask({ index: i, value: getLangText(d.task, lang) })}>
                      {getLangText(d.task, lang)?.trim() || t('emptyClickEdit')}
                    </div>
                  )}
                </td>
                {isAdmin && (
                  <td className="td-actions">
                    <button type="button" className="btn-icon btn-delete-row" onClick={() => removeDay(i)}>×</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isAdmin && (
        <button type="button" className="btn-add-item" onClick={addDay}>+ {t('addDay')}</button>
      )}
    </div>
  )
}

// ─── Recipes page ───────────────────────────────────────
function RecipesPageView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const [selectedId, setSelectedId] = useState(null)
  const [formRecipe, setFormRecipe] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const recipes = page.items || []
  const selectedRecipe = recipes.find(r => String(r._id) === String(selectedId)) || null

  function openAdd() { setFormRecipe(null); setIsFormOpen(true) }
  function openEdit(r) { setFormRecipe(r); setIsFormOpen(true) }
  function closeForm() { setFormRecipe(null); setIsFormOpen(false) }

  async function handleSubmit(values) {
    const [title, ingredients, instructions] = await Promise.all([
      translateField(values.title.trim(), lang),
      translateArray(linesToArray(values.ingredientsText), lang),
      translateArray(linesToArray(values.instructionsText), lang),
    ])
    const payload = { title, ingredients, instructions }
    if (formRecipe) {
      onPageChange({ ...page, items: recipes.map(r => String(r._id) === String(formRecipe._id) ? { ...r, ...payload } : r) })
    } else {
      const newR = { _id: Date.now().toString(), ...payload }
      onPageChange({ ...page, items: [newR, ...recipes] })
      setSelectedId(newR._id)
    }
    closeForm()
  }

  function handleDelete(r) {
    if (!window.confirm(`${t('confirmDeleteRecipe')} "${getLangText(r.title, lang)}"?`)) return
    onPageChange({ ...page, items: recipes.filter(x => String(x._id) !== String(r._id)) })
    if (String(selectedId) === String(r._id)) setSelectedId(null)
  }

  const initialValues = formRecipe
    ? {
        title: getLangText(formRecipe.title, lang),
        ingredientsText: arrayToLines((formRecipe.ingredients || []).map(i => getLangText(i, lang))),
        instructionsText: arrayToLines((formRecipe.instructions || []).map(i => getLangText(i, lang))),
      }
    : { title: '', ingredientsText: '', instructionsText: '' }

  return (
    <div className="bar-book-recipes">
      <div className="recipes-layout">
        <div className="recipes-list-panel">
          {isAdmin && (
            <div className="recipes-panel-header">
              <button type="button" className="btn-add-recipe" onClick={openAdd}>+ {t('addRecipe')}</button>
            </div>
          )}
          <div className="recipes-index">
            {recipes.length === 0
              ? <p className="recipes-empty">{t('noRecipes')}</p>
              : recipes.map(r => (
                <button key={r._id} type="button"
                  className={`recipe-index-item ${selectedId === r._id ? 'active' : ''}`}
                  onClick={() => setSelectedId(r._id)}>
                  <span className="recipe-index-title">{getLangText(r.title, lang)}</span>
                  <span className="recipe-index-meta">{r.ingredients?.length} {t('ingredients')}</span>
                </button>
              ))
            }
          </div>
        </div>
        <div className="recipes-detail-panel">
          {selectedRecipe ? (
            <article className="recipe-detail">
              <div className="recipe-detail-header">
                <h2 className="recipe-detail-title">{getLangText(selectedRecipe.title, lang)}</h2>
                {isAdmin && (
                  <div className="recipe-detail-actions">
                    <button type="button" className="btn-edit-recipe" onClick={() => openEdit(selectedRecipe)}>{t('edit')}</button>
                    <button type="button" className="btn-delete-recipe" onClick={() => handleDelete(selectedRecipe)}>{t('delete')}</button>
                  </div>
                )}
              </div>
              <div className="recipe-detail-body">
                <div className="recipe-detail-section">
                  <h3>{t('ingredients')}</h3>
                  <ul>{(selectedRecipe.ingredients || []).map((it, i) => <li key={i}>{getLangText(it, lang)}</li>)}</ul>
                </div>
                <div className="recipe-detail-section">
                  <h3>{t('instructions')}</h3>
                  <ol>{(selectedRecipe.instructions || []).map((st, i) => <li key={i}>{getLangText(st, lang)}</li>)}</ol>
                </div>
              </div>
            </article>
          ) : (
            <div className="recipe-detail-placeholder"><p>{t('selectRecipePrompt')}</p></div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="recipe-form-overlay" onClick={e => e.target === e.currentTarget && closeForm()}>
          <div className="recipe-form-container" onClick={e => e.stopPropagation()}>
            <h2>{formRecipe ? t('editingRecipe') : t('addingRecipe')}</h2>
            <Formik initialValues={initialValues} validationSchema={getRecipeSchema(t)} onSubmit={handleSubmit} enableReinitialize>
              <Form className="recipe-form">
                <div className="form-group">
                  <label>{t('recipeNameLabel')}</label>
                  <Field name="title" type="text" className="form-input" placeholder={t('recipeNamePlaceholder')} />
                  <ErrorMessage name="title" component="div" className="form-error" />
                </div>
                <div className="form-group">
                  <label>{t('ingredientsLabel')}</label>
                  <Field name="ingredientsText" as="textarea" className="form-textarea" rows={6} placeholder={t('ingredientsPlaceholder')} />
                  <ErrorMessage name="ingredientsText" component="div" className="form-error" />
                </div>
                <div className="form-group">
                  <label>{t('instructionsLabel')}</label>
                  <Field name="instructionsText" as="textarea" className="form-textarea" rows={8} placeholder={t('instructionsPlaceholder')} />
                  <ErrorMessage name="instructionsText" component="div" className="form-error" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">{formRecipe ? t('saveChanges') : t('addRecipe')}</button>
                  <button type="button" className="btn-cancel" onClick={closeForm}>{t('cancel')}</button>
                </div>
              </Form>
            </Formik>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add Page Modal ─────────────────────────────────────
function AddPageModal({ onAdd, onClose }) {
  const { t } = useTranslation()
  const [type, setType] = useState('checklist')
  const [title, setTitle] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(createPage(type, trimmed))
    onClose()
  }

  return (
    <div className="add-page-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="add-page-modal">
        <h3>{t('addPage')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="page-type-grid">
            {PAGE_TYPES.map(pt => (
              <button
                key={pt.type}
                type="button"
                className={`page-type-btn ${type === pt.type ? 'active' : ''}`}
                onClick={() => setType(pt.type)}
              >
                <span className="pt-symbol">{pt.symbol}</span>
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

// ─── Main BarBookPage ───────────────────────────────────
export function BarBookPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const user = useSelector(state => state.userModule.loggedInUser)
  const isAdmin = user?.role === 'admin'

  const [pages, setPages] = useState([])
  const [activePageId, setActivePageId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPageTitle, setEditingPageTitle] = useState(null)
  const skipSaveRef = useRef(true)

  const activePage = pages.find(p => p._id === activePageId) || null

  // Load + auto-migrate plain strings to { he, en }
  useEffect(() => {
    barBookService.getContent()
      .then(async data => {
        const loaded = Array.isArray(data?.pages) ? data.pages : []
        if (loaded.length > 0) setActivePageId(loaded[0]._id)
        const { pages: migrated, changed } = await migrateAllContent(loaded)
        setPages(migrated)
        if (changed) {
          barBookService.saveContent({ pages: migrated }).catch(err => console.error('migration save failed', err))
        }
      })
      .catch(err => setLoadError(err?.message || t('errorLoadBarBook')))
      .finally(() => setIsLoading(false))
  }, [])

  // Auto-save
  useEffect(() => {
    if (skipSaveRef.current) return
    const timer = setTimeout(() => {
      barBookService.saveContent({ pages }).catch(err => console.error('save failed', err))
    }, 600)
    return () => clearTimeout(timer)
  }, [pages])

  useEffect(() => {
    if (!isLoading) skipSaveRef.current = false
  }, [isLoading])

  function addPage(newPage) {
    setPages(prev => [...prev, newPage])
    setActivePageId(newPage._id)
  }

  function updateActivePage(updated) {
    setPages(prev => prev.map(p => p._id === updated._id ? updated : p))
  }

  function deletePage(id) {
    if (!window.confirm(t('confirmDeletePage'))) return
    const remaining = pages.filter(p => p._id !== id)
    setPages(remaining)
    setActivePageId(remaining.length > 0 ? remaining[remaining.length - 1]._id : null)
  }

  async function commitPageTitle(page) {
    const v = (editingPageTitle?.value ?? '').trim()
    if (v) {
      const translated = await translateField(v, lang)
      setPages(prev => prev.map(p => p._id === page._id ? { ...p, customTitle: translated } : p))
    }
    setEditingPageTitle(null)
  }

  function typeSymbol(type) {
    return PAGE_TYPES.find(pt => pt.type === type)?.symbol || '▤'
  }

  function pageDisplayTitle(page) {
    if (page.customTitle) return getLangText(page.customTitle, lang)
    const pt = PAGE_TYPES.find(p => p.type === page.type)
    return pt ? t(pt.labelKey) : page.title
  }

  return (
    <section className="bar-book-page">
      <div className="bar-book-layout">

        {/* ── SIDEBAR ── */}
        <aside className="bar-book-sidebar">
          <nav className="sidebar-nav">
            {pages.map(page => (
              <div key={page._id} className={`sidebar-page-item ${activePageId === page._id ? 'active' : ''}`}>
                {editingPageTitle?.id === page._id ? (
                  <input
                    className="sidebar-title-input"
                    value={editingPageTitle.value}
                    autoFocus
                    onChange={e => setEditingPageTitle(p => ({ ...p, value: e.target.value }))}
                    onBlur={() => commitPageTitle(page)}
                    onKeyDown={e => { if (e.key === 'Enter') commitPageTitle(page); if (e.key === 'Escape') setEditingPageTitle(null) }}
                  />
                ) : (
                  <button
                    type="button"
                    className="sidebar-nav-item-btn"
                    onClick={() => setActivePageId(page._id)}
                  >
                    <span className="nav-symbol">{typeSymbol(page.type)}</span>
                    <span className="nav-label">{pageDisplayTitle(page)}</span>
                  </button>
                )}
                {isAdmin && activePageId === page._id && (
                  <div className="sidebar-page-actions">
                    <button type="button" className="btn-icon" title={t('rename')}
                      onClick={() => setEditingPageTitle({ id: page._id, value: page.customTitle || pageDisplayTitle(page) })}>✎</button>
                    <button type="button" className="btn-icon" title={t('delete')}
                      onClick={() => deletePage(page._id)}>×</button>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="sidebar-add-page">
            <button type="button" className="btn-add-page" onClick={() => setShowAddModal(true)} title={t('addPage')}>
              +
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="bar-book-main">
          {isLoading && <p className="bar-book-loading">{t('loadingBarBook')}</p>}
          {!isLoading && loadError && <p className="bar-book-error">{loadError}</p>}

          {!isLoading && !loadError && pages.length === 0 && (
            <div className="empty-state">
              <p>{t('barBookEmpty')}</p>
              <button type="button" className="btn-add" onClick={() => setShowAddModal(true)}>
                + {t('addPage')}
              </button>
            </div>
          )}

          {activePage && (
            <>
              <div className="content-topbar">
                <span className="content-topbar-title">{pageDisplayTitle(activePage)}</span>
              </div>

              <div className="page-content-area">
                {activePage.type === 'checklists' && (
                  <ChecklistsPageView page={activePage} isAdmin={isAdmin} onPageChange={updateActivePage} />
                )}
                {activePage.type === 'checklist' && (
                  <ChecklistPageView page={activePage} isAdmin={isAdmin} onPageChange={updateActivePage} />
                )}
                {activePage.type === 'daily' && (
                  <DailyPageView page={activePage} isAdmin={isAdmin} onPageChange={updateActivePage} />
                )}
                {activePage.type === 'stock' && (
                  <StockPageView page={activePage} isAdmin={isAdmin} onPageChange={updateActivePage} />
                )}
                {activePage.type === 'recipes' && (
                  <RecipesPageView page={activePage} isAdmin={isAdmin} onPageChange={updateActivePage} />
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {showAddModal && (
        <AddPageModal onAdd={addPage} onClose={() => setShowAddModal(false)} />
      )}
    </section>
  )
}
