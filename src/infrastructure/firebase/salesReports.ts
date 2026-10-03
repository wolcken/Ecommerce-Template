import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore'
import type { SalesReportItem, SalesReportOrder, SalesReportService } from '../../features/admin/sales-report.models'

const REPORT_LIMIT = 500

function failure(error: unknown): Error {
  if (error instanceof Error && !('code' in error)) return error
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code.includes('permission-denied')) return new Error('Tu sesión no tiene permiso para consultar ventas.')
  if (code.includes('failed-precondition')) return new Error('Falta publicar el índice de Firestore para consultar ventas por fecha.')
  return new Error('No se pudo preparar el informe de ventas.', { cause: error })
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('El historial de ventas contiene datos inválidos.')
  return value as Record<string, unknown>
}

function text(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) throw new Error('El historial de ventas contiene texto inválido.')
  return value
}

function integer(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('El historial de ventas contiene importes inválidos.')
  return value
}

function multiply(value: number, quantity: number) {
  const result = value * quantity
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('El historial de ventas excede el límite numérico permitido.')
  return result
}

function instant(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate().toISOString()
  throw new Error('El historial de ventas contiene una fecha inválida.')
}

function parseCommercialItems(snapshot: DocumentSnapshot<DocumentData>) {
  if (!snapshot.exists()) return new Map<string, Omit<SalesReportItem, 'quantity' | 'saleMinor'>>()
  const data = snapshot.data()
  if (!Array.isArray(data.items)) throw new Error('El desglose comercial es inválido.')
  return new Map(data.items.map((value: unknown) => {
    const item = record(value)
    const unitCostMinor = integer(item.unitCostMinor)
    const unitProfitMinor = integer(item.unitProfitMinor)
    const unitTaxMinor = integer(item.unitTaxMinor)
    const unitSaleMinor = integer(item.unitSaleMinor)
    if (unitCostMinor + unitProfitMinor + unitTaxMinor !== unitSaleMinor) throw new Error('El desglose comercial no coincide con el precio vendido.')
    const productId = text(item.productId)
    return [productId, {
      productId,
      sku: text(item.sku),
      name: text(item.name),
      categoryName: text(item.categoryName),
      unitSaleMinor,
      costMinor: unitCostMinor,
      profitMinor: unitProfitMinor,
      taxMinor: unitTaxMinor,
    }]
  }))
}

async function parseReportOrder(db: Firestore, snapshot: DocumentSnapshot<DocumentData>): Promise<SalesReportOrder> {
  const data = snapshot.data()
  if (!data || data.status !== 'COMPLETED' || !Array.isArray(data.confirmedItems)) throw new Error('La venta contiene datos inválidos.')
  const customer = record(data.customer)
  const totals = record(data.totals)
  let commercial = new Map<string, Omit<SalesReportItem, 'quantity' | 'saleMinor'>>()
  try {
    commercial = parseCommercialItems(await getDocFromServer(doc(db, 'orderCommercialSnapshots', snapshot.id)))
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) throw error
  }
  const items = data.confirmedItems.map((value: unknown) => {
    const item = record(value)
    const productId = text(item.productId)
    const quantity = integer(item.quantity)
    const unitSaleMinor = integer(item.unitPriceMinor)
    const saleMinor = integer(item.lineTotalMinor)
    if (unitSaleMinor * quantity !== saleMinor) throw new Error('El total de un artículo vendido es inválido.')
    const detail = commercial.get(productId)
    const commercialMatches = detail?.unitSaleMinor === unitSaleMinor
    return {
      productId,
      sku: text(item.sku),
      name: text(item.name),
      categoryName: commercialMatches ? detail.categoryName : null,
      quantity,
      unitSaleMinor,
      saleMinor,
      costMinor: commercialMatches ? multiply(integer(detail.costMinor), quantity) : null,
      profitMinor: commercialMatches ? multiply(integer(detail.profitMinor), quantity) : null,
      taxMinor: commercialMatches ? multiply(integer(detail.taxMinor), quantity) : null,
    }
  })
  const commercialDataComplete = items.every((item: SalesReportItem) => item.costMinor !== null && item.profitMinor !== null && item.taxMinor !== null)
  return {
    id: snapshot.id,
    number: text(data.number),
    completedAt: instant(data.updatedAt),
    customerName: `${text(customer.firstName)} ${text(customer.lastName)}`,
    items,
    shippingMinor: integer(totals.shippingMinor),
    totalMinor: integer(totals.totalMinor),
    commercialDataComplete,
  }
}

export function createFirestoreSalesReportService(db: Firestore, currentUserId: () => string | null): SalesReportService {
  return {
    async list(input) {
      if (!currentUserId()) throw new Error('Inicia sesión para continuar.')
      const from = new Date(input.from)
      const until = new Date(input.until)
      if (!Number.isFinite(from.getTime()) || !Number.isFinite(until.getTime()) || from >= until) throw new Error('El rango del informe es inválido.')
      try {
        const snapshot = await getDocsFromServer(query(
          collection(db, 'orders'),
          where('status', '==', 'COMPLETED'),
          where('updatedAt', '>=', Timestamp.fromDate(from)),
          where('updatedAt', '<', Timestamp.fromDate(until)),
          orderBy('updatedAt', 'desc'),
          limit(REPORT_LIMIT + 1),
        ))
        const truncated = snapshot.docs.length > REPORT_LIMIT
        const orders = await Promise.all(snapshot.docs.slice(0, REPORT_LIMIT).map((item) => parseReportOrder(db, item)))
        return { orders, truncated }
      } catch (error) {
        throw failure(error)
      }
    },
  }
}
