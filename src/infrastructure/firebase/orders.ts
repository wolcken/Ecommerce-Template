import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore'
import { storeConfig } from '../../config/store.config.ts'
import { calculatePrice } from '../../features/pricing/calculatePrice.ts'
import { validateOrderRequest } from '../../features/orders/order.logic.ts'
import type {
  AdminOrderAction,
  CustomerOrder,
  OrderItemSnapshot,
  OrderService,
  OrderStatus,
} from '../../features/orders/order.models'

const PAGE_SIZE = 100
const RESERVATION_DURATION_MS = storeConfig.commerce.reservationDurationHours * 60 * 60 * 1000

function failure(error: unknown): Error {
  if (error instanceof Error && !('code' in error)) return error
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code.includes('permission-denied')) return new Error('Tu sesión no tiene permiso para realizar esta operación.')
  if (code.includes('aborted')) return new Error('La solicitud cambió. Recarga antes de continuar.')
  if (code.includes('failed-precondition')) return new Error('Falta publicar un índice de Firestore para consultar solicitudes.')
  return new Error('No se pudo completar la operación en Firestore.', { cause: error })
}

function instant(value: unknown): string | null {
  if (value === null) return null
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }
  throw new Error('La solicitud contiene una fecha inválida.')
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('La solicitud contiene datos inválidos.')
  return value as Record<string, unknown>
}

function text(value: unknown, allowNull = false): string | null {
  if (allowNull && value === null) return null
  if (typeof value !== 'string') throw new Error('La solicitud contiene texto inválido.')
  return value
}

function integer(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('La solicitud contiene un número inválido.')
  }
  return value
}

