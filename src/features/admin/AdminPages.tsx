import { Link } from 'react-router'
import { useCatalog } from '../catalog/catalog.context'

export function AdminDashboard() {
  const { products, categories, loading, error } = useCatalog()
  return (
    <>
      <p className="eyebrow">Administración</p>
      <h1>Tu catálogo y solicitudes, bajo control.</h1>
      <p className="page-intro">Gestiona productos, precios, existencias, pedidos y reservas.</p>
      {loading && <p role="status">Cargando resumen público…</p>}
      {error && <p role="alert">El resumen público no está disponible. Revisa la conexión de Firebase.</p>}
      <div className="stat-grid">
        <Link className="stat-card" to="/admin/productos"><span>Productos publicados</span><strong>{loading || error ? '—' : products.length}</strong><span>Administrar productos ↗</span></Link>
        <Link className="stat-card" to="/admin/categorias"><span>Categorías publicadas</span><strong>{loading || error ? '—' : categories.length}</strong><span>Administrar categorías ↗</span></Link>
        <Link className="stat-card" to="/admin/solicitudes"><span>Operación comercial</span><strong>↗</strong><span>Revisar solicitudes</span></Link>
      </div>
      <section className="admin-next">
        <h2>Confirmación manual.</h2>
        <p>Los precios se recalculan desde datos privados y las existencias se comprometen solo al confirmar.</p>
      </section>
    </>
  )
}
