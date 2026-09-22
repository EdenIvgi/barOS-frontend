import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { removeFromCart, updateCartItem, clearCart, checkout } from '../store/actions/order.actions'
import { Loader } from '../cmps/Loader'

export function OrderPage() {
  const { t } = useTranslation()
  const cart = useSelector((storeState) => storeState.orderModule.cart)
  const isLoading = useSelector((storeState) => storeState.orderModule.flag.isLoading)

  const totalUnits = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

  function handleQuantityChange(itemId, newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
    } else {
      updateCartItem(itemId, newQuantity)
    }
  }

  async function handleCheckout() {
    await checkout()
  }

  if (isLoading) return <Loader />

  return (
    <div className="order-page">
      <h1>{t('cartTitle')}</h1>
      {cart.length === 0 ? (
        <p>{t('cartEmpty')}</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.itemId} className="cart-item">
                <h3>{item.itemName}</h3>
                {item.supplier && (
                  <p className="cart-item-supplier">{t('supplierLabel')}: {item.supplier}</p>
                )}
                {item.volumeMl > 0 && <p>{item.volumeMl} {t('ml')}</p>}
                <div>
                  <label>
                    {t('quantityLabel')}:
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value))}
                    />
                  </label>
                </div>
                <button onClick={() => removeFromCart(item.itemId)}>{t('remove')}</button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h2>{t('totalUnitsLabel')}: {totalUnits}</h2>
            <button onClick={handleCheckout} disabled={isLoading}>
              {t('checkoutNow')}
            </button>
            <button onClick={clearCart}>{t('clearCart')}</button>
          </div>
        </>
      )}
    </div>
  )
}
