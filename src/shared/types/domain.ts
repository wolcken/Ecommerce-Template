/** Fechas ISO 8601 UTC en el dominio; el adaptador convierte Timestamp. */
export type Instant = string
/** Entero seguro >= 0 en centavos. Fase inicial: BOB (dos decimales). */
export type MinorAmount = number

export interface RecordMetadata {
  createdAt: Instant
  updatedAt: Instant
  version: number
}

export interface PageRequest {
  limit: number
  cursor?: string
}

export interface Page<T> {
  items: readonly T[]
  nextCursor: string | null
}

export type ServiceErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'OUT_OF_STOCK'
  | 'PRICE_CHANGED'
  | 'FEATURE_DISABLED'
  | 'UNAVAILABLE'

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ServiceErrorCode; message: string } }
