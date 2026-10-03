export interface PickupLocation {
  id: string
  name: string
  address: string
  instructions: string
}

export interface StoreConfig {
  name: string
  monogram: string
  tagline: string
  description: string
  locale: string
  currency: string
  logoUrl?: string
  contact: { email?: string; phone?: string }
  company: {
    legalName: string
    taxId: string
    activity: string
    address: string
    city: string
  }
  theme: {
    accent: string
    'accent-hover': string
    'font-body': string
    'font-heading': string
  }
  commerce: {
    ordersEnabled: boolean
    reservationsEnabled: boolean
    reservationDurationHours: number
    deliveryMethods: readonly ('pickup' | 'shipping')[]
    pickupLocations: readonly PickupLocation[]
    shipping: {
      nationalRateMinor: number
      internationalRateMinor: number
      notice: string
    }
    payments: {
      simulationEnabled: boolean
      methods: readonly ('QR' | 'CARD' | 'PAYPAL')[]
    }
  }
}
