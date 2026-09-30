import { CheckoutPage } from '../features/orders/CheckoutPage'
import { RequireAdmin } from '../features/auth/RequireAdmin'
import { CatalogBoundary } from '../features/catalog/CatalogBoundary'
import { Route, Routes } from 'react-router'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { HomePage } from '../features/catalog/pages/HomePage'
import { CatalogPage } from '../features/catalog/pages/CatalogPage'
import { ProductPage } from '../features/catalog/pages/ProductPage'
import { CartPage } from '../features/cart/CartPage'
import { AuthPage } from '../features/auth/AuthPage'
import { AdminDashboard } from '../features/admin/AdminPages'
import { AdminEditor } from '../features/admin/AdminEditor'
import { NotFoundPage } from '../shared/components/NotFoundPage'

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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Route>
    </Routes>
  )
}
