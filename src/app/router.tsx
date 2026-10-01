import { Route, Routes } from 'react-router'
import { AdminEditor } from '../features/admin/AdminEditor'
import { AdminOrdersPage } from '../features/admin/AdminOrdersPage'
import { AdminDashboard } from '../features/admin/AdminPages'
import { AuthPage } from '../features/auth/AuthPage'
import { RequireAdmin } from '../features/auth/RequireAdmin'
import { CartPage } from '../features/cart/CartPage'
import { CatalogBoundary } from '../features/catalog/CatalogBoundary'
import { CatalogPage } from '../features/catalog/pages/CatalogPage'
import { HomePage } from '../features/catalog/pages/HomePage'
import { ProductPage } from '../features/catalog/pages/ProductPage'
import { CheckoutPage } from '../features/orders/CheckoutPage'
import { OrderHistoryPage } from '../features/orders/OrderHistoryPage'
import { NotFoundPage } from '../shared/components/NotFoundPage'
import { AdminLayout } from './layouts/AdminLayout'
import { PublicLayout } from './layouts/PublicLayout'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<CatalogBoundary><HomePage /></CatalogBoundary>} />
        <Route path="productos" element={<CatalogBoundary><CatalogPage /></CatalogBoundary>} />
        <Route path="productos/:slug" element={<CatalogBoundary><ProductPage /></CatalogBoundary>} />
        <Route path="categorias/:slug" element={<CatalogBoundary><CatalogPage /></CatalogBoundary>} />
        <Route path="carrito" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="mis-solicitudes" element={<OrderHistoryPage />} />
        <Route path="login" element={<AuthPage key="login" mode="login" />} />
        <Route path="recuperar-acceso" element={<AuthPage key="reset" mode="reset" />} />
        <Route path="registro" element={<AuthPage key="register" mode="register" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<RequireAdmin />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="productos" element={<AdminEditor key="products" kind="products" />} />
          <Route path="categorias" element={<AdminEditor key="categories" kind="categories" />} />
          <Route path="solicitudes" element={<AdminOrdersPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
