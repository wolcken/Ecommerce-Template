export interface PriceInput {
  costMinor: number
  profitMinor: number
  billingRateBps: number
}

export interface PriceBreakdown extends PriceInput {
  baseMinor: number
  billingMinor: number
  saleMinor: number
}

function toSafeInteger(value: number, name: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`)
  }
  return BigInt(value)
}

function toNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('Calculated price exceeds the safe integer range')
  }
  return Number(value)
}

/**
 * Costo + ganancia fija + recargo sobre la suma.
 * Redondeo de medio centavo hacia arriba por unidad.
 * El servidor debe recalcular con entradas confiables al publicar/confirmar.
 */
export function calculatePrice(input: PriceInput): PriceBreakdown {
  const cost = toSafeInteger(input.costMinor, 'costMinor')
  const profit = toSafeInteger(input.profitMinor, 'profitMinor')
  const rate = toSafeInteger(input.billingRateBps, 'billingRateBps')
  const base = cost + profit
  const billing = (base * rate + 5000n) / 10000n
  return {
    ...input,
    baseMinor: toNumber(base),
    billingMinor: toNumber(billing),
    saleMinor: toNumber(base + billing),
  }
}
