import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { formatVolume, formatQty } from '../services/util.service'
import { addToCart, updateCartItem, removeFromCart } from '../store/actions/order.actions'
import { IconMinus, IconPlus } from './icons'

/**
 * A catalogue card. The page exists to decide what to order, so the name leads,
 * the stock level is the number that answers "do I need this?", and the volume
 * and supplier are supporting detail — not the headline they used to be, where
 * an identical "700 ml" shouted from almost every card.
 */
export function ItemPreview({ item }) {
  const { t } = useTranslation()
  const cart = useSelector(state => state.orderModule.cart)
  const inCart = cart.find(c => c.itemId === item._id)
  const qty = inCart?.quantity ?? 0

  const stock = Number(item.stockQuantity) || 0
  const min = Number(item.minStockLevel) || 0
  const isOut = stock <= 0
  const isLow = !isOut && stock <= min

  const categoryName = typeof item.category === 'string'
    ? item.category
    : item.category?.name || ''

  const meta = [categoryName, item.supplier, formatVolume(item.volumeMl, t)]
    .filter(Boolean)
    .join(' · ')

  function stopLink(ev) {
    ev.preventDefault()
    ev.stopPropagation()
  }

  function onAdd(ev) {
    stopLink(ev)
    addToCart(item, 1)
  }

  function onStep(ev, delta) {
    stopLink(ev)
    const next = qty + delta
    if (next <= 0) removeFromCart(item._id)
    else updateCartItem(item._id, next)
  }

  return (
    <article className={'product-card' + (isOut ? ' is-out' : '')}>
      <Link to={`/products/${item._id}`} className="product-main">
        <h2 className="product-name">{item.name}</h2>
        {meta && <p className="product-meta">{meta}</p>}
      </Link>

      <div className="product-foot">
        <span className="product-stock">
          <span className={'product-stock-n' + (isOut ? ' is-critical' : isLow ? ' is-warning' : '')}>
            {formatQty(stock)}
          </span>
          <span className="product-stock-l">
            {isOut ? t('outOfStock') : isLow ? t('lowStockFilter') : t('stockLabel')}
          </span>
        </span>

        {isOut ? (
          <span className="tag is-critical">● {t('unavailable')}</span>
        ) : qty > 0 ? (
          <span className="stepper product-stepper">
            <button type="button" className="step-btn" onClick={e => onStep(e, -1)} aria-label={t('decrease')}>
              <IconMinus />
            </button>
            <span className="step-value">{qty}</span>
            <button type="button" className="step-btn" onClick={e => onStep(e, 1)} aria-label={t('increase')}>
              <IconPlus />
            </button>
          </span>
        ) : (
          <button type="button" className="btn-shell product-add" onClick={onAdd}>
            {t('addToCart')}
          </button>
        )}
      </div>
    </article>
  )
}
