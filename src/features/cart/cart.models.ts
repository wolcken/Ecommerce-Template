import type { Instant } from '../../shared/types/domain'

export interface CartItem {
  productId: string
  quantity: number
}

/** Intención de compra: sin precios confiables y sin comprometer stock. */
export interface CustomerCart {
  ownerId: string
  items: readonly CartItem[]
  version: number
  updatedAt: Instant
}
