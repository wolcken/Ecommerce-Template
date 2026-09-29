import { createUserWithEmailAndPassword, getIdTokenResult, onIdTokenChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type Auth } from 'firebase/auth'
import type { AuthService } from '../../app/services/contracts'
import type { Result } from '../../shared/types/domain'

async function run(action: () => Promise<unknown>): Promise<Result<void>> {
  try { await action(); return { ok: true, value: undefined } }
  catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
    const messages: Record<string, string> = {
      'auth/invalid-credential': 'Revisa el correo y la contraseña.',
      'auth/invalid-email': 'Introduce un correo válido.',
      'auth/weak-password': 'La contraseña no cumple la política de seguridad.',
      'auth/password-does-not-meet-requirements': 'La contraseña no cumple la política de seguridad.',
      'auth/email-already-in-use': 'No se pudo crear la cuenta. Prueba iniciar sesión o recuperar el acceso.',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
      'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión.',
    }
    return { ok: false, error: { code: 'UNAVAILABLE', message: messages[code] ?? 'No se pudo completar la operación. Intenta de nuevo.' } }
  }
}

export function createAuthService(auth: Auth): AuthService {
  return {
    subscribe(listener, onError) {
      let sequence = 0
      let stopped = false
      const unsubscribe = onIdTokenChanged(auth, async user => {
        const current = ++sequence
        listener({ status: 'LOADING' })
        if (!user) { listener({ status: 'ANONYMOUS' }); return }
        try {
          const token = await getIdTokenResult(user)
          if (stopped || current !== sequence) return
          listener({ status: 'AUTHENTICATED', user: {
            uid: user.uid, email: user.email, emailVerified: user.emailVerified,
            role: token.claims.admin === true ? 'ADMIN' : 'USER',
          } })
        } catch {
          if (!stopped && current === sequence) onError(new Error('No se pudo verificar la sesión. Recarga la página.'))
        }
      }, () => onError(new Error('No se pudo recuperar la sesión. Recarga la página.')))
      return () => { stopped = true; ++sequence; unsubscribe() }
    },
    signIn: (email, password) => run(() => signInWithEmailAndPassword(auth, email.trim(), password)),
    register: (email, password) => run(() => createUserWithEmailAndPassword(auth, email.trim(), password)),
    signOut: () => run(() => signOut(auth)),
    requestPasswordReset: email => run(async () => {
      try { await sendPasswordResetEmail(auth, email.trim()) }
      catch (error) {
        if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/user-not-found')) throw error
      }
    }),
  }
}
