import { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { loadOrders, removeOrder, updateOrder } from '../store/actions/order.actions'
import { loadItems } from '../store/actions/item.actions'
import { Loader } from '../cmps/Loader'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'
import { downloadOrderPdf } from '../services/orderPdf.service'
import { AppShell } from '../cmps/AppShell'
import { formatVolume, formatQty } from '../services/util.service'
import { SplitView, EmptyDetail } from '../cmps/SplitView'

const NO_SUPPLIER_KEY = '__no_supplier__'

// The old date x supplier grid grouped rows by matching translated labels, which
// broke whenever the wording changed. The list/detail layout groups by nothing, so
// that coupling is gone along with it.

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
  // Use the LOCAL calendar date, not UTC: toISOString() would push an order placed
  // after midnight (a normal bar shift) back onto the previous day.
  const d = new Date(timestamp)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}


export function OrdersListPage() {
  const { t, i18n } = useTranslation()
  const orders = useSelector((storeState) => storeState.orderModule.orders)
  const items = useSelector((storeState) => storeState.itemModule.items)
  const isLoading = useSelector((storeState) => storeState.orderModule.flag.isLoading)
  const [editingOrder, setEditingOrder] = useState(null)
  const [editingQuantities, setEditingQuantities] = useState({})
  const [deletedItemIndices, setDeletedItemIndices] = useState({}) // orderId -> number[]
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

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
          quantity: qty
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


  const selectedOrder = ordersFlatFiltered.find(o => o._id === selectedId) || null
  const isEditingSelected = selectedOrder && editingOrder === selectedOrder._id
  const deletedInSelected = selectedOrder ? (deletedItemIndices[selectedOrder._id] || []) : []

  const statusCounts = ordersFlatFiltered.reduce((acc, o) => {
    const s = o.status || 'pending'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const visibleOrders = statusFilter
    ? ordersFlatFiltered.filter(o => (o.status || 'pending') === statusFilter)
    : ordersFlatFiltered

  function orderDateLabel(order) {
    if (!order.createdAt) return ''
    return new Date(order.createdAt).toLocaleDateString(
      i18n.language === 'he' ? 'he-IL' : 'en-GB',
      { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    )
  }

  const listPane = (
    <>
      <div className="filter-row">
        <button
          type="button"
          className={'chip' + (statusFilter === '' ? ' is-on' : '')}
          onClick={() => setStatusFilter('')}
        >
          {t('all')} · {ordersFlatFiltered.length}
        </button>
        <button
          type="button"
          className={'chip' + (statusFilter === 'pending' ? ' is-on' : '')}
          onClick={() => setStatusFilter('pending')}
        >
          {t('status_pending')} · {statusCounts.pending || 0}
        </button>
        <button
          type="button"
          className={'chip' + (statusFilter === 'delivered' ? ' is-on' : '')}
          onClick={() => setStatusFilter('delivered')}
        >
          {t('status_delivered')} · {statusCounts.delivered || 0}
        </button>
      </div>

      <div className="filter-row date-filter">
        <label>
          {t('dateFrom')}
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </label>
        <label>
          {t('dateTo')}
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </label>
        {(dateFrom || dateTo) && (
          <button type="button" className="chip" onClick={() => { setDateFrom(''); setDateTo('') }}>
            {t('clearDateFilter')}
          </button>
        )}
      </div>

      <div className="pane-rows">
        {visibleOrders.length === 0 ? (
          <p className="empty-detail">{t('noOrdersInDateRange')}</p>
        ) : (
          visibleOrders.map(order => (
            <button
              type="button"
              key={order._id}
              className={'pane-row' + (order._id === selectedId ? ' is-selected' : '')}
              onClick={() => setSelectedId(order._id)}
            >
              <span>
                <span className="row-name">{getOrderSupplier(order, items) === NO_SUPPLIER_KEY
                  ? t('noSupplier')
                  : getOrderSupplier(order, items)}</span>
                <span className="row-sub">
                  {orderDateLabel(order)} · {order.items?.length || 0} {t('itemsCount')}
                </span>
              </span>
              <span className={'tag ' + (order.status === 'pending' ? 'is-warning' : 'is-ok')}>
                {t('status_' + (order.status || 'pending'))}
              </span>
            </button>
          ))
        )}
      </div>
    </>
  )

  const detailPane = !selectedOrder ? (
    <EmptyDetail message={t('selectOrderPrompt')} />
  ) : (
    <>
      <div className="detail-hero">
        <div className="detail-hero-row">
          <div>
            <h2 className="detail-title">
              {getOrderSupplier(selectedOrder, items) === NO_SUPPLIER_KEY
                ? t('noSupplier')
                : getOrderSupplier(selectedOrder, items)}
            </h2>
            <p className="detail-sub">
              {orderDateLabel(selectedOrder)} · {t('orderId')} #{(selectedOrder._id || '').slice(-6)}
            </p>
          </div>
          <span className={'tag ' + (selectedOrder.status === 'pending' ? 'is-warning' : 'is-ok')}>
            {t('status_' + (selectedOrder.status || 'pending'))}
          </span>
        </div>
      </div>

      <div className="detail-section">
        <h4>{t('itemColumn')}</h4>
        {(selectedOrder.items || []).length === 0 ? (
          <p className="dash-empty">{t('noItems')}</p>
        ) : (
          (selectedOrder.items || []).map((item, idx) => {
            const isDeleted = deletedInSelected.includes(idx)
            return (
              <div className={'kv' + (isDeleted ? ' is-removed' : '')} key={idx}>
                <span>
                  {item.name || t('itemNumber', { n: idx + 1 })}
                  {item.volumeMl ? ` · ${formatVolume(item.volumeMl, t)}` : ''}
                </span>
                {isEditingSelected ? (
                  <span className="row-edit">
                    <input
                      type="number"
                      min="0"
                      value={editingQuantities[idx] ?? item.quantity ?? 0}
                      onChange={e => handleQuantityChange(idx, e.target.value)}
                      disabled={isDeleted}
                      aria-label={t('quantityColumn')}
                    />
                    {isDeleted ? (
                      <button
                        type="button"
                        className="btn-shell"
                        onClick={() => handleUndoDeleteItem(selectedOrder._id, idx)}
                      >
                        {t('undo')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-shell"
                        onClick={() => handleDeleteItem(selectedOrder._id, idx)}
                        title={t('removeItemFromOrder')}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ) : (
                  <span>{formatQty(item.quantity ?? 0)}</span>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="detail-section">
        <h4>{t('summary')}</h4>
        <div className="kv">
          <span>{t('totalUnitsLabel')}</span>
          <span>
            {formatQty((selectedOrder.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0))}
          </span>
        </div>
        <div className="kv">
          <span>{t('itemsCount')}</span>
          <span>{selectedOrder.items?.length || 0}</span>
        </div>

        <div className="detail-actions">
          {isEditingSelected ? (
            <>
              <button type="button" className="btn-shell is-primary" onClick={() => handleSaveEdit(selectedOrder)}>
                {t('saveChanges')}
              </button>
              <button type="button" className="btn-shell" onClick={handleCancelEdit}>
                {t('cancel')}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-shell is-primary" onClick={() => handleEdit(selectedOrder)}>
                {t('edit')}
              </button>
              <button type="button" className="btn-shell" onClick={() => handleDownloadPdf(selectedOrder)}>
                {t('downloadPdf')}
              </button>
              <button type="button" className="btn-shell" onClick={() => handleDelete(selectedOrder._id)}>
                {t('deleteOrder')}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )

  return (
    <AppShell
      title={t('ordersListTitle')}
      subtitle={`${visibleOrders.length} ${t('itemsCount')}`}
      flush
    >
      {!orders || orders.length === 0 ? (
        <div className="empty-detail"><p>{t('noOrders')}</p></div>
      ) : (
        <SplitView
          list={listPane}
          detail={detailPane}
          hasSelection={!!selectedOrder}
          onCloseDetail={() => setSelectedId(null)}
        />
      )}
    </AppShell>
  )
}
