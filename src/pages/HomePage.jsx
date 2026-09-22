import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { OrdersGrowthBySupplierChart } from '../cmps/OrdersGrowthBySupplierChart'
import { SupplierOrdersSummary } from '../cmps/SupplierOrdersSummary'
import { loadItems } from '../store/actions/item.actions'
import { loadOrders } from '../store/actions/order.actions'
import { barBookService } from '../services/barBook.service'
import { AppShell } from '../cmps/AppShell'

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

  return (
    <AppShell title={t('home')} subtitle={displayDayName}>
      <div className="dash-kpis">
        <div className="k-card">
          <div className="k-value">{stats.totalItems}</div>
          <div className="k-label">{t('statTotalProducts')}</div>
        </div>
        <div className="k-card">
          <div className={'k-value' + (stats.lowStockItems > 0 ? ' is-critical' : '')}>
            {stats.lowStockItems}
          </div>
          <div className="k-label">{t('statLowStock')}</div>
        </div>
        <div className="k-card">
          <div className="k-value">{totalUnits}</div>
          <div className="k-label">{t('unitsInStock')}</div>
        </div>
        <div className="k-card">
          <div className="k-value">{pendingOrders}</div>
          <div className="k-label">{t('statPendingOrders')}</div>
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
                  <span className="bar-value">{row.units}</span>
                </div>
              ))}
              <p className="bar-legend">
                <span className="bar-swatch" aria-hidden="true" />
                {t('unitsInStock')} · {totalUnits}
              </p>
            </>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-head">
            <h3 className="dash-card-title">{t('lowStockAlerts')}</h3>
            {stats.lowStockItems > 0 && (
              <Link to="/items-management" className="dash-link">{t('viewAll')} →</Link>
            )}
          </div>
          {lowStockItems.length === 0 ? (
            <p className="dash-empty">{t('allStockOk')}</p>
          ) : (
            lowStockItems.slice(0, 6).map(item => (
              <Link key={item._id} to="/items-management" className="dash-row">
                <span>{item.name}</span>
                {(item.stockQuantity || 0) <= 0 ? (
                  <span className="tag is-critical">● {t('outOfStock')}</span>
                ) : (
                  <span className="tag is-warning">
                    ▲ {item.stockQuantity || 0} / {item.minStockLevel || 0}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="dash-split">
        <div className="dash-card">
          <div className="dash-card-head">
            <h3 className="dash-card-title">{t('recentOrders')}</h3>
            <Link to="/orders" className="dash-link">{t('viewAll')} →</Link>
          </div>
          {!orders || orders.length === 0 ? (
            <p className="dash-empty">{t('noOrders')}</p>
          ) : (
            orders.slice(0, 5).map(order => (
              <Link key={order._id} to="/orders" className="dash-row">
                <span>
                  <span className="dash-row-main">{order.supplier || t('noSupplier')}</span>
                  <span className="dash-row-sub">
                    {order.createdAt && new Date(order.createdAt).toLocaleDateString(
                      i18n.language === 'he' ? 'he-IL' : 'en-GB',
                      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )}
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

        <div className="dash-card">
          <h3 className="dash-card-title">{t('supplierOrdersSummaryTitle')}</h3>
          <SupplierOrdersSummary orders={orders} items={items} />
        </div>
      </div>

      <div className="dash-card">
        <OrdersGrowthBySupplierChart orders={orders} items={items} />
      </div>
    </AppShell>
  )
}
