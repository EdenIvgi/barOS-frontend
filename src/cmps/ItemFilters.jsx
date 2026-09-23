import { useTranslation } from 'react-i18next'

/**
 * Filter controls above the stocktake list. Each control keeps a fixed width so
 * they read as a compact group at any screen size; the result count lives in the
 * topbar rather than being repeated here.
 */
export function ItemFilters({
  filters,
  uniqueCategories,
  uniqueSuppliers,
  onFilterChange,
  onClearFilters,
}) {
  const { t } = useTranslation()
  const hasFilters = !!(filters.category || filters.supplier || filters.stockStatus)

  return (
    <div className="list-filters">
      <label className="pane-field">
        <span>{t('category')}</span>
        <select name="category" value={filters.category} onChange={onFilterChange}>
          <option value="">{t('allCategories')}</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </label>

      <label className="pane-field">
        <span>{t('supplier')}</span>
        <select name="supplier" value={filters.supplier} onChange={onFilterChange}>
          <option value="">{t('allSuppliers')}</option>
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

      {hasFilters && (
        <button type="button" className="chip pane-clear" onClick={onClearFilters}>
          {t('clearFilters')}
        </button>
      )}
    </div>
  )
}
