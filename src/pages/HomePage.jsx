import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { OrdersPerDayChart } from '../cmps/OrdersPerDayChart'
import { SupplierOrdersSummary } from '../cmps/SupplierOrdersSummary'
import { loadItems } from '../store/actions/item.actions'
import { loadOrders } from '../store/actions/order.actions'
import { barBookService } from '../services/barBook.service'
import { AppShell } from '../cmps/AppShell'
import { formatQty } from '../services/util.service'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const items = useSelector((storeState) => storeState.itemModule.items)
  const orders = useSelector((storeState) => storeState.orderModule.orders)
  const user = useSelector((storeState) => storeState.userModule.loggedInUser)
  const [barBookDailyTasks, setBarBookDailyTasks] = useState([])

  useEffect(() => {
    if (user) loadItems()
  }, [user])

  useEffect(() => {
    if (user) loadOrders()
  }, [user])

  useEffect(() => {
    if (!user) return
    barBookService
      .getContent()
      .then((data) => {
        const raw = Array.isArray(data?.dailyTasks) ? data.dailyTasks : []
        const tasks = raw.map((d) => ({
          day: d.day || '',
          task: typeof d.task !== 'undefined' ? String(d.task) : (Array.isArray(d.items) ? d.items.join('\n') : '')
        }))
        setBarBookDailyTasks(tasks)
      })
      .catch(() => setBarBookDailyTasks([]))
  }, [user])

  // An item needs reordering when it is at or below its alert threshold — including
  // when it has run out entirely, which is the most urgent case of all.
  const lowStockItems = items?.filter(item => {
    const stock = item.stockQuantity || 0
    const minLevel = item.minStockLevel || 0
    return stock <= minLevel
  }) || []

  // Calculate statistics
  const stats = {
    totalItems: items?.length || 0,
    availableItems: items?.filter(item => item.isAvailable).length || 0,
    unavailableItems: items?.filter(item => !item.isAvailable).length || 0,
    lowStockItems: lowStockItems.length,
    outOfStockItems: items?.filter(item => (item.stockQuantity || 0) <= 0).length || 0,
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter(order => order.status === 'pending').length || 0,
    todayOrders: orders?.filter(order => {
      if (!order.createdAt) return false
      const today = new Date()
      const orderDate = new Date(order.createdAt)
      return orderDate.toDateString() === today.toDateString()
    }).length || 0,
    todayUnits: orders?.filter(order => {
      if (!order.createdAt) return false
      const today = new Date()
      const orderDate = new Date(order.createdAt)
      return orderDate.toDateString() === today.toDateString()
    }).reduce((sum, order) => sum + (order.totalUnits || 0), 0) || 0
  }

  // Daily task
  const dayIndex = new Date().getDay()
  const todayEntry = barBookDailyTasks.find((entry) => {
    const day = entry?.day || ''
    // Match against both he and en day names via i18n keys
    return [0,1,2,3,4,5,6].some(i =>
      i === dayIndex && (
        day.includes(t('day_' + i, { lng: 'he' })) ||
        day.includes(t('day_' + i, { lng: 'en' }))
      )
    )
  })
  const todayTask = todayEntry?.task?.trim() || null
  const displayDayName = t('dayPrefix') ? `${t('dayPrefix')} ${t('day_' + dayIndex)}` : t('day_' + dayIndex)

  const totalUnits = items?.reduce((sum, i) => sum + (Number(i.stockQuantity) || 0), 0) || 0
  const pendingOrders = stats.pendingOrders

  // Units in stock per category — magnitude, so one hue for every bar.
  const byCategory = (() => {
    const map = new Map()
    for (const item of items || []) {
      const name = typeof item.category === 'string'
        ? item.category
        : item.category?.name || t('noCategory')
      map.set(name, (map.get(name) || 0) + (Number(item.stockQuantity) || 0))
    }
    const rows = [...map.entries()].map(([name, units]) => ({ name, units }))
    rows.sort((a, b) => b.units - a.units)
    const max = rows.length ? rows[0].units : 0
    return rows.map(r => ({ ...r, pct: max ? (r.units / max) * 100 : 0 }))
  })()

  const recentOrders = [...(orders || [])]
    .filter(Boolean)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5)

  function orderDate(order) {
    if (!order.createdAt) return ''
    return new Date(order.createdAt).toLocaleDateString(
      i18n.language === 'he' ? 'he-IL' : 'en-GB',
      { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    )
  }

  return (
    <AppShell title={t('home')} subtitle={displayDayName}>
      {/* What needs doing, before anything describing the past. */}
      <div className="dash-kpis">
        <div className="k-card">
          <div className={'k-value' + (stats.lowStockItems > 0 ? ' is-critical' : '')}>
            {stats.lowStockItems}
          </div>
          <div className="k-label">{t('statLowStock')}</div>
        </div>
        <div className="k-card">
          <div className={'k-value' + (pendingOrders > 0 ? ' is-warning' : '')}>{pendingOrders}</div>
          <div className="k-label">{t('statPendingOrders')}</div>
        </div>
        <div className="k-card">
          <div className="k-value">{stats.totalItems}</div>
          <div className="k-label">{t('statTotalProducts')}</div>
        </div>
        <div className="k-card">
          <div className="k-value">{formatQty(totalUnits)}</div>
          <div className="k-label">{t('unitsInStock')}</div>
        </div>
      </div>

      {todayTask && (
        <div className="dash-card daily-task">
          <div className="daily-task-header">
            <span className="daily-task-badge">{t('dailyTask')}</span>
            <span className="daily-task-day">{displayDayName}</span>
          </div>
          <p className="daily-task-text">{todayTask}</p>
        </div>
      )}

      {/* The one list worth acting on, given its own full-width block. */}
      <div className="dash-card">
        <div className="dash-card-head">
          <h3 className="dash-card-title">
            {t('lowStockAlerts')}
            {stats.lowStockItems > 0 && <span className="dash-count">{stats.lowStockItems}</span>}
          </h3>
          {stats.lowStockItems > 0 && (
            <Link to="/items-management" className="dash-link">{t('viewAll')} →</Link>
          )}
        </div>

        {lowStockItems.length === 0 ? (
          <p className="dash-empty">{t('allStockOk')}</p>
        ) : (
          <div className="reorder-grid">
            {lowStockItems.slice(0, 8).map(item => {
              const stock = item.stockQuantity || 0
              const optimal = item.optimalStockLevel || 0
              const need = Math.max(0, optimal - stock)
              return (
                <Link key={item._id} to="/items-management" className="reorder-card">
                  <span className="reorder-name">{item.name}</span>
                  <span className="reorder-sub">{item.supplier || t('noSupplier')}</span>
                  <span className="reorder-foot">
                    {stock <= 0 ? (
                      <span className="tag is-critical">● {t('outOfStock')}</span>
                    ) : (
                      <span className="tag is-warning">▲ {stock} / {item.minStockLevel || 0}</span>
                    )}
                    {need > 0 && <span className="reorder-need">+{need}</span>}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="dash-split">
        <div className="dash-card">
          <OrdersPerDayChart orders={orders} />
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h3 className="dash-card-title">{t('recentOrders')}</h3>
            <Link to="/orders" className="dash-link">{t('viewAll')} →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="dash-empty">{t('noOrders')}</p>
          ) : (
            recentOrders.map(order => (
              <Link key={order._id} to="/orders" className="dash-row">
                <span>
                  <span className="dash-row-main">{order.supplier || t('noSupplier')}</span>
                  <span className="dash-row-sub">
                    {orderDate(order)}
                    {order.items?.length ? ` · ${order.items.length} ${t('itemsCount')}` : ''}
                  </span>
                </span>
                <span className={'tag ' + (order.status === 'pending' ? 'is-warning' : 'is-ok')}>
                  {t('status_' + (order.status || 'pending'))}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="dash-split">
        <div className="dash-card">
          <h3 className="dash-card-title">{t('unitsByCategory')}</h3>
          {byCategory.length === 0 ? (
            <p className="dash-empty">{t('noProductsInSystem')}</p>
          ) : (
            <>
              {byCategory.map(row => (
                <div className="bar-row" key={row.name}>
                  <span className="bar-label">{row.name}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${row.pct}%` }} />
                  </span>
                  <span className="bar-value">{formatQty(row.units)}</span>
                </div>
              ))}
              <p className="bar-legend">
                <span className="bar-swatch" aria-hidden="true" />
                {t('unitsInStock')} · {formatQty(totalUnits)}
              </p>
            </>
          )}
        </div>

        <div className="dash-card">
          <SupplierOrdersSummary orders={orders} items={items} />
        </div>
      </div>
    </AppShell>
  )
}
