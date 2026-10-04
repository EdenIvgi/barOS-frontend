import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { barBookService } from '../services/barBook.service.js'
import { AppShell } from '../cmps/AppShell'
import { translateField, getLangText, migrateAllContent } from '../services/translate.service.js'
import { PAGE_TYPES } from '../cmps/barbook/pageTypes.js'
import { AddPageModal } from '../cmps/barbook/AddPageModal.jsx'
import { StockView } from '../cmps/barbook/StockView.jsx'
import { SingleChecklistView } from '../cmps/barbook/SingleChecklistView.jsx'
import { DailyView } from '../cmps/barbook/DailyView.jsx'
import { RecipesView } from '../cmps/barbook/RecipesView.jsx'

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

export function BarBookPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const user = useSelector(state => state.userModule.loggedInUser)
  const isAdmin = user?.role === 'admin'

  const [pages, setPages] = useState([])
  const [activePageId, setActivePageId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [hasConflict, setHasConflict] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPageTitle, setEditingPageTitle] = useState(null)
  const skipSaveRef = useRef(true)
  // Version of the document this client is working from, for conflict detection.
  const baseUpdatedAtRef = useRef(undefined)

  const activePage = pages.find(p => p._id === activePageId) || null

  // Load + auto-migrate plain strings to { he, en }
  useEffect(() => {
    barBookService.getContent()
      .then(async data => {
        const loaded = Array.isArray(data?.pages) ? data.pages : []
        baseUpdatedAtRef.current = data?.updatedAt
        if (loaded.length > 0) setActivePageId(loaded[0]._id)
        const { pages: migrated, changed } = await migrateAllContent(loaded)
        setPages(migrated)
        if (changed) {
          save(migrated).catch(err => console.error('migration save failed', err))
        }
      })
      .catch(err => setLoadError(err?.message || t('errorLoadBarBook')))
      .finally(() => setIsLoading(false))
  }, [])

  async function save(nextPages) {
    const saved = await barBookService.saveContent({
      pages: nextPages,
      baseUpdatedAt: baseUpdatedAtRef.current,
    })
    baseUpdatedAtRef.current = saved?.updatedAt
    return saved
  }

  // Auto-save
  useEffect(() => {
    if (skipSaveRef.current) return
    const timer = setTimeout(() => {
      save(pages).catch(err => {
        if (err?.response?.status === 409) {
          // Someone else saved while we were editing — stop overwriting them and
          // tell the user to reload rather than losing one side's work silently.
          // Flag it rather than translating here, so `t` stays out of this effect's
          // deps and a language switch cannot trigger a redundant save.
          setHasConflict(true)
        } else {
          console.error('save failed', err)
        }
      })
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
    // `title` is the legacy field — pages created before customTitle existed still carry it.
    const custom = page.customTitle ?? page.title
    if (custom) return getLangText(custom, lang)
    const pt = PAGE_TYPES.find(p => p.type === page.type)
    return pt ? t(pt.labelKey) : ''
  }

  return (
    <AppShell
      title={t('barBookTitle')}
      subtitle={activePage ? pageDisplayTitle(activePage) : ''}
      actions={
        isAdmin ? (
          <button type="button" className="btn-shell is-primary" onClick={() => setShowAddModal(true)}>
            {t('addPage')}
          </button>
        ) : null
      }
      flush
    >
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
          {hasConflict && <p className="bar-book-error">{t('barBookConflict')}</p>}

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
                  <SingleChecklistView page={activePage} isAdmin={isAdmin} onPageChange={updateActivePage} />
                )}
                {activePage.type === 'daily' && (
                  <DailyView page={activePage} isAdmin={isAdmin} onPageChange={updateActivePage} />
                )}
                {activePage.type === 'stock' && (
                  <StockView page={activePage} isAdmin={isAdmin} onPageChange={updateActivePage} />
                )}
                {activePage.type === 'recipes' && (
                  <RecipesView page={activePage} isAdmin={isAdmin} onPageChange={updateActivePage} />
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
    </AppShell>
  )
}
