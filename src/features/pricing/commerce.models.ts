/** Regla comercial acordada; no representa liquidación ni emisión fiscal. */
export interface PricingPolicy {
  version: 'cost-plus-fixed-v1'
  currency: 'BOB'
  profitBasis: 'FIXED_AMOUNT'
  billingMethod: 'SURCHARGE_ON_COST_PLUS_PROFIT'
  defaultBillingRateBps: number
  rounding: 'HALF_UP_PER_UNIT'
}

export const pricingPolicy: PricingPolicy = {
  version: 'cost-plus-fixed-v1',
  currency: 'BOB',
  profitBasis: 'FIXED_AMOUNT',
  billingMethod: 'SURCHARGE_ON_COST_PLUS_PROFIT',
  defaultBillingRateBps: 1600,
  rounding: 'HALF_UP_PER_UNIT',
}

/** Duración y transiciones de reserva pendientes; no habilita operaciones. */
export interface PendingCommercePolicy {
  status: 'PENDING_DEFINITION'
  ordersEnabled: false
  reservationsEnabled: false
  reservationDurationMinutes: null
}

export const pendingCommercePolicy: PendingCommercePolicy = {
  status: 'PENDING_DEFINITION',
  ordersEnabled: false,
  reservationsEnabled: false,
  reservationDurationMinutes: null,
}
