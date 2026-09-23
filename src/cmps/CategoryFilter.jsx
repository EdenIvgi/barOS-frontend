import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
// Categories are now loaded from items, so we don't need to load from backend
// import { loadCategories } from '../store/actions/category.actions'

export function CategoryFilter({ filterBy, onSetFilter, selectedCategoryId }) {
  const { t, i18n } = useTranslation()
  const items = useSelector((storeState) => storeState.itemModule.items)

  // Extract unique category values from items
  const categories = useMemo(() => {
    if (!items || !Array.isArray(items)) return []
    
    const categoryMap = new Map()
    items.forEach((item) => {
      let categoryName = null
      let categoryId = null
      
      // Try to get category from different sources
      if (item.category) {
        if (typeof item.category === 'string') {
          categoryName = item.category
          categoryId = item.category
        } else if (item.category.name) {
          categoryName = item.category.name
          categoryId = item.category._id ? item.category._id.toString() : item.category.name
        }
      } else if (item.categoryId && typeof item.categoryId === 'string' && item.categoryId.length < 24) {
        // If categoryId is a short string (not ObjectId), it might be a category name
        categoryName = item.categoryId
        categoryId = item.categoryId
      }
      
      if (categoryName && !categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          _id: categoryId || categoryName,
          name: categoryName,
          nameEn: item.category?.nameEn || categoryName,
          icon: item.category?.icon || ''
        })
      }
    })
    
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  function handleCategoryClick(categoryId) {
    const newCategoryId = selectedCategoryId === categoryId ? '' : categoryId
    onSetFilter({ categoryId: newCategoryId, pageIdx: 0 })
  }

  return (
    <nav className="category-filter" aria-label={t('categoriesFilterTitle')}>
      <div className="category-buttons">
        <button
          type="button"
          className={`chip ${!selectedCategoryId ? 'is-on' : ''}`}
          onClick={() => handleCategoryClick('')}
        >
          {t('allCategoriesFilter')}
        </button>
        {categories.map((category) => {
          const catId = typeof category._id === 'object' ? category._id.toString() : String(category._id)
          const categoryKey = 'category_' + String(category.name).toUpperCase().replace(/\s+/g, '_')
          const isHebrew = (i18n.language || '').startsWith('he')
          const displayName = isHebrew
            ? t(categoryKey, { defaultValue: category.name })
            : (category.nameEn || category.name)
          return (
            <button
              key={catId}
              type="button"
              className={`chip ${
                selectedCategoryId === catId || selectedCategoryId === category.name ? 'is-on' : ''
              }`}
              onClick={() => handleCategoryClick(category.name)}
            >
              {displayName}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
