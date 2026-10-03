import type { AdminProduct } from './admin.models'

export interface CommercialAmounts {
  costMinor: number
  profitMinor: number
  taxableMinor: number
  taxMinor: number
  saleMinor: number
  profitRateBps: number
}

function safeMultiply(value: number, quantity: number) {
  const result = value * quantity
  if (!Number.isSafeInteger(result)) throw new Error('El desglose comercial excede el límite permitido.')
  return result
}

export function commercialAmounts(
  product: Pick<AdminProduct, 'costMinor' | 'profitMinor' | 'billingRateBps' | 'priceMinor'>,
  quantity = 1,
): CommercialAmounts {
  const values = [product.costMinor, product.profitMinor, product.billingRateBps, product.priceMinor, quantity]
  if (values.some((value) => !Number.isSafeInteger(value) || value < 0) || quantity === 0) {
    throw new Error('El desglose comercial contiene valores inválidos.')
  }
  const taxableUnitMinor = product.costMinor + product.profitMinor
  const taxUnitMinor = product.priceMinor - taxableUnitMinor
  if (!Number.isSafeInteger(taxableUnitMinor) || taxUnitMinor < 0) {
    throw new Error('El precio comercial no coincide con su costo y ganancia.')
  }
  return {
    costMinor: safeMultiply(product.costMinor, quantity),
    profitMinor: safeMultiply(product.profitMinor, quantity),
    taxableMinor: safeMultiply(taxableUnitMinor, quantity),
    taxMinor: safeMultiply(taxUnitMinor, quantity),
    saleMinor: safeMultiply(product.priceMinor, quantity),
    profitRateBps: product.costMinor === 0 ? 0 : Math.round(product.profitMinor * 10_000 / product.costMinor),
  }
}

