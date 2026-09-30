import type { Firestore } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v2/https'
import { calculatePrice } from '../../src/features/pricing/calculatePrice.js'
import type { CheckoutPreview, PreviewInput } from '../../src/features/orders/preview.models.js'
import { identifier, object, integer } from './validation.js'

export function previewInput(value: unknown): PreviewInput {
  const data = object(value, ['items', 'kind', 'deliveryMethod'])
  if (data.kind !== 'ORDER' && data.kind !== 'RESERVATION') throw new HttpsError('invalid-argument', 'Selecciona pedido o reserva.')
  if (data.deliveryMethod !== 'PICKUP' && data.deliveryMethod !== 'SHIPPING') throw new HttpsError('invalid-argument', 'Selecciona recojo o envío.')
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 50) throw new HttpsError('invalid-argument', 'El carrito admite de 1 a 50 productos.')
  const seen = new Set<string>()
  const items = data.items.map(raw => {
    const item = object(raw, ['productId', 'quantity'])
    const productId = identifier(item.productId)
    const quantity = integer(item.quantity, 'cantidad', 99)
    if (!quantity || seen.has(productId)) throw new HttpsError('invalid-argument', 'Cantidades o productos duplicados inválidos.')
    seen.add(productId)
    return { productId, quantity }
  })
  return { items, kind: data.kind, deliveryMethod: data.deliveryMethod }
}

function unavailable(): never {
  throw new HttpsError('failed-precondition', 'Hay productos retirados, sin existencias suficientes o sin precio válido. Revisa tu carrito.')
}

/** Vista consistente de precio e inventario. No escribe ni compromete stock. */
export async function previewCheckout(db: Firestore, input: PreviewInput): Promise<CheckoutPreview> {
  return db.runTransaction(async tx => {
    const snapshots = await tx.getAll(...input.items.flatMap(item =>
      ['products', 'productPricing', 'inventory'].map(collection => db.collection(collection).doc(item.productId))))
    const categoryIds = [...new Set(input.items.map((_, index) => {
      const product = snapshots[index * 3].data()
      if (!product?.active || typeof product.categoryId !== 'string') unavailable()
      return product.categoryId as string
    }))]
    const categories = await tx.getAll(...categoryIds.map(id => db.collection('categories').doc(id)))
    if (categories.some(doc => doc.data()?.active !== true)) unavailable()
    const items = input.items.map((item, index) => {
      const product = snapshots[index * 3].data()!
      const pricing = snapshots[index * 3 + 1].data()
      const stock = snapshots[index * 3 + 2].data()
      if (!pricing || !stock || !Number.isSafeInteger(stock.onHand) || !Number.isSafeInteger(stock.committed) ||
        stock.committed < 0 || stock.onHand - stock.committed < item.quantity ||
        pricing.currency !== 'BOB' || product.currency !== 'BOB') unavailable()
      let unitPriceMinor: number
      try {
        unitPriceMinor = calculatePrice({costMinor:pricing.costMinor, profitMinor:pricing.profitMinor, billingRateBps:pricing.billingRateBps}).saleMinor
      } catch { unavailable() }
      const lineTotalMinor = unitPriceMinor * item.quantity
      if (!Number.isSafeInteger(lineTotalMinor)) unavailable()
      return {productId:item.productId, name:String(product.name), quantity:item.quantity, unitPriceMinor, lineTotalMinor}
    })
    const itemsMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0)
    if (!Number.isSafeInteger(itemsMinor)) unavailable()
    return {items, itemsMinor, shippingMinor:0, totalMinor:itemsMinor, currency:'BOB',
      kind:input.kind, deliveryMethod:input.deliveryMethod, simulatedDelivery:true,
      reservationHours:24, checkedAt:Date.now()}
  }, {readOnly:true})
}
