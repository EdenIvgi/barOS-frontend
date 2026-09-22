import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { checkout } from '../store/actions/order.actions'

export function CartIcon() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const cart = useSelector((storeState) => storeState.orderModule.cart)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalUnits = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  async function onCheckout() {
    setIsOpen(false)
    await checkout()
  }

  return (
    <div className="cart-icon-wrapper" ref={dropdownRef}>
      <button
        className="cart-icon-btn"
        onClick={() => setIsOpen(prev => !prev)}
        title="Cart"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
      </button>

      {isOpen && (
        <div className="cart-dropdown">
          {cart.length === 0 ? (
            <p className="cart-dropdown-empty">{t('cartEmpty')}</p>
          ) : (
            <>
              <ul className="cart-dropdown-items">
                {cart.map((item) => (
                  <li key={item.itemId} className="cart-dropdown-item">
                    <span className="cart-item-name">{item.itemName}</span>
                    <span className="cart-item-qty">x{item.quantity}</span>
                    <span className="cart-item-price">{item.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="cart-dropdown-total">
                <span>{t('totalLabel')}</span>
                <span>{totalUnits}</span>
              </div>
              <div className="cart-dropdown-actions">
                <Link
                  to="/order"
                  className="cart-dropdown-btn cart-btn-view"
                  onClick={() => setIsOpen(false)}
                >
                  {t('cartTitle')}
                </Link>
                <button
                  className="cart-dropdown-btn cart-btn-checkout"
                  onClick={onCheckout}
                >
                  {t('checkout')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
