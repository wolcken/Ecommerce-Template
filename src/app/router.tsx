import { Route, Routes } from 'react-router'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { HomePage } from '../features/catalog/pages/HomePage'
import { CatalogPage } from '../features/catalog/pages/CatalogPage'
import { ProductPage } from '../features/catalog/pages/ProductPage'
import { CartPage } from '../features/cart/CartPage'
import { AuthPage } from '../features/auth/AuthPage'
import { AdminDashboard, AdminProducts, AdminCategories } from '../features/admin/AdminPages'
import { NotFoundPage } from '../shared/components/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="productos" element={<CatalogPage />} />
        <Route path="productos/:slug" element={<ProductPage />} />
        <Route path="categorias/:slug" element={<CatalogPage />} />
        <Route path="carrito" element={<CartPage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="registro" element={<AuthPage mode="register" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="productos" element={<AdminProducts />} />
        <Route path="categorias" element={<AdminCategories />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
