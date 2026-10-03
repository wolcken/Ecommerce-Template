import type { BillingDetails } from '../auth/auth.models'
import type { CartItem } from '../cart/cart.models'
import type { Instant, MinorAmount } from '../../shared/types/domain'

export type OrderKind = 'ORDER' | 'RESERVATION'
export type OrderStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED'

export type ShippingScope = 'NATIONAL' | 'INTERNATIONAL'
export type PaymentMethod = 'QR' | 'CARD' | 'PAYPAL'

export type DeliverySelection =
  | { method: 'PICKUP'; locationId: string }
  | {
      method: 'SHIPPING'
      scope: ShippingScope
      address: {
        recipient: string
        phone: string
        country: string
        city: string
        line1: string
        notes: string
      }
    }

export interface PaymentSelection {
  method: PaymentMethod
  reportedAmountMinor: MinorAmount
}

export interface PaymentReport extends PaymentSelection {
  status: 'REPORTED'
  reference: string
  reportedAt: Instant
}

export interface OrderRequestInput {
  kind: OrderKind
  items: readonly CartItem[]
  customer: { firstName: string; lastName: string; phone: string }
  billing: BillingDetails
  delivery: DeliverySelection
  payment: PaymentSelection
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

export interface CustomerOrder {
  id: string
  ownerId: string
  kind: OrderKind
  status: OrderStatus
  number: string | null
  customer: OrderRequestInput['customer']
  billing: BillingDetails
  delivery: DeliverySelection
  payment: PaymentReport | null
  requestedItems: readonly CartItem[]
  confirmedItems: readonly OrderItemSnapshot[]
  totals: OrderTotals | null
  adminNote: string
  confirmedAt: Instant | null
  reservedUntil: Instant | null
  createdAt: Instant
  updatedAt: Instant
  version: number
}

export type AdminOrderAction = 'CONFIRM' | 'REJECT' | 'CANCEL' | 'COMPLETE' | 'EXPIRE'

export interface OrderService {
  create(input: OrderRequestInput): Promise<CustomerOrder>
  listMine(): Promise<CustomerOrder[]>
  listAdmin(): Promise<CustomerOrder[]>
  transition(input: {
    orderId: string
    expectedVersion: number
    action: AdminOrderAction
    note: string
  }): Promise<CustomerOrder>
}
