export type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  messagingSenderId?: string
}

export type Environment =
  | { mode: 'demo' }
  | { mode: 'firebase'; config: FirebaseWebConfig }
  | { mode: 'invalid'; message: string }

const requiredFields = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  appId: 'VITE_FIREBASE_APP_ID',
} as const

const optionalFields = {
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
} as const

export function readEnvironment(env: Record<string, unknown>): Environment {
  const mode = env.VITE_DATA_SOURCE ?? 'demo'

  if (mode === 'demo') return { mode }
  if (mode !== 'firebase') {
    return { mode: 'invalid', message: 'VITE_DATA_SOURCE debe ser demo o firebase.' }
  }

  const config: Record<string, string> = {}
  const missing: string[] = []

  for (const [key, variable] of Object.entries(requiredFields)) {
    const value = env[variable]
    if (typeof value !== 'string' || !value.trim()) missing.push(variable)
    else config[key] = value.trim()
  }

  for (const [key, variable] of Object.entries(optionalFields)) {
    const value = env[variable]
    if (typeof value === 'string' && value.trim()) config[key] = value.trim()
  }

  if (missing.length) {
    return {
      mode: 'invalid',
      message: `Completa estas variables en .env.local: ${missing.join(', ')}. Después reinicia Vite.`,
    }
  }

  return { mode: 'firebase', config: config as FirebaseWebConfig }
}
