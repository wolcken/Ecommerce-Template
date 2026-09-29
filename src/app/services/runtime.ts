import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { createAdminService } from '../../infrastructure/firebase/admin'
import type { CatalogAdminService } from '../../features/admin/admin.models'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { readEnvironment } from '../../infrastructure/firebase/environment'
import { createAuthService } from '../../infrastructure/firebase/auth'
import { createCatalogService } from '../../infrastructure/firebase/catalog'
import type { AuthService, CatalogService } from './contracts'

type Runtime =
  | { mode: 'demo' }
  | { mode: 'invalid'; message: string }
  | { mode: 'firebase'; auth: AuthService; catalog: CatalogService; admin: CatalogAdminService }

function createRuntime(): Runtime {
  const environment = readEnvironment(import.meta.env)
  if (environment.mode !== 'firebase') return environment
  try {
    const emulate = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
    if (emulate && !environment.config.projectId.startsWith('demo-')) throw new Error('Emuladores requieren un proyecto demo.')
    const fresh = getApps().length === 0
    const app = fresh ? initializeApp(environment.config) : getApp()
    const auth = getAuth(app)
    auth.languageCode = 'es'
    const db = getFirestore(app)
    const functions = getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1')
    if (emulate && fresh) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099')
      connectFirestoreEmulator(db, '127.0.0.1', 8080)
      connectFunctionsEmulator(functions, '127.0.0.1', 5001)
    }
    return { mode: 'firebase', auth: createAuthService(auth), admin: createAdminService(functions), catalog: createCatalogService(db) }
  } catch {
    return { mode: 'invalid', message: 'No se pudo iniciar Firebase. Revisa la configuración web de .env.local y reinicia Vite.' }
  }
}
export const runtime = createRuntime()
