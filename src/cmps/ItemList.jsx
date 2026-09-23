import { useTranslation } from 'react-i18next'
import { ItemPreview } from './ItemPreview'

export function ItemList({ items, onAdd }) {
  const { t } = useTranslation()
  if (!items || !items.length) {
    return (
      <div className="item-list empty">
        <p>{t('noItemsFound')}</p>
        {onAdd && (
          <button className="btn-add" onClick={onAdd}>
            + {t('addFirstProduct')}
          </button>
        )}
      </div>
    )
  }

  return (
    <section className="item-list">
      <div className="products-grid">
        {items.map((item) => (
          <ItemPreview key={item._id} item={item} />
        ))}
      </div>
    </section>
  )
}
