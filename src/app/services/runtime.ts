import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import type { CatalogAdminService } from '../../features/admin/admin.models'
import type { OrderService } from '../../features/orders/order.models'
import { createFirestoreAdminService } from '../../infrastructure/firebase/admin'
import { createAuthService } from '../../infrastructure/firebase/auth'
import { createCatalogService } from '../../infrastructure/firebase/catalog'
import { readEnvironment } from '../../infrastructure/firebase/environment'
import { createFirestoreOrderService } from '../../infrastructure/firebase/orders'
import type { AuthService, CatalogService } from './contracts'

type Runtime =
  | { mode: 'demo' }
  | { mode: 'invalid'; message: string }
  | {
      mode: 'firebase'
      auth: AuthService
      catalog: CatalogService
      admin: CatalogAdminService
      orders: OrderService
    }

function createRuntime(): Runtime {
  const environment = readEnvironment(import.meta.env)
  if (environment.mode !== 'firebase') return environment

  try {
    const emulate = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
    if (emulate && !environment.config.projectId.startsWith('demo-')) {
      throw new Error('Emuladores requieren un proyecto demo.')
    }

    const fresh = getApps().length === 0
    const app = fresh ? initializeApp(environment.config) : getApp()
    const auth = getAuth(app)
    auth.languageCode = 'es'
    const db = getFirestore(app)

    if (emulate && fresh) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099')
      connectFirestoreEmulator(db, '127.0.0.1', 8080)
    }

    const currentUserId = () => auth.currentUser?.uid ?? null
    return {
      mode: 'firebase',
      auth: createAuthService(auth),
      catalog: createCatalogService(db),
      admin: createFirestoreAdminService(db, currentUserId),
      orders: createFirestoreOrderService(db, currentUserId),
    }
  } catch {
    return {
      mode: 'invalid',
      message: 'No se pudo iniciar Firebase. Revisa la configuración web de .env.local y reinicia Vite.',
    }
  }
}

export const runtime = createRuntime()
