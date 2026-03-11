import { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { loadOrders, removeOrder, updateOrder } from '../store/actions/order.actions'
import { loadItems } from '../store/actions/item.actions'
import { Loader } from '../cmps/Loader'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'
import { downloadOrderPdf } from '../services/orderPdf.service'

const NO_SUPPLIER_KEY = '__no_supplier__'
const COMBINED_ORDER_KEY = '__combined_order__'
const COMBINED_ORDER_LABELS = ['הזמנה משולבת', 'Combined order', 'Combined Order']

function normalizeSupplier(supplier) {
  if (!supplier || supplier === NO_SUPPLIER_KEY) return supplier
  return COMBINED_ORDER_LABELS.includes(supplier) ? COMBINED_ORDER_KEY : supplier
}

function getOrderSupplier(order, inventoryItems = []) {
  if (!order) return NO_SUPPLIER_KEY
  const fromOrder = order.supplier
  if (fromOrder != null && String(fromOrder).trim() !== '') {
    return String(fromOrder).trim()
  }
  if (!order.items?.length || !inventoryItems?.length) return NO_SUPPLIER_KEY
  for (const orderItem of order.items) {
    const itemId = orderItem.itemId ?? orderItem._id
    if (!itemId) continue
    const inv = inventoryItems.find(
      (i) => String(i._id) === String(itemId) || i._id?.toString() === String(itemId)
    )
    const s = inv?.supplier ?? inv?.supplierName
    if (s != null && String(s).trim() !== '') return String(s).trim()
  }
  return NO_SUPPLIER_KEY
}

function toDateKey(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toISOString().slice(0, 10)
}

const iconSize = 16
const iconProps = { width: iconSize, height: iconSize, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' }

const IconDownload = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconEdit = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconDelete = () => (
  <svg {...iconProps} aria-hidden>
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconSave = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconCancel = () => (
  <svg {...iconProps} aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconUndo = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M3 7v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function OrdersListPage() {
  const { t } = useTranslation()
  const orders = useSelector((storeState) => storeState.orderModule.orders)
  const items = useSelector((storeState) => storeState.itemModule.items)
  const isLoading = useSelector((storeState) => storeState.orderModule.flag.isLoading)
  const [editingOrder, setEditingOrder] = useState(null)
  const [editingQuantities, setEditingQuantities] = useState({})
  const [deletedItemIndices, setDeletedItemIndices] = useState({}) // orderId -> number[]
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const uniqueDates = useMemo(() => {
    const keys = new Set()
    ;(orders || []).forEach((o) => {
      const key = toDateKey(o.createdAt)
      if (key) keys.add(key)
    })
    return Array.from(keys).sort((a, b) => b.localeCompare(a))
  }, [orders])

  const uniqueSuppliers = useMemo(() => {
    const set = new Set()
    ;(orders || []).forEach((o) => {
      const s = normalizeSupplier(getOrderSupplier(o, items))
      if (s) set.add(s)
    })
    return Array.from(set).sort((a, b) => (a === NO_SUPPLIER_KEY ? 1 : b === NO_SUPPLIER_KEY ? -1 : a === COMBINED_ORDER_KEY ? -1 : b === COMBINED_ORDER_KEY ? 1 : a.localeCompare(b)))
  }, [orders, items])

  const ordersByDateAndSupplier = useMemo(() => {
    const map = {}
    ;(orders || []).filter(Boolean).forEach((order) => {
      const dateKey = toDateKey(order.createdAt)
      const supplier = normalizeSupplier(getOrderSupplier(order, items))
      if (!dateKey) return
      if (!map[dateKey]) map[dateKey] = {}
      if (!map[dateKey][supplier]) map[dateKey][supplier] = []
      map[dateKey][supplier].push(order)
    })
    return map
  }, [orders, items])

  useEffect(() => {
    loadItems()
    loadOrders()
  }, [])

  async function handleDelete(orderId) {
    if (!window.confirm(t('confirmDeleteOrder'))) return
    try {
      await removeOrder(orderId)
      showSuccessMsg(t('orderDeletedSuccess'))
    } catch {
      showErrorMsg(t('orderDeleteError'))
    }
  }

  function handleEdit(order) {
    setEditingOrder(order._id)
    setEditingQuantities(
      Object.fromEntries((order.items || []).map((item, i) => [i, item.quantity || 0]))
    )
    setDeletedItemIndices((prev) => ({ ...prev, [order._id]: [] }))
  }

  function handleCancelEdit() {
    const current = editingOrder
    setEditingOrder(null)
    setEditingQuantities({})
    setDeletedItemIndices((prev) => {
      const next = { ...prev }
      if (current) delete next[current]
      return next
    })
  }

  function handleDeleteItem(orderId, idx) {
    setDeletedItemIndices((prev) => ({
      ...prev,
      [orderId]: [...new Set([...(prev[orderId] || []), idx])].sort((a, b) => a - b)
    }))
  }

  function handleUndoDeleteItem(orderId, idx) {
    setDeletedItemIndices((prev) => ({
      ...prev,
      [orderId]: (prev[orderId] || []).filter((i) => i !== idx)
    }))
  }

  function handleQuantityChange(itemIndex, newQuantity) {
    setEditingQuantities((prev) => ({ ...prev, [itemIndex]: Math.max(0, Number(newQuantity) || 0) }))
  }

  async function handleSaveEdit(order) {
    try {
      const deleted = deletedItemIndices[order._id] || []
      const keptIndices = (order.items || []).map((_, i) => i).filter((i) => !deleted.includes(i))
      const updatedItems = keptIndices.map((origIdx) => {
        const item = order.items[origIdx]
        const qty = editingQuantities[origIdx] ?? 0
        return {
          ...item,
          quantity: qty,
          subtotal: (item.price || 0) * qty
        }
      })
      const updatedOrder = {
        ...order,
        items: updatedItems,
        supplier: order.supplier != null ? String(order.supplier) : getOrderSupplier(order, items)
      }
      const result = await updateOrder(updatedOrder)
      if (result) {
        showSuccessMsg(t('orderUpdatedSuccess'))
        setEditingOrder(null)
        setEditingQuantities({})
        setDeletedItemIndices((prev) => {
          const next = { ...prev }
          delete next[order._id]
          return next
        })
      } else {
        showErrorMsg(t('orderUpdateError'))
        await loadOrders()
      }
    } catch {
      showErrorMsg(t('orderUpdateError'))
      await loadOrders()
    }
  }

  async function handleDownloadPdf(order) {
    const dateKey = toDateKey(order.createdAt)
    const supplier = getOrderSupplier(order, items)
    const name = `order-${dateKey}-${supplier.replace(/[/\\?*:|"]/g, '-')}-${(order._id || '').slice(-6)}`
    try {
      await downloadOrderPdf(order, name, supplier)
    } catch (e) {
      showErrorMsg(t('pdfError'))
    }
  }

  function formatDate(dateKey) {
    if (!dateKey) return ''
    const [y, m, d] = dateKey.split('-')
    return `${d}/${m}/${y}`
  }

  // Flat list of orders sorted by date desc for mobile
  const ordersFlat = useMemo(() => {
    return [...(orders || [])]
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [orders])

  // Filter by date range (mobile)
  const ordersFlatFiltered = useMemo(() => {
    if (!dateFrom && !dateTo) return ordersFlat
    return ordersFlat.filter((order) => {
      const key = toDateKey(order.createdAt)
      if (!key) return false
      if (dateFrom && key < dateFrom) return false
      if (dateTo && key > dateTo) return false
      return true
    })
  }, [ordersFlat, dateFrom, dateTo])

  if (isLoading) return <Loader />

  return (
    <div className="orders-list-page orders-grid-page">
      {uniqueDates.length === 0 || uniqueSuppliers.length === 0 ? (
        <p className="empty-message">{t('noOrders')}</p>
      ) : (
        <>
        {/* Mobile date filter */}
        <div className="mobile-date-filter">
          <div className="mobile-date-filter-row">
            <label>
              <span className="mobile-date-label">{t('dateFrom')}</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mobile-date-input"
              />
            </label>
            <label>
              <span className="mobile-date-label">{t('dateTo')}</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mobile-date-input"
              />
            </label>
          </div>
          <div className="mobile-date-filter-actions">
            <button
              type="button"
              className="btn-clear-date"
              onClick={() => { setDateFrom(''); setDateTo('') }}
            >
              {t('clearDateFilter')}
            </button>
          </div>
        </div>

        {/* Mobile flat list */}
        <div className="mobile-orders-list">
          {ordersFlatFiltered.length === 0 && (dateFrom || dateTo) ? (
            <p className="empty-message mobile-filter-empty">{t('noOrdersInDateRange')}</p>
          ) : null}
          {ordersFlatFiltered.map((order) => {
            const dateKey = toDateKey(order.createdAt)
            const supplier = getOrderSupplier(order, items)
            const isExpanded = expandedOrderId === order._id
            const isEditing = editingOrder === order._id
            const count = order.items?.length || 0
            return (
              <div key={order._id} className={`mobile-order-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="mobile-order-head" onClick={() => setExpandedOrderId((id) => id === order._id ? null : order._id)}>
                  <div className="mobile-order-meta">
                    <span className="mobile-order-date">{formatDate(dateKey)}</span>
                    <span className="mobile-order-supplier">{supplier === NO_SUPPLIER_KEY ? t('noSupplier') : supplier === COMBINED_ORDER_KEY ? t('combinedOrderLabel') : supplier}</span>
                  </div>
                  <div className="mobile-order-right">
                    <span className="mobile-order-count">{count} {t('itemsCount')}</span>
                    <div className="mobile-order-actions" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn-download-pdf btn-icon" onClick={() => handleDownloadPdf(order)} title={t('downloadPdf')}><IconDownload /></button>
                      {isEditing ? (
                        <>
                          <button type="button" className="btn-save btn-icon" onClick={() => handleSaveEdit(order)} title={t('saveChanges')}><IconSave /></button>
                          <button type="button" className="btn-cancel btn-icon" onClick={handleCancelEdit} title={t('cancel')}><IconCancel /></button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn-edit btn-icon" onClick={() => handleEdit(order)} title={t('edit')}><IconEdit /></button>
                          <button type="button" className="btn-delete btn-icon" onClick={() => handleDelete(order._id)} title={t('deleteOrder')}><IconDelete /></button>
                        </>
                      )}
                    </div>
                    <span className="mobile-order-toggle">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mobile-order-detail" onClick={(e) => e.stopPropagation()}>
                    {order.items?.length ? (
                      <table className="order-items-table">
                        <thead>
                          <tr>
                            <th>{t('itemColumn')}</th>
                            <th>{t('quantityColumn')}</th>
                            {isEditing && <th className="th-actions" title={t('delete')}><IconDelete /></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => {
                            const isDeleted = (deletedItemIndices[order._id] || []).includes(idx)
                            if (isDeleted) {
                              return (
                                <tr key={idx} className="row-deleted">
                                  <td colSpan={isEditing ? 3 : 2}>
                                    <span className="item-removed">{item.name || t('itemNumber', { n: idx + 1 })} {t('itemRemoved')}</span>
                                    <button type="button" className="btn-undo-item btn-icon" onClick={() => handleUndoDeleteItem(order._id, idx)} title={t('undo')}><IconUndo /></button>
                                  </td>
                                </tr>
                              )
                            }
                            return (
                              <tr key={idx}>
                                <td>{item.name || t('itemNumber', { n: idx + 1 })}</td>
                                <td>
                                  {isEditing ? (
                                    <input type="number" min="0" value={editingQuantities[idx] ?? 0} onChange={(e) => handleQuantityChange(idx, e.target.value)} />
                                  ) : (
                                    item.quantity ?? 0
                                  )}
                                </td>
                                {isEditing && (
                                  <td className="td-actions">
                                    <button type="button" className="btn-delete-item btn-icon" onClick={() => handleDeleteItem(order._id, idx)} title={t('removeItemFromOrder')}><IconDelete /></button>
                                  </td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="empty-message">{t('noItems')}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Desktop grid table */}
        <div className="orders-grid-wrapper">
          <table className="orders-grid-table">
            <thead>
              <tr>
                <th className="col-date">{t('dateColumn')}</th>
                {uniqueSuppliers.map((supplier) => (
                  <th key={supplier} className="col-supplier">
                    {supplier === NO_SUPPLIER_KEY
                      ? t('noSupplier')
                      : supplier === COMBINED_ORDER_KEY
                      ? t('combinedOrderLabel')
                      : supplier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueDates.map((dateKey) => (
                <tr key={dateKey}>
                  <td className="cell-date">{formatDate(dateKey)}</td>
                  {uniqueSuppliers.map((supplier) => {
                    const cellOrders = ordersByDateAndSupplier[dateKey]?.[supplier] || []
                    return (
                      <td key={supplier} className="cell-orders">
                        {cellOrders.length === 0 ? (
                          <span className="cell-empty">—</span>
                        ) : (
                          <div className="cell-order-list">
                            {cellOrders.map((order) => {
                              const isExpanded = expandedOrderId === order._id
                              const count = order.items?.length || 0
                              return (
                                <div
                                  key={order._id}
                                  className={`cell-order-card ${isExpanded ? 'expanded' : ''}`}
                                >
                                  <div className="cell-order-head">
                                    <span
                                      className="cell-order-summary"
                                      onClick={() => setExpandedOrderId((id) => (id === order._id ? null : order._id))}
                                    >
                                      {count} {t('itemsCount')}
                                    </span>
                                    <div className="cell-order-actions" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        className="btn-download-pdf btn-icon"
                                        onClick={() => handleDownloadPdf(order)}
                                        title={t('downloadPdf')}
                                      >
                                        <IconDownload />
                                      </button>
                                      {editingOrder === order._id ? (
                                        <>
                                          <button type="button" className="btn-save btn-icon" onClick={() => handleSaveEdit(order)} title={t('saveChanges')}>
                                            <IconSave />
                                          </button>
                                          <button type="button" className="btn-cancel btn-icon" onClick={handleCancelEdit} title={t('cancel')}>
                                            <IconCancel />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button type="button" className="btn-edit btn-icon" onClick={() => handleEdit(order)} title={t('edit')}>
                                            <IconEdit />
                                          </button>
                                          <button type="button" className="btn-delete btn-icon" onClick={() => handleDelete(order._id)} title={t('deleteOrder')}>
                                            <IconDelete />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                    <span
                                      className="cell-order-toggle"
                                      onClick={() => setExpandedOrderId((id) => (id === order._id ? null : order._id))}
                                    >
                                      {isExpanded ? '▲' : '▼'}
                                    </span>
                                  </div>
                                  {isExpanded && (
                                    <div className="cell-order-detail" onClick={(e) => e.stopPropagation()}>
                                      {order.items?.length ? (
                                        <table className="order-items-table">
                                          <thead>
                                            <tr>
                                              <th>{t('itemColumn')}</th>
                                              <th>{t('quantityColumn')}</th>
                                              {editingOrder === order._id && <th className="th-actions" title={t('delete')}><IconDelete /></th>}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {order.items.map((item, idx) => {
                                              const isDeleted = (deletedItemIndices[order._id] || []).includes(idx)
                                              if (isDeleted) {
                                                return (
                                                  <tr key={idx} className="row-deleted">
                                                    <td colSpan={editingOrder === order._id ? 3 : 2}>
                                                      <span className="item-removed">{item.name || t('itemNumber', { n: idx + 1 })} {t('itemRemoved')}</span>
                                                      <button
                                                        type="button"
                                                        className="btn-undo-item btn-icon"
                                                        onClick={() => handleUndoDeleteItem(order._id, idx)}
                                                        title={t('undo')}
                                                      >
                                                        <IconUndo />
                                                      </button>
                                                    </td>
                                                  </tr>
                                                )
                                              }
                                              return (
                                                <tr key={idx}>
                                                  <td>{item.name || t('itemNumber', { n: idx + 1 })}</td>
                                                  <td>
                                                    {editingOrder === order._id ? (
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        value={editingQuantities[idx] ?? 0}
                                                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                      />
                                                    ) : (
                                                      item.quantity ?? 0
                                                    )}
                                                  </td>
                                                  {editingOrder === order._id && (
                                                    <td className="td-actions">
                                                      <button
                                                        type="button"
                                                        className="btn-delete-item btn-icon"
                                                        onClick={() => handleDeleteItem(order._id, idx)}
                                                        title={t('removeItemFromOrder')}
                                                      >
                                                        <IconDelete />
                                                      </button>
                                                    </td>
                                                  )}
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <p className="empty-message">{t('noItems')}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}
