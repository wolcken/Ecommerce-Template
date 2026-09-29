import { Navigate, Outlet, useLocation } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { useAuth } from './auth.context'
import { EmptyState } from '../../shared/components/EmptyState'

export function RequireAdmin() {
  const { state, error } = useAuth()
  const location = useLocation()
  if (runtime.mode === 'demo') return <Outlet />
  if (error) return <EmptyState title="No se pudo verificar tu acceso." description={error} />
  if (state.status === 'LOADING') return <p className="service-status" role="status">Verificando sesión…</p>
  if (state.status === 'ANONYMOUS') return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (state.user.role !== 'ADMIN') return <EmptyState eyebrow="Acceso restringido" title="Esta sección es para administradores." description="Tu cuenta puede seguir explorando la tienda." />
  return <Outlet />
}
