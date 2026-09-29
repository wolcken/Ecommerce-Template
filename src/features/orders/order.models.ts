import type { BillingDetails } from '../auth/auth.models'
import type { CartItem } from '../cart/cart.models'
import type { Instant, MinorAmount, RecordMetadata } from '../../shared/types/domain'

export type DeliverySelection =
  | { method: 'PICKUP'; locationId: string }
  | { method: 'SHIPPING'; address: { recipient: string; phone: string; city: string; line1: string; notes: string } }

export interface CheckoutInput {
  kind: 'ORDER' | 'RESERVATION'
  items: readonly CartItem[]
  customer: { firstName: string; lastName: string; phone: string }
  billing: BillingDetails
  delivery: DeliverySelection
}

export interface OrderItemSnapshot {
  productId: string
  sku: string
  name: string
  imageUrl: string | null
  quantity: number
  unitPriceMinor: MinorAmount
  lineTotalMinor: MinorAmount
  priceVersion: number
}

export interface OrderTotals {
  currency: 'BOB'
  itemsMinor: MinorAmount
  shippingMinor: MinorAmount
  totalMinor: MinorAmount
}

/** Cotización calculada y persistida por el servidor; no reserva existencias. */
export interface CheckoutQuote {
  id: string
  ownerId: string
  checkout: CheckoutInput
  items: readonly OrderItemSnapshot[]
  totals: OrderTotals
  pricingPolicyVersion: string
  commercePolicyVersion: string
  expiresAt: Instant
}

interface OrderBase extends RecordMetadata {
  id: string
  number: string
  ownerId: string
  quoteId: string
  customer: CheckoutInput['customer']
  billing: BillingDetails
  delivery: DeliverySelection
  items: readonly OrderItemSnapshot[]
  totals: OrderTotals
  pricingPolicyVersion: string
  commercePolicyVersion: string
}

export interface PurchaseOrder extends OrderBase {
  kind: 'ORDER'
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
}

export interface ReservationOrder extends OrderBase {
  kind: 'RESERVATION'
  status: 'RESERVED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
  reservedUntil: Instant
}

export type CustomerOrder = PurchaseOrder | ReservationOrder

/** Propuesta de retención ligada a un único pedido o reserva. */
export interface StockCommitment {
  orderId: string
  items: readonly CartItem[]
  status: 'ACTIVE' | 'RELEASED' | 'CONSUMED'
  expiresAt: Instant | null
  updatedAt: Instant
}