function parseOrder(snapshot: DocumentSnapshot<DocumentData>): CustomerOrder {
  if (!snapshot.exists()) throw new Error('La solicitud ya no existe.')
  const data = snapshot.data()
  const status = text(data.status) as OrderStatus
  if (!['REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'EXPIRED'].includes(status)) {
    throw new Error('La solicitud tiene un estado inválido.')
  }

  const customer = record(data.customer)
  const billing = record(data.billing)
  const deliveryData = record(data.delivery)
  const requestedItems = Array.isArray(data.requestedItems)
    ? data.requestedItems.map((value) => {
        const item = record(value)
        return { productId: String(text(item.productId)), quantity: integer(item.quantity) }
      })
    : []

  const delivery =
    deliveryData.method === 'PICKUP'
      ? { method: 'PICKUP' as const, locationId: String(text(deliveryData.locationId)) }
      : (() => {
          const address = record(deliveryData.address)
          return {
            method: 'SHIPPING' as const,
            address: {
              recipient: String(text(address.recipient)),
              phone: String(text(address.phone)),
              city: String(text(address.city)),
              line1: String(text(address.line1)),
              notes: String(text(address.notes)),
            },
          }
        })()

  const confirmedItems: OrderItemSnapshot[] = Array.isArray(data.confirmedItems)
    ? data.confirmedItems.map((value) => {
        const item = record(value)
        const imageUrl = text(item.imageUrl, true)
        return {
          productId: String(text(item.productId)),
          sku: String(text(item.sku)),
          name: String(text(item.name)),
          imageUrl,
          quantity: integer(item.quantity),
          unitPriceMinor: integer(item.unitPriceMinor),
          lineTotalMinor: integer(item.lineTotalMinor),
          priceVersion: integer(item.priceVersion),
        }
      })
    : []

  const totalsData = data.totals === null ? null : record(data.totals)
  const totals = totalsData
    ? {
        currency: 'BOB' as const,
        itemsMinor: integer(totalsData.itemsMinor),
        shippingMinor: integer(totalsData.shippingMinor),
        totalMinor: integer(totalsData.totalMinor),
      }
    : null

  return {
    id: snapshot.id,
    ownerId: String(text(data.ownerId)),
    kind: data.kind === 'RESERVATION' ? 'RESERVATION' : 'ORDER',
    status,
    number: text(data.number, true),
    customer: {
      firstName: String(text(customer.firstName)),
      lastName: String(text(customer.lastName)),
      phone: String(text(customer.phone)),
    },
    billing: {
      name: String(text(billing.name)),
      documentType: billing.documentType === 'CI' ? 'CI' : 'NIT',
      documentNumber: String(text(billing.documentNumber)),
      documentComplement: text(billing.documentComplement, true),
    },
    delivery,
    requestedItems,
    confirmedItems,
    totals,
    adminNote: String(text(data.adminNote)),
    confirmedAt: instant(data.confirmedAt),
    reservedUntil: instant(data.reservedUntil),
    createdAt: String(instant(data.createdAt)),
    updatedAt: String(instant(data.updatedAt)),
    version: integer(data.version),
  }
}

function parseOrders(snapshots: readonly DocumentSnapshot<DocumentData>[]) {
  return snapshots.flatMap((snapshot) => {
    try {
      return [parseOrder(snapshot)]
    } catch {
      return []
    }
  })
}

function orderNumber(kind: 'ORDER' | 'RESERVATION', id: string, now: Date) {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `${kind === 'ORDER' ? 'PED' : 'RES'}-${date}-${id.slice(0, 6).toUpperCase()}`
}

export function createFirestoreOrderService(
  db: Firestore,
  currentUserId: () => string | null,
): OrderService {
  function userId() {
    const uid = currentUserId()
    if (!uid) throw new Error('Inicia sesión para continuar.')
    return uid
  }

  async function create(raw: Parameters<OrderService['create']>[0]) {
    const input = validateOrderRequest(raw)
    const ownerId = userId()
    const reference = doc(collection(db, 'orders'))
    try {
      await setDoc(reference, {
        ownerId,
        kind: input.kind,
        status: 'REQUESTED',
        number: null,
        customer: input.customer,
        billing: input.billing,
        delivery: input.delivery,
        requestedItems: input.items,
        confirmedItems: [],
        totals: null,
        adminNote: '',
        confirmedAt: null,
        reservedUntil: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        version: 1,
      })
      return parseOrder(await getDocFromServer(reference))
    } catch (error) {
      throw failure(error)
    }
  }

  async function listMine() {
    const ownerId = userId()
    try {
      const snapshot = await getDocsFromServer(
        query(
          collection(db, 'orders'),
          where('ownerId', '==', ownerId),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE),
        ),
      )
      return parseOrders(snapshot.docs)
    } catch (error) {
      throw failure(error)
    }
  }

  async function listAdmin() {
    userId()
    try {
      const snapshot = await getDocsFromServer(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE)),
      )
      return parseOrders(snapshot.docs)
    } catch (error) {
      throw failure(error)
    }
  }

  async function confirm(
    orderId: string,
    expectedVersion: number,
    note: string,
    action: AdminOrderAction,
  ) {
    return runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId)
      const orderSnapshot = await transaction.get(orderRef)
      const order = parseOrder(orderSnapshot)
      if (order.version !== expectedVersion || order.status !== 'REQUESTED') {
        throw new Error('La solicitud cambió. Recarga antes de revisarla.')
      }

      const rows = await Promise.all(
        order.requestedItems.map(async (item) => {
          const productRef = doc(db, 'products', item.productId)
          const pricingRef = doc(db, 'productPricing', item.productId)
          const inventoryRef = doc(db, 'inventory', item.productId)
          const [productSnapshot, pricingSnapshot, inventorySnapshot] = await Promise.all([
            transaction.get(productRef),
            transaction.get(pricingRef),
            transaction.get(inventoryRef),
          ])
          if (!productSnapshot.exists() || !pricingSnapshot.exists() || !inventorySnapshot.exists()) {
            throw new Error('Uno de los productos ya no está disponible.')
          }
          return {
            request: item,
            productRef,
            inventoryRef,
            product: productSnapshot.data(),
            pricing: pricingSnapshot.data(),
            inventory: inventorySnapshot.data(),
          }
        }),
      )

      let itemsMinor = 0
      const confirmedItems: OrderItemSnapshot[] = rows.map((row) => {
        if (row.product.active !== true || row.product.availability !== 'AVAILABLE') {
          throw new Error(`${row.product.name ?? 'Un producto'} no está disponible.`)
        }
        const available = row.inventory.onHand - row.inventory.committed
        if (!Number.isSafeInteger(available) || available < row.request.quantity) {
          throw new Error(`No hay existencias suficientes de ${row.product.name}.`)
        }
        if (row.pricing.currency !== 'BOB' || row.pricing.pricingPolicyVersion !== 'cost-plus-fixed-v1') {
          throw new Error(`La política de precio de ${row.product.name} no es válida.`)
        }
        const calculated = calculatePrice({
          costMinor: integer(row.pricing.costMinor),
          profitMinor: integer(row.pricing.profitMinor),
          billingRateBps: integer(row.pricing.billingRateBps),
        })
        if (calculated.saleMinor !== row.product.priceMinor) {
          throw new Error(`El precio de ${row.product.name} necesita ser actualizado.`)
        }
        const lineTotalMinor = calculated.saleMinor * row.request.quantity
        if (!Number.isSafeInteger(lineTotalMinor) || !Number.isSafeInteger(itemsMinor + lineTotalMinor)) {
          throw new Error('El total excede el límite permitido.')
        }
        itemsMinor += lineTotalMinor
        return {
          productId: row.request.productId,
          sku: row.product.sku,
          name: row.product.name,
          imageUrl: row.product.images?.[0]?.url ?? null,
          quantity: row.request.quantity,
          unitPriceMinor: calculated.saleMinor,
          lineTotalMinor,
          priceVersion: row.product.priceVersion,
        }
      })

      const shippingMinor = order.delivery.method === 'SHIPPING' ? storeConfig.commerce.shipping.flatRateMinor : 0
      const totalMinor = itemsMinor + shippingMinor
      if (!Number.isSafeInteger(shippingMinor) || shippingMinor < 0 || !Number.isSafeInteger(totalMinor)) {
        throw new Error('La tarifa de envío configurada no es válida.')
      }
      const now = Timestamp.now()
      const reservedUntil =
        order.kind === 'RESERVATION'
          ? Timestamp.fromMillis(now.toMillis() + RESERVATION_DURATION_MS)
          : null

      rows.forEach((row) => {
        const committed = row.inventory.committed + row.request.quantity
        transaction.update(row.inventoryRef, {
          committed,
          version: row.inventory.version + 1,
          updatedAt: now,
        })
        transaction.update(row.productRef, {
          availability: row.inventory.onHand > committed ? 'AVAILABLE' : 'UNAVAILABLE',
          version: row.product.version + 1,
          updatedAt: now,
        })
      })

      transaction.set(doc(db, 'stockCommitments', orderId), {
        orderId,
        items: order.requestedItems,
        status: 'ACTIVE',
        expiresAt: reservedUntil,
        version: 1,
        createdAt: now,
        updatedAt: now,
      })
      transaction.update(orderRef, {
        status: 'CONFIRMED',
        number: orderNumber(order.kind, orderId, now.toDate()),
        confirmedItems,
        totals: {
          currency: 'BOB',
          itemsMinor,
          shippingMinor,
          totalMinor,
        },
        adminNote: note,
        confirmedAt: now,
        reservedUntil,
        updatedAt: now,
        version: order.version + 1,
      })
      transaction.set(doc(collection(db, 'auditEvents')), {
        actorId: userId(),
        action,
        entityId: orderId,
        createdAt: now,
      })
      return orderRef
    })
  }

  async function close(
    orderId: string,
    expectedVersion: number,
    note: string,
    action: Exclude<AdminOrderAction, 'CONFIRM' | 'REJECT'>,
  ) {
    return runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId)
      const commitmentRef = doc(db, 'stockCommitments', orderId)
      const [orderSnapshot, commitmentSnapshot] = await Promise.all([
        transaction.get(orderRef),
        transaction.get(commitmentRef),
      ])
      const order = parseOrder(orderSnapshot)
      if (order.version !== expectedVersion || order.status !== 'CONFIRMED') {
        throw new Error('La solicitud cambió. Recarga antes de continuar.')
      }
      if (action === 'EXPIRE' && order.kind !== 'RESERVATION') {
        throw new Error('Solo una reserva puede marcarse como vencida.')
      }
      if (!commitmentSnapshot.exists() || commitmentSnapshot.data().status !== 'ACTIVE') {
        throw new Error('El compromiso de existencias ya fue procesado.')
      }

      const rows = await Promise.all(
        order.confirmedItems.map(async (item) => {
          const inventoryRef = doc(db, 'inventory', item.productId)
          const productRef = doc(db, 'products', item.productId)
          const [inventorySnapshot, productSnapshot] = await Promise.all([
            transaction.get(inventoryRef),
            transaction.get(productRef),
          ])
          if (!inventorySnapshot.exists() || !productSnapshot.exists()) {
            throw new Error('No se encontró el inventario comprometido.')
          }
          return { item, inventoryRef, productRef, inventory: inventorySnapshot.data(), product: productSnapshot.data() }
        }),
      )

      const consume = action === 'COMPLETE'
      const now = Timestamp.now()
      rows.forEach((row) => {
        const committed = row.inventory.committed - row.item.quantity
        const onHand = row.inventory.onHand - (consume ? row.item.quantity : 0)
        if (committed < 0 || onHand < committed || onHand < 0) {
          throw new Error('El inventario no coincide con el compromiso de esta solicitud.')
        }
        transaction.update(row.inventoryRef, {
          onHand,
          committed,
          version: row.inventory.version + 1,
          updatedAt: now,
        })
        transaction.update(row.productRef, {
          availability: row.product.active === true && onHand > committed ? 'AVAILABLE' : 'UNAVAILABLE',
          version: row.product.version + 1,
          updatedAt: now,
        })
      })

      const status: OrderStatus =
        action === 'COMPLETE' ? 'COMPLETED' : action === 'EXPIRE' ? 'EXPIRED' : 'CANCELLED'
      transaction.update(commitmentRef, {
        status: consume ? 'CONSUMED' : 'RELEASED',
        version: commitmentSnapshot.data().version + 1,
        updatedAt: now,
      })
      transaction.update(orderRef, {
        status,
        adminNote: note,
        updatedAt: now,
        version: order.version + 1,
      })
      transaction.set(doc(collection(db, 'auditEvents')), {
        actorId: userId(),
        action,
        entityId: orderId,
        createdAt: now,
      })
      return orderRef
    })
  }

  async function transition(input: Parameters<OrderService['transition']>[0]) {
    const orderId = input.orderId.trim()
    const note = input.note.trim()
    if (!orderId || orderId.includes('/') || !Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) {
      throw new Error('La solicitud es inválida.')
    }
    if (note.length > 500) throw new Error('La nota admite hasta 500 caracteres.')

    try {
      let reference
      if (input.action === 'CONFIRM') {
        reference = await confirm(orderId, input.expectedVersion, note, input.action)
      } else if (input.action === 'REJECT') {
        reference = await runTransaction(db, async (transaction) => {
          const orderRef = doc(db, 'orders', orderId)
          const snapshot = await transaction.get(orderRef)
          const order = parseOrder(snapshot)
          if (order.version !== input.expectedVersion || order.status !== 'REQUESTED') {
            throw new Error('La solicitud cambió. Recarga antes de revisarla.')
          }
          const now = Timestamp.now()
          transaction.update(orderRef, {
            status: 'REJECTED',
            adminNote: note,
            updatedAt: now,
            version: order.version + 1,
          })
          transaction.set(doc(collection(db, 'auditEvents')), {
            actorId: userId(),
            action: input.action,
            entityId: orderId,
            createdAt: now,
          })
          return orderRef
        })
      } else {
        reference = await close(orderId, input.expectedVersion, note, input.action)
      }
      return parseOrder(await getDocFromServer(reference))
    } catch (error) {
      throw failure(error)
    }
  }

  return { create, listMine, listAdmin, transition }
}
