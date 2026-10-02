import type { UserRole } from './auth.models'

const authRoutes = new Set(['/login', '/registro', '/recuperar-acceso'])

export function postAuthDestination(role: UserRole, requestedPath?: string | null) {
  const requested = requestedPath?.trim()
  if (requested && requested.startsWith('/') && !requested.startsWith('//') && !authRoutes.has(requested)) {
    if (!requested.startsWith('/admin') || role === 'ADMIN') return requested
  }

  return role === 'ADMIN' ? '/admin' : '/productos'
}
