import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { barBookService } from '../services/barBook.service.js'
import { AppShell } from '../cmps/AppShell'
import { translateField, getLangText, migrateAllContent } from '../services/translate.service.js'
import { PAGE_TYPES } from '../cmps/barbook/pageTypes.js'
import { AddPageModal } from '../cmps/barbook/AddPageModal.jsx'
import { BarBookTabs } from '../cmps/barbook/BarBookTabs.jsx'
import { ChecklistBoard } from '../cmps/barbook/ChecklistBoard.jsx'
import { StockView } from '../cmps/barbook/StockView.jsx'
import { SingleChecklistView } from '../cmps/barbook/SingleChecklistView.jsx'
import { DailyView } from '../cmps/barbook/DailyView.jsx'
import { RecipesView } from '../cmps/barbook/RecipesView.jsx'
import { resetChecks, countChecks } from '../cmps/barbook/shiftReset.js'

/**
 * The Bar Book.
 *
 * This page owns the document and nothing else: loading it, migrating old plain
 * strings, saving it, and choosing which page of it is on screen. Each view below
 * gets one page and one callback and never learns that saving exists.
 *
 * Running a checklist is the default state of this screen; editing is a mode an
 * admin turns on, because a checklist is run every shift and edited a few times
 * a year.
 */
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
  const [isEditing, setIsEditing] = useState(false)
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

  // The one action in the book that discards work in bulk, so it says how much
  // it is about to clear before doing it.
  function startNewShift() {
    const total = countChecks(pages)
    if (total === 0) return
    if (!window.confirm(t('confirmNewShift', { count: total }))) return
    setPages(prev => resetChecks(prev))
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

  const checksToClear = countChecks(pages)
  // With edit mode off the book is read-and-tick only, so the four table-style
  // views get a false isAdmin rather than each one learning about edit mode.
  const canEdit = isAdmin && isEditing

  return (
    <AppShell
      title={t('barBookTitle')}
      subtitle={activePage ? pageDisplayTitle(activePage) : ''}
      actions={
        <>
          {checksToClear > 0 && (
            <button type="button" className="btn-shell" onClick={startNewShift}>
              {t('newShift')}
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              className={'btn-shell' + (isEditing ? ' is-primary' : '')}
              aria-pressed={isEditing}
              onClick={() => { setIsEditing(v => !v); setEditingPageTitle(null) }}
            >
              {isEditing ? t('editModeOn') : t('editMode')}
            </button>
          )}
        </>
      }
      flush
    >
      <section className="bar-book-page">
        <BarBookTabs
          pages={pages}
          activePageId={activePageId}
          editingTitle={editingPageTitle}
          isAdmin={isAdmin}
          isEditing={isEditing}
          onSelect={setActivePageId}
          onAdd={() => setShowAddModal(true)}
          onDelete={deletePage}
          onEditTitle={setEditingPageTitle}
          onTitleChange={value => setEditingPageTitle(p => ({ ...p, value }))}
          onCommitTitle={commitPageTitle}
          symbolFor={typeSymbol}
          titleFor={pageDisplayTitle}
        />

        <main className="bar-book-main">
          {isLoading && <p className="bar-book-loading">{t('loadingBarBook')}</p>}
          {!isLoading && loadError && <p className="bar-book-error">{loadError}</p>}
          {hasConflict && <p className="bar-book-error">{t('barBookConflict')}</p>}

          {!isLoading && !loadError && pages.length === 0 && (
            <div className="empty-state">
              <p>{t('barBookEmpty')}</p>
              {isAdmin && (
                <button type="button" className="btn-add" onClick={() => setShowAddModal(true)}>
                  + {t('addPage')}
                </button>
              )}
            </div>
          )}

          {activePage && (
            <div className="page-content-area">
              {activePage.type === 'checklists' && (
                <ChecklistBoard page={activePage} lang={lang} isAdmin={isAdmin} isEditing={isEditing} onPageChange={updateActivePage} />
              )}
              {activePage.type === 'checklist' && (
                <SingleChecklistView page={activePage} isAdmin={canEdit} onPageChange={updateActivePage} />
              )}
              {activePage.type === 'daily' && (
                <DailyView page={activePage} isAdmin={canEdit} onPageChange={updateActivePage} />
              )}
              {activePage.type === 'stock' && (
                <StockView page={activePage} isAdmin={canEdit} onPageChange={updateActivePage} />
              )}
              {activePage.type === 'recipes' && (
                <RecipesView page={activePage} isAdmin={canEdit} onPageChange={updateActivePage} />
              )}
            </div>
          )}
        </main>

        {showAddModal && (
          <AddPageModal onAdd={addPage} onClose={() => setShowAddModal(false)} />
        )}
      </section>
    </AppShell>
  )
}
