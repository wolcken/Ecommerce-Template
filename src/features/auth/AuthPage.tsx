import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { EmptyState } from '../../shared/components/EmptyState'
import { useAuth } from './auth.context'

export function AuthPage({ mode }: { mode: 'login' | 'register' | 'reset' }) {
  const { state, error } = useAuth()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState('')

  if (runtime.mode !== 'firebase') {
    return <EmptyState title="Tu cuenta requiere Firebase." description="Puedes seguir explorando el catálogo de demostración." />
  }

  const service = runtime.auth

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const email = String(values.get('email') ?? '')
    const password = String(values.get('password') ?? '')
    if (mode === 'register' && password !== values.get('confirmation')) {
      setFeedback('Las contraseñas no coinciden.')
      return
    }
    setPending(true)
    setFeedback('')
    const result = await (
      mode === 'login'
        ? service.signIn(email, password)
        : mode === 'register'
          ? service.register(email, password)
          : service.requestPasswordReset(email)
    )
    setPending(false)
    if (!result.ok) setFeedback(result.error.message)
    else {
      form.reset()
      setFeedback(mode === 'reset' ? 'Si existe una cuenta con ese correo, recibirás instrucciones para recuperar el acceso.' : '')
    }
  }

  if (error) return <EmptyState title="No se pudo verificar tu sesión." description={error} />
  if (state.status === 'LOADING') return <p className="service-status" role="status">Verificando sesión…</p>
  if (state.status === 'AUTHENTICATED') {
    return (
      <section className="auth-panel">
        <p className="eyebrow">Mi cuenta</p>
        <h1>Ya estás dentro.</h1>
        <p>{state.user.email}</p>
        <Link className="button" to="/cuenta">Completar mi perfil</Link>
        {state.user.role === 'ADMIN' && <Link className="button secondary-button" to="/admin">Ir a administración</Link>}
      </section>
    )
  }

  return (
    <section className="auth-panel">
      <p className="eyebrow">Tu espacio personal</p>
      <h1>{mode === 'register' ? 'Crea tu cuenta.' : mode === 'reset' ? 'Recupera tu acceso.' : 'Bienvenido de nuevo.'}</h1>
      <form onSubmit={submit}>
        <label>Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={pending} /></label>
        {mode !== 'reset' && <label>Contraseña<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 6 : undefined} required disabled={pending} /></label>}
        {mode === 'register' && <label>Repite la contraseña<input name="confirmation" type="password" autoComplete="new-password" required minLength={6} disabled={pending} /></label>}
        <button className="button" disabled={pending}>{pending ? 'Procesando…' : mode === 'register' ? 'Crear cuenta' : mode === 'reset' ? 'Enviar instrucciones' : 'Iniciar sesión'}</button>
        <p role="status" aria-live="polite">{feedback}</p>
      </form>
      <nav className="auth-links"><Link to="/login">Iniciar sesión</Link><Link to="/registro">Crear cuenta</Link><Link to="/recuperar-acceso">Olvidé mi contraseña</Link></nav>
    </section>
  )
}
