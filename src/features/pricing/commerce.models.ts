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

export interface CommercePolicy {
  version: 'manual-review-v1'
  ordersEnabled: true
  reservationsEnabled: true
  reservationDurationMinutes: 1440
  deliveryMethods: readonly ['PICKUP', 'SHIPPING']
  shippingMinor: 0
}

export const commercePolicy: CommercePolicy = {
  version: 'manual-review-v1',
  ordersEnabled: true,
  reservationsEnabled: true,
  reservationDurationMinutes: 1440,
  deliveryMethods: ['PICKUP', 'SHIPPING'],
  shippingMinor: 0,
}
