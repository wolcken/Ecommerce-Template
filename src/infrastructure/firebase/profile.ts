import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import type { ProfileService, UserProfile } from '../../features/auth/auth.models'
import { validateProfileInput } from '../../features/auth/profile.logic.ts'

function failure(error: unknown): Error {
  if (error instanceof Error && !('code' in error)) return error
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code.includes('permission-denied')) return new Error('Tu sesión no puede acceder a este perfil.')
  if (code.includes('aborted')) return new Error('El perfil cambió. Recarga antes de guardar.')
  return new Error('No se pudo guardar el perfil.', { cause: error })
}

function instant(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }
  throw new Error('El perfil contiene una fecha inválida.')
}

function parseProfile(uid: string, data: DocumentData): UserProfile {
  const billing = data.billing
  if (
    typeof data.firstName !== 'string' ||
    typeof data.lastName !== 'string' ||
    typeof data.phone !== 'string' ||
    !Number.isSafeInteger(data.version) ||
    data.version < 1
  ) {
    throw new Error('El perfil contiene datos inválidos.')
  }
  return {
    uid,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    billing:
      billing === null
        ? null
        : {
            name: String(billing.name),
            documentType: billing.documentType === 'CI' ? 'CI' : 'NIT',
            documentNumber: String(billing.documentNumber),
            documentComplement: billing.documentComplement === null ? null : String(billing.documentComplement),
          },
    version: data.version,
    createdAt: instant(data.createdAt),
    updatedAt: instant(data.updatedAt),
  }
}

export function createFirestoreProfileService(
  db: Firestore,
  currentUserId: () => string | null,
): ProfileService {
  function uid() {
    const value = currentUserId()
    if (!value) throw new Error('Inicia sesión para acceder a tu perfil.')
    return value
  }

  async function getMine() {
    const ownerId = uid()
    try {
      const snapshot = await getDocFromServer(doc(db, 'profiles', ownerId))
      return snapshot.exists() ? parseProfile(ownerId, snapshot.data()) : null
    } catch (error) {
      throw failure(error)
    }
  }

  async function saveMine(raw: Parameters<ProfileService['saveMine']>[0], expectedVersion: number | null) {
    const input = validateProfileInput(raw)
    const ownerId = uid()
    if (expectedVersion !== null && (!Number.isInteger(expectedVersion) || expectedVersion < 1)) {
      throw new Error('La versión del perfil es inválida.')
    }
    try {
      const reference = doc(db, 'profiles', ownerId)
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(reference)
        const currentVersion = snapshot.exists() ? snapshot.data().version : null
        if (currentVersion !== expectedVersion) throw new Error('El perfil cambió. Recarga antes de guardar.')
        transaction.set(reference, {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          billing: input.billing,
          version: (currentVersion ?? 0) + 1,
          createdAt: snapshot.exists() ? snapshot.data().createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      })
      const saved = await getDocFromServer(reference)
      return parseProfile(ownerId, saved.data()!)
    } catch (error) {
      throw failure(error)
    }
  }

  return { getMine, saveMine }
}
