import { Link } from 'react-router'
import { EmptyState } from '../../shared/components/EmptyState'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login'
  return (
    <div>
      <EmptyState eyebrow="Tu espacio personal" title={isLogin ? 'Qué bueno verte por aquí.' : 'Un espacio para tus favoritos.'} description="Próximamente podrás crear tu cuenta y consultar tus pedidos. El acceso y el registro aún no están habilitados." />
      <p className="auth-switch"><Link to={isLogin ? '/registro' : '/login'}>{isLogin ? 'Ver registro' : 'Volver al acceso'}</Link></p>
    </div>
  )
}
