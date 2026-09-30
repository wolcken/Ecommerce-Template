import type { CartItem } from './cart.models'
export const MAX_CART_LINES = 50
export const MAX_QUANTITY = 99

function validId(id: unknown): id is string {
  return typeof id === 'string' && id.trim().length > 0 && id.length <= 128 && !id.includes('/')
}
export function readCart(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (data.version !== 1 || !Array.isArray(data.items)) return []
    const items = new Map<string, number>()
    for (const row of data.items) {
      if (!row || !validId(row.productId) || !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > MAX_QUANTITY) continue
      if (!items.has(row.productId) && items.size >= MAX_CART_LINES) continue
      items.set(row.productId, Math.max(items.get(row.productId) ?? 0, row.quantity))
    }
    return Array.from(items, ([productId, quantity]) => ({productId,quantity}))
  } catch { return [] }
}

export function changeQuantity(items: readonly CartItem[], productId: string, quantity: number): CartItem[] {
  if (!validId(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) throw new Error('La cantidad debe estar entre 1 y 99.')
  if (!items.some(i => i.productId === productId) && items.length >= MAX_CART_LINES) throw new Error('El carrito admite hasta 50 productos diferentes.')
  const found = items.some(i => i.productId === productId)
  return found ? items.map(i => i.productId === productId ? {productId,quantity} : i) : [...items,{productId,quantity}]
}

/** Máxima cantidad para duplicados: repetir la migración nunca duplica cantidades. */
export function mergeCarts(saved: readonly CartItem[], guest: readonly CartItem[]) {
  let items = [...saved]
  const remainingGuest: CartItem[] = []
  for (const item of guest) {
    const old = items.find(i => i.productId === item.productId)
    if (!old && items.length >= MAX_CART_LINES) {remainingGuest.push(item);continue}
    items = changeQuantity(items,item.productId,Math.max(old?.quantity ?? 0,item.quantity))
  }
  return {items,remainingGuest}
}

export interface CartCatalogEntry {
  id: string
  priceMinor: number
  availability?: 'AVAILABLE' | 'UNAVAILABLE'
}
export function cartSummary(items: readonly CartItem[], products: readonly CartCatalogEntry[]) {
  let subtotalMinor = 0
  let unavailable = 0
  let overflow = false
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)
    if (!product || product.availability === 'UNAVAILABLE') {unavailable++;continue}
    const line = product.priceMinor * item.quantity
    if (!Number.isSafeInteger(line) || line < 0 || !Number.isSafeInteger(subtotalMinor + line)) {overflow=true;continue}
    subtotalMinor += line
  }
  return {subtotalMinor,unavailable,overflow,quantity:items.reduce((n,i)=>n+i.quantity,0)}
}
