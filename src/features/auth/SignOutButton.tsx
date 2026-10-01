import { useState } from 'react'
import { useNavigate } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { useAuth } from './auth.context'

export function SignOutButton({ context = 'public' }: { context?: 'public' | 'admin' }) {
  const { state } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  if (runtime.mode !== 'firebase' || state.status !== 'AUTHENTICATED') return null

  async function signOut() {
    if (runtime.mode !== 'firebase') return
    setPending(true)
    setError('')
    const result = await runtime.auth.signOut()
    if (result.ok) navigate('/', { replace: true })
    else setError(result.error.message)
    setPending(false)
  }

  return (
    <div className={`signout-control signout-${context}`}>
      <button
        className="signout-button"
        type="button"
        disabled={pending}
        onClick={() => void signOut()}
      >
        {pending ? 'Cerrando…' : 'Cerrar sesión'}
      </button>
      {error && <span className="signout-error" role="alert">{error}</span>}
    </div>
  )
}
