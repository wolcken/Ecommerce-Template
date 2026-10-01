import type { RecordMetadata } from '../../shared/types/domain'

export type UserRole = 'USER' | 'ADMIN'

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
  documentNumber: string
  documentComplement: string | null
}

export interface ProfileInput {
  firstName: string
  lastName: string
  phone: string
  billing: BillingDetails | null
}

export interface UserProfile extends ProfileInput, RecordMetadata {
  uid: string
}

export interface ProfileService {
  getMine(): Promise<UserProfile | null>
  saveMine(input: ProfileInput, expectedVersion: number | null): Promise<UserProfile>
}
