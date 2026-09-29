import type { Instant, MinorAmount, RecordMetadata } from '../../shared/types/domain'

export interface ProductImage {
  url: string
  alt: string
  position: number
}

export interface CategoryRecord extends RecordMetadata {
  id: string
  slug: string
  name: string
  description: string
  parentId: string | null
  active: boolean
  position: number
}

/** Documento público: nunca contiene costos, márgenes ni stock interno. */
export interface PublicProduct extends RecordMetadata {
  id: string
  slug: string
  sku: string
  name: string
  description: string
  categoryId: string
  images: readonly ProductImage[]
  priceMinor: MinorAmount
  currency: 'BOB'
  priceVersion: number
  availability: 'AVAILABLE' | 'UNAVAILABLE'
  active: boolean
  featured: boolean
}

/** Datos privados: costo + ganancia fija; recargo sobre ese subtotal. */
export interface ProductPricing extends RecordMetadata {
  productId: string
  costMinor: MinorAmount
  currency: 'BOB'
  profitMinor: MinorAmount
  billingRateBps: number
  pricingPolicyVersion: string
}

export interface ProductDraft {
  name: string
  slug: string
  sku: string
  description: string
  categoryId: string
  images: readonly ProductImage[]
  featured: boolean
}

export interface InventoryRecord {
  productId: string
  onHand: number
  committed: number
  version: number
  updatedAt: Instant
}
