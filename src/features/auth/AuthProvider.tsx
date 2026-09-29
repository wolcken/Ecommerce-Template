import { useEffect, useState, type ReactNode } from 'react'
import { runtime } from '../../app/services/runtime'
import { AuthContext } from './auth.context'
import type { AuthState } from './auth.models'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: runtime.mode === 'firebase' ? 'LOADING' : 'ANONYMOUS' })
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (runtime.mode !== 'firebase') return
    return runtime.auth.subscribe(next => { setError(null); setState(next) }, error => {
      setState({ status: 'ANONYMOUS' }); setError(error.message)
    })
  }, [])
  return <AuthContext value={{ state, error }}>{children}</AuthContext>
}
