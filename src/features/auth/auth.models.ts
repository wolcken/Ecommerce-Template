import type { RecordMetadata } from '../../shared/types/domain'

export type UserRole = 'USER' | 'ADMIN'

/** Sesión derivada del proveedor y sus claims verificados; no de localStorage. */
export interface SessionUser {
  uid: string
  email: string | null
  emailVerified: boolean
  role: UserRole
}

export type AuthState =
  | { status: 'LOADING' }
  | { status: 'ANONYMOUS' }
  | { status: 'AUTHENTICATED'; user: SessionUser }

export interface BillingDetails {
  name: string
  documentType: 'NIT' | 'CI'
  /** Texto para preservar ceros y complementos; validación por definir. */
  documentNumber: string
  documentComplement: string | null
}

export interface ProfileInput {
  firstName: string
  lastName: string
  phone: string
  billing: BillingDetails | null
}

/** Sin rol editable; el correo de acceso pertenece a Authentication. */
export interface UserProfile extends ProfileInput, RecordMetadata {
  uid: string
}
