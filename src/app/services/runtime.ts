import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { readEnvironment } from '../../infrastructure/firebase/environment'
import { createAuthService } from '../../infrastructure/firebase/auth'
import { createCatalogService } from '../../infrastructure/firebase/catalog'
import type { AuthService, CatalogService } from './contracts'

type Runtime =
  | { mode: 'demo' }
  | { mode: 'invalid'; message: string }
  | { mode: 'firebase'; auth: AuthService; catalog: CatalogService }

function createRuntime(): Runtime {
  const environment = readEnvironment(import.meta.env)
  if (environment.mode !== 'firebase') return environment
  try {
    const app = getApps().length ? getApp() : initializeApp(environment.config)
    const auth = getAuth(app)
    auth.languageCode = 'es'
    return { mode: 'firebase', auth: createAuthService(auth), catalog: createCatalogService(getFirestore(app)) }
  } catch {
    return { mode: 'invalid', message: 'No se pudo iniciar Firebase. Revisa la configuración web de .env.local y reinicia Vite.' }
  }
}
export const runtime = createRuntime()
