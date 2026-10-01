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

export type DeliverySelection =
  | { method: 'PICKUP'; locationId: string }
  | {
      method: 'SHIPPING'
      address: {
        recipient: string
        phone: string
        city: string
        line1: string
        notes: string
      }
    }

export interface OrderRequestInput {
  kind: OrderKind
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

export interface CustomerOrder {
  id: string
  ownerId: string
  kind: OrderKind
  status: OrderStatus
  number: string | null
  customer: OrderRequestInput['customer']
  billing: BillingDetails
  delivery: DeliverySelection
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
