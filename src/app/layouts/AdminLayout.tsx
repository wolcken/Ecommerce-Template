import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../../features/auth/auth.context'
import { SignOutButton } from '../../features/auth/SignOutButton'
import { Brand } from '../../shared/components/Brand'
import { runtime } from '../services/runtime'

export function AdminLayout() {
  const { state } = useAuth()
  const email = state.status === 'AUTHENTICATED' ? state.user.email : null
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
          <NavLink to="/admin/solicitudes">Solicitudes</NavLink>
        </nav>
        <NavLink className="back-link" to="/">← Volver a la tienda</NavLink>
      </aside>
      <div className="admin-body">
        <header className="admin-header">
          <span>Tu espacio de trabajo</span>
          <div className="admin-session">
            {email && <span className="admin-email">{email}</span>}
            <span className="badge">{runtime.mode === 'demo' ? 'Demostración' : 'Administración'}</span>
            <SignOutButton context="admin" />
          </div>
        </header>
        <div className="notice">{runtime.mode === 'demo' ? 'Vista de ejemplo sin persistencia.' : 'Las solicitudes se confirman manualmente; cada cambio de estado actualiza el inventario en una transacción.'}</div>
        <main id="contenido" tabIndex={-1} className="admin-content"><Outlet /></main>
      </div>
    </div>
  )
}
