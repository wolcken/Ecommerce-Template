import { Link } from 'react-router'
import { useCatalog } from '../catalog/catalog.context'

export function AdminDashboard() {
  const { products, categories, loading, error } = useCatalog()
  return <>
    <p className="eyebrow">Administración</p><h1>Tu catálogo, bajo control.</h1>
    <p className="page-intro">Gestiona productos, categorías, precios y existencias.</p>
    {loading && <p role="status">Cargando resumen público…</p>}
    {error && <p role="alert">El resumen público no está disponible. Puedes entrar a las secciones de administración para revisar la conexión del servidor.</p>}
    <div className="stat-grid">
      <Link className="stat-card" to="/admin/productos"><span>Productos publicados</span><strong>{loading || error ? '—' : products.length}</strong><span>Administrar productos ↗</span></Link>
      <Link className="stat-card" to="/admin/categorias"><span>Categorías publicadas</span><strong>{loading || error ? '—' : categories.length}</strong><span>Administrar categorías ↗</span></Link>
    </div>
    <section className="admin-next"><h2>Precios calculados al guardar.</h2><p>El servidor suma costo, ganancia fija y recargo. Las compras y reservas siguen deshabilitadas mientras se definen sus reglas.</p></section>
  </>
}
