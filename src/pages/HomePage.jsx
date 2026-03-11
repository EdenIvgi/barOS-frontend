import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { OrdersGrowthBySupplierChart } from '../cmps/OrdersGrowthBySupplierChart'
import { SupplierOrdersSummary } from '../cmps/SupplierOrdersSummary'
import { loadItems } from '../store/actions/item.actions'
import { loadOrders } from '../store/actions/order.actions'
import { barBookService } from '../services/barBook.service'

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

  // Calculate statistics
  const stats = {
    totalItems: items?.length || 0,
    availableItems: items?.filter(item => item.isAvailable).length || 0,
    unavailableItems: items?.filter(item => !item.isAvailable).length || 0,
    lowStockItems: items?.filter(item => {
      const stock = item.stockQuantity || 0
      const minLevel = item.minStockLevel || 0
      return stock <= minLevel && stock > 0
    }).length || 0,
    outOfStockItems: items?.filter(item => (item.stockQuantity || 0) <= 0).length || 0,
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter(order => order.status === 'pending').length || 0,
    todayOrders: orders?.filter(order => {
      if (!order.createdAt) return false
      const today = new Date()
      const orderDate = new Date(order.createdAt)
      return orderDate.toDateString() === today.toDateString()
    }).length || 0,
    todayRevenue: orders?.filter(order => {
      if (!order.createdAt) return false
      const today = new Date()
      const orderDate = new Date(order.createdAt)
      return orderDate.toDateString() === today.toDateString()
    }).reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0
  }

  const lowStockItems = items?.filter(item => {
    const stock = item.stockQuantity || 0
    const minLevel = item.minStockLevel || 0
    return stock <= minLevel && stock > 0
  }) || []

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

  return (
    <section className="home-page">

      {/* Bento grid: stats */}
      <div className="home-top-grid">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>{stats.totalItems}</h3>
            <p>{t('statTotalProducts')}</p>
          </div>
          <div className="stat-card">
            <h3>{stats.availableItems}</h3>
            <p>{t('statAvailableProducts')}</p>
          </div>
          <div className="stat-card">
            <h3>{stats.lowStockItems}</h3>
            <p>{t('statLowStock')}</p>
          </div>
          <div className="stat-card">
            <h3>{stats.totalOrders}</h3>
            <p>{t('statTotalOrders')}</p>
          </div>
        </div>
      </div>

      {/* Daily Task */}
      {todayTask && (
        <div className="daily-task-card">
          <div className="daily-task-header">
            <span className="daily-task-badge">{t('dailyTask')}</span>
            <span className="daily-task-day">{displayDayName}</span>
          </div>
          <p className="daily-task-text">{todayTask}</p>
        </div>
      )}

      {/* Chart */}
      <OrdersGrowthBySupplierChart orders={orders} items={items} />

      {/* Supplier × Product orders summary */}
      <SupplierOrdersSummary orders={orders} items={items} />

      {/* Bottom split: orders + alerts */}
      <div className="home-bottom-grid">
        {/* Recent Orders */}
        {orders && orders.length > 0 && (
          <div className="recent-orders">
            <div className="section-header">
              <h2>{t('recentOrders')}</h2>
              <Link
                to="/orders"
                className="view-all-link"
              >
                {t('viewAll')} →
              </Link>
            </div>
            <div className="orders-list">
              {orders
                .slice(0, 3)
                .map(order => (
                  <Link
                    key={order._id}
                    to="/orders"
                    className="order-item"
                  >
                    <div className="order-content">
                      <div className="order-info">
                        <div className="order-id">
                          {t('orderId')} #{order._id?.toString().slice(-6) || 'N/A'}
                        </div>
                        <div className="order-date">
                          {order.createdAt && new Date(order.createdAt).toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-GB', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {order.items && order.items.length > 0 && (
                          <div className="order-items-count">
                            {order.items.length} {t('itemsCount')}
                          </div>
                        )}
                      </div>
                      <div className={`order-status ${order.status || 'pending'}`}>
                        {t('status_' + (order.status || 'pending'))}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {stats.lowStockItems > 0 && (
          <div className="low-stock-alerts">
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('lowStockAlerts')} ({stats.lowStockItems})
            </h2>
            <div className="alerts-grid">
              {lowStockItems
                .slice(0, 6)
                .map(item => (
                  <Link
                    key={item._id}
                    to="/items-management"
                    className="alert-item"
                  >
                    <div className="item-name">{item.name}</div>
                    <div className="item-details">
                      {t('stockLabel')}: {item.stockQuantity || 0} | {t('alertThresholdLabel')}: {item.minStockLevel || 0}
                    </div>
                  </Link>
                ))}
            </div>
            {stats.lowStockItems > 6 && (
              <div style={{ textAlign: 'center' }}>
                <Link
                  to="/items-management"
                  className="view-all-link"
                >
                  {t('viewAllLowStock')} ({stats.lowStockItems})
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  )
}
