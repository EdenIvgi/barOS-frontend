import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NO_SUPPLIER_KEY } from '../services/constants'

function buildSupplierData(orders, inventoryItems = []) {
  if (!orders || orders.length === 0) return []

  // supplier → { productName → totalQty }
  const map = {}

  for (const order of orders) {
    if (!order.items?.length) continue
    for (const orderItem of order.items) {
      // Resolve supplier: from order item, then from inventory
      let supplier = orderItem.supplier
      if (!supplier || String(supplier).trim() === '') {
        const itemId = orderItem.itemId ?? orderItem._id
        if (itemId && inventoryItems.length) {
          const inv = inventoryItems.find(
            (i) => String(i._id) === String(itemId)
          )
          supplier = inv?.supplier ?? inv?.supplierName
        }
      }
      supplier = supplier ? String(supplier).trim() : NO_SUPPLIER_KEY

      const name = orderItem.itemName || orderItem.name || '—'
      const qty = Number(orderItem.quantity) || 0

      if (!map[supplier]) map[supplier] = {}
      map[supplier][name] = (map[supplier][name] || 0) + qty
    }
  }

  // Convert to sorted array
  return Object.entries(map)
    .map(([supplier, products]) => ({
      supplier,
      total: Object.values(products).reduce((s, v) => s + v, 0),
      products: Object.entries(products)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty),
    }))
    .sort((a, b) => b.total - a.total)
}

export function SupplierOrdersSummary({ orders, items = [] }) {
  const { t } = useTranslation()
  const supplierData = useMemo(
    () => buildSupplierData(orders, items),
    [orders, items]
  )
  const [expanded, setExpanded] = useState({})

  function toggleSupplier(supplier) {
    setExpanded((prev) => ({ ...prev, [supplier]: !prev[supplier] }))
  }

  if (!supplierData.length) return null

  const totalQty = supplierData.reduce((s, s2) => s + s2.total, 0)

  return (
    <div className="supplier-orders-summary">
      <div className="sos-header">
        <span className="sos-title">{t('supplierOrdersSummaryTitle')}</span>
        <span className="sos-total">{totalQty} {t('supplierOrdersTotalUnits')}</span>
      </div>

      <div className="sos-suppliers">
        {supplierData.map(({ supplier, total, products }) => {
          const isOpen = !!expanded[supplier]
          const pct = totalQty > 0 ? Math.round((total / totalQty) * 100) : 0

          return (
            <div key={supplier} className={`sos-supplier-row${isOpen ? ' open' : ''}`}>
              <button
                className="sos-supplier-btn"
                onClick={() => toggleSupplier(supplier)}
                aria-expanded={isOpen}
              >
                <span className="sos-supplier-name">{supplier}</span>
                <span className="sos-supplier-stats">
                  <span className="sos-supplier-total">{total}</span>
                  <span className="sos-supplier-pct">{pct}%</span>
                  <span className="sos-chevron">{isOpen ? '▲' : '▼'}</span>
                </span>
              </button>

              <div
                className="sos-track"
                title={`${supplier}: ${pct}%`}
                aria-hidden="true"
              >
                <div className="sos-fill" style={{ width: `${pct}%` }} />
              </div>

              {isOpen && (
                <div className="sos-products">
                  <div className="sos-products-header">
                    <span>{t('supplierOrdersProduct')}</span>
                    <span>{t('supplierOrdersQty')}</span>
                  </div>
                  {products.map(({ name, qty }) => (
                    <div key={name} className="sos-product-row">
                      <span className="sos-product-name">{name}</span>
                      <span className="sos-product-qty">{qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
