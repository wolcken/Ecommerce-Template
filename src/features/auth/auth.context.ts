import { createContext, useContext } from 'react'
import type { AuthState } from './auth.models'
export const AuthContext = createContext<{ state: AuthState; error: string | null }>({ state: { status: 'LOADING' }, error: null })
export function useAuth() { return useContext(AuthContext) }
