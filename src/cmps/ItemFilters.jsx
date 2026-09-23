import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconFilter } from './icons'

/**
 * Filter controls above the stocktake list.
 *
 * At width the fields sit inline in the bar. On a phone they collapse behind a
 * Filter button — this screen exists for counting stock, and three selects plus
 * the page actions took most of the first screen before any item appeared.
 *
 * The responsive half is CSS (`display: contents` keeps the fields flat in the
 * bar on a desktop); this component only tracks whether the phone panel is open.
 */
export function ItemFilters({
  filters,
  uniqueCategories,
  uniqueSuppliers,
  onFilterChange,
  onClearFilters,
  children,
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const activeCount = [filters.category, filters.supplier, filters.stockStatus]
    .filter(Boolean).length

  return (
    <div className="list-filters">
      <button
        type="button"
        className={'btn-shell filters-toggle' + (activeCount ? ' has-active' : '')}
        onClick={() => setIsOpen(open => !open)}
        aria-expanded={isOpen}
      >
        <IconFilter />
        {t('filters')}
        {activeCount > 0 && <span className="filters-count">{activeCount}</span>}
      </button>

      {children && <div className="list-filters-actions">{children}</div>}

      <div className={'list-filters-fields' + (isOpen ? ' is-open' : '')}>
        <label className="pane-field">
          <span>{t('category')}</span>
          <select name="category" value={filters.category} onChange={onFilterChange}>
            <option value="">{t('all')}</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label className="pane-field">
          <span>{t('supplier')}</span>
          <select name="supplier" value={filters.supplier} onChange={onFilterChange}>
            <option value="">{t('all')}</option>
            {uniqueSuppliers.map((supplier) => (
              <option key={supplier} value={supplier}>{supplier}</option>
            ))}
          </select>
        </label>

        <label className="pane-field">
          <span>{t('stock')}</span>
          <select name="stockStatus" value={filters.stockStatus} onChange={onFilterChange}>
            <option value="">{t('all')}</option>
            <option value="inStock">{t('inStock')}</option>
            <option value="outOfStock">{t('outOfStock')}</option>
            <option value="lowStock">{t('lowStockFilter')}</option>
          </select>
        </label>

        {activeCount > 0 && (
          <button type="button" className="chip pane-clear" onClick={onClearFilters}>
            {t('clearFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
