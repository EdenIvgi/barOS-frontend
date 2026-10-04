import { useTranslation } from 'react-i18next'

/**
 * The flat tab row.
 *
 * Replaces a sidebar that, on a phone, stacked the whole page list above the
 * content so you scrolled past all of it to reach anything. One line that scrolls
 * sideways instead, and the page you are on is the top level rather than the
 * third level down.
 *
 * Rename, delete and add only appear in edit mode, which is why a bartender
 * running a shift sees nothing here but the names of the pages.
 */
function renderIcon(Icon) {
  return Icon ? <Icon /> : null
}

export function BarBookTabs({
  pages,
  activePageId,
  editingTitle,
  isAdmin,
  isEditing,
  onSelect,
  onAdd,
  onDelete,
  onEditTitle,
  onTitleChange,
  onCommitTitle,
  iconFor,
  titleFor,
}) {
  const { t } = useTranslation()

  return (
    <div className="bb-tabs" role="tablist">
      {pages.map(page => {
        const isActive = page._id === activePageId

        if (editingTitle?.id === page._id) {
          return (
            <input
              key={page._id}
              className="bb-tab-input"
              value={editingTitle.value}
              autoFocus
              aria-label={t('rename')}
              onChange={e => onTitleChange(e.target.value)}
              onBlur={() => onCommitTitle(page)}
              onKeyDown={e => {
                if (e.key === 'Enter') onCommitTitle(page)
                if (e.key === 'Escape') onEditTitle(null)
              }}
            />
          )
        }

        return (
          <div className={'bb-tab' + (isActive ? ' is-active' : '')} key={page._id}>
            <button
              type="button"
              className="bb-tab-btn"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(page._id)}
            >
              <span className="bb-tab-symbol" aria-hidden="true">{renderIcon(iconFor(page.type))}</span>
              <span className="bb-tab-label">{titleFor(page)}</span>
            </button>

            {isAdmin && isEditing && (
              <span className="bb-tab-actions">
                <button
                  type="button"
                  className="btn-icon"
                  title={t('rename')}
                  onClick={() => onEditTitle({ id: page._id, value: titleFor(page) })}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  title={t('delete')}
                  onClick={() => onDelete(page._id)}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )
      })}

      {isAdmin && isEditing && (
        <button type="button" className="bb-tab-add" onClick={onAdd} title={t('addPage')}>
          +
        </button>
      )}
    </div>
  )
}
