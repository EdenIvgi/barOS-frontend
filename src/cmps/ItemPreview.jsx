import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { addToCart } from '../store/actions/order.actions'

export function ItemPreview({ item }) {
  const { t } = useTranslation()
  function handleAddToCart(ev) {
    ev.preventDefault()
    ev.stopPropagation()
    addToCart(item, 1)
  }

  return (
    <Link to={`/products/${item._id}`}>
      <article className="item-preview flex flex-column align-center">
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.name} className="item-image" />
        )}
        <h2 className="item-name">{item.name}</h2>
        {item.description && (
          <p className="item-description">{item.description}</p>
        )}
        <div className="item-price">{item.volumeMl ? `${item.volumeMl} ${t('ml')}` : ''}</div>
        <div
          className={`item-availability ${item.isAvailable ? 'available' : 'unavailable'}`}
        >
          {item.isAvailable ? t('available') : t('unavailable')}
        </div>
        {item.stockQuantity > 0 && (
          <div className="item-stock">{t('stockLabel')}: {item.stockQuantity}</div>
        )}
        {item.isAvailable && (
          <button
            onClick={handleAddToCart}
            className="btn-add-to-cart"
            title={t('addToCart')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 17.9 19 19 19C20.1 19 21 18.1 21 17V13M9 19.5C9.8 19.5 10.5 20.2 10.5 21C10.5 21.8 9.8 22.5 9 22.5C8.2 22.5 7.5 21.8 7.5 21C7.5 20.2 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21C21.5 21.8 20.8 22.5 20 22.5C19.2 22.5 18.5 21.8 18.5 21C18.5 20.2 19.2 19.5 20 19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('addToCart')}
          </button>
        )}
      </article>
    </Link>
  )
}
