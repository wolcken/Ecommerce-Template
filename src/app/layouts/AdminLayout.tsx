import { NavLink, Outlet } from 'react-router'
import { Brand } from '../../shared/components/Brand'

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <aside className="admin-sidebar">
        <Brand />
        <p className="eyebrow">Administración</p>
        <nav aria-label="Administración">
          <NavLink to="/admin" end>Resumen</NavLink>
          <NavLink to="/admin/productos">Productos</NavLink>
          <NavLink to="/admin/categorias">Categorías</NavLink>
        </nav>
        <NavLink className="back-link" to="/">← Volver a la tienda</NavLink>
      </aside>
      <div className="admin-body">
        <header className="admin-header"><span>Tu espacio de trabajo</span><span className="badge">Demostración</span></header>
        <div className="notice">Vista de ejemplo sin autenticación. Solo contiene datos ficticios y no permite guardar cambios.</div>
        <main id="contenido" tabIndex={-1} className="admin-content"><Outlet /></main>
      </div>
    </div>
  )
}
