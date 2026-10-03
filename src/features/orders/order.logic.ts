import { MAX_CART_LINES, MAX_QUANTITY } from '../cart/cart.logic.ts'
import type {
  AdminOrderAction,
  CustomerOrder,
  DeliverySelection,
  OrderRequestInput,
  OrderStatus,
  PaymentMethod,
} from './order.models'

function required(value: unknown, label: string, max: number) {
  if (typeof value !== 'string') throw new Error(`Revisa ${label}.`)
  const result = value.trim()
  if (!result || result.length > max) throw new Error(`Revisa ${label}.`)
  return result
}

function optional(value: unknown, label: string, max: number) {
  if (typeof value !== 'string') throw new Error(`Revisa ${label}.`)
  const result = value.trim()
  if (result.length > max) throw new Error(`Revisa ${label}.`)
  return result
}

function delivery(value: DeliverySelection): DeliverySelection {
  if (value.method === 'PICKUP') {
    return { method: 'PICKUP', locationId: required(value.locationId, 'el punto de recojo', 120) }
  }
  if (value.method !== 'SHIPPING' || !value.address) throw new Error('Selecciona una entrega válida.')
  if (value.scope !== 'NATIONAL' && value.scope !== 'INTERNATIONAL') {
    throw new Error('Selecciona envío nacional o internacional.')
  }
  return {
    method: 'SHIPPING',
    scope: value.scope,
    address: {
      recipient: required(value.address.recipient, 'la persona que recibirá el envío', 120),
      phone: required(value.address.phone, 'el teléfono de envío', 30),
      country: required(value.address.country, 'el país', 120),
      city: required(value.address.city, 'la ciudad', 120),
      line1: required(value.address.line1, 'la dirección', 300),
      notes: optional(value.address.notes, 'las referencias', 500),
    },
  }
}

export function validateOrderRequest(input: OrderRequestInput): OrderRequestInput {
  if (!input || (input.kind !== 'ORDER' && input.kind !== 'RESERVATION')) {
    throw new Error('Selecciona pedido o reserva.')
  }
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > MAX_CART_LINES) {
    throw new Error('La solicitud debe contener entre 1 y 50 productos.')
  }

  const ids = new Set<string>()
  const items = input.items.map((item) => {
    const productId = required(item?.productId, 'el producto', 128)
    if (productId.includes('/') || ids.has(productId)) throw new Error('El carrito contiene productos repetidos o inválidos.')
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      throw new Error('Cada cantidad debe estar entre 1 y 99.')
    }
    ids.add(productId)
    return { productId, quantity: item.quantity }
  })

  const documentType = input.billing?.documentType
  if (documentType !== 'NIT' && documentType !== 'CI') throw new Error('Selecciona NIT o CI.')
  const paymentMethod = input.payment?.method
  if (paymentMethod !== 'QR' && paymentMethod !== 'CARD' && paymentMethod !== 'PAYPAL') {
    throw new Error('Selecciona un modo de pago.')
  }
  if (!Number.isSafeInteger(input.payment.reportedAmountMinor) || input.payment.reportedAmountMinor < 0) {
    throw new Error('El importe reportado no es válido.')
  }

  return {
    kind: input.kind,
    items,
    customer: {
      firstName: required(input.customer?.firstName, 'el nombre', 120),
      lastName: required(input.customer?.lastName, 'los apellidos', 120),
      phone: required(input.customer?.phone, 'el teléfono', 30),
    },
    billing: {
      name: required(input.billing?.name, 'el nombre o razón social', 200),
      documentType,
      documentNumber: required(input.billing?.documentNumber, 'el documento', 40),
      documentComplement:
        documentType === 'CI' && input.billing.documentComplement
          ? required(input.billing.documentComplement, 'el complemento', 20)
          : null,
    },
    delivery: delivery(input.delivery),
    payment: { method: paymentMethod, reportedAmountMinor: input.payment.reportedAmountMinor },
  }
}

const labels: Record<OrderStatus, string> = {
  REQUESTED: 'Pendiente de revisión',
  CONFIRMED: 'Confirmada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  EXPIRED: 'Vencida',
}

const paymentLabels: Record<PaymentMethod, string> = {
  QR: 'QR',
  CARD: 'Tarjeta de crédito o débito',
  PAYPAL: 'PayPal',
}

export function orderStatusLabel(status: OrderStatus, paymentReported = false) {
  return status === 'REQUESTED' && paymentReported ? 'Pago reportado' : labels[status]
}

export function paymentMethodLabel(method: PaymentMethod) {
  return paymentLabels[method]
}

export function availableAdminActions(order: CustomerOrder): AdminOrderAction[] {
  if (order.status === 'REQUESTED') return ['CONFIRM', 'REJECT']
  if (order.status === 'CONFIRMED') {
    return order.kind === 'RESERVATION'
      ? ['COMPLETE', 'CANCEL', 'EXPIRE']
      : ['COMPLETE', 'CANCEL']
  }
  return []
}
