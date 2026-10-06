import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import './assets/style/main.scss'

import { MobileBottomNav } from './cmps/MobileBottomNav'
import { UserMsg } from './cmps/UserMsg'
import { About } from './pages/About'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { UserDetails } from './pages/UserDetails'
import { MenuPage } from './pages/MenuPage'
import { ItemDetails } from './pages/ItemDetails'
import { OrderPage } from './pages/OrderPage'
import { OrdersListPage } from './pages/OrdersListPage'
import { ItemsManagementPage } from './pages/ItemsManagementPage'
import { BarBookPage } from './pages/BarBookPage'
import { RecipesPage } from './pages/RecipesPage'
import { SetupPage } from './pages/SetupPage'
import { ProtectedRoute } from './cmps/ProtectedRoute'
import { ErrorBoundary } from './cmps/ErrorBoundary'
import { store } from './store/store'
import { loadCartFromStorage } from './store/actions/order.actions'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/**
 * Pages render their own chrome through AppShell (rail + topbar), so this layer
 * only carries what sits outside any single page: scroll reset and the phone nav.
 */
function AppLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    loadCartFromStorage()
  }, [])

  return (
    <>
      <ScrollToTop />
      {/* Keyed on the path so navigating away from a crashed page clears it. */}
      <ErrorBoundary resetKey={pathname}>
      <Routes>
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/user" element={<ProtectedRoute><UserDetails /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
        <Route path="/products/:itemId" element={<ProtectedRoute><ItemDetails /></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersListPage /></ProtectedRoute>} />
        <Route path="/items-management" element={<ProtectedRoute><ItemsManagementPage /></ProtectedRoute>} />
        <Route path="/bar-book" element={<ProtectedRoute><BarBookPage /></ProtectedRoute>} />
        <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
        <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
      </Routes>
      </ErrorBoundary>
      <MobileBottomNav />
    </>
  )
}

export function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
        <UserMsg />
      </Router>
    </Provider>
  )
}
