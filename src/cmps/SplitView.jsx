import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Two-pane master/detail layout shared by inventory, orders, bar book and recipes.
 *
 * On desktop both panes are visible side by side. Below the breakpoint the list is
 * the page and the detail rises as a bottom sheet, so the same component serves
 * both without the caller branching on width.
 */
export function SplitView({ list, detail, hasSelection = false, onCloseDetail, wideList = false }) {
  const { t } = useTranslation()
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 860px)').matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const onChange = e => setIsNarrow(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Keep the page behind a sheet from scrolling under it.
  useEffect(() => {
    if (!isNarrow || !hasSelection) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isNarrow, hasSelection])

  useEffect(() => {
    if (!isNarrow || !hasSelection) return
    const onKey = e => { if (e.key === 'Escape') onCloseDetail?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isNarrow, hasSelection, onCloseDetail])

  if (isNarrow) {
    return (
      <div className="split-view is-narrow">
        <div className="split-list">{list}</div>
        {hasSelection && (
          <>
            <div className="sheet-scrim" onClick={onCloseDetail} />
            <div className="sheet" role="dialog" aria-modal="true">
              <button type="button" className="sheet-grab" onClick={onCloseDetail} aria-label={t('cancel')} />
              <div className="sheet-body">{detail}</div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={'split-view' + (wideList ? ' has-wide-list' : '')}>
      <div className="split-list">{list}</div>
      <div className="split-detail">{detail}</div>
    </div>
  )
}

/** Sticky header for either pane: a title, an optional count, and optional actions. */
export function PaneHeader({ title, count, children }) {
  return (
    <div className="pane-header">
      <h2 className="pane-title">{title}</h2>
      {count !== undefined && <span className="pane-count">{count}</span>}
      {children && <div className="pane-actions">{children}</div>}
    </div>
  )
}

/** Placeholder shown in the detail pane before anything is selected. */
export function EmptyDetail({ message }) {
  return <div className="empty-detail"><p>{message}</p></div>
}
