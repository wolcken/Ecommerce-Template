export interface StoreConfig {
  name: string
  monogram: string
  tagline: string
  description: string
  locale: string
  currency: string
  logoUrl?: string
  contact: { email?: string; phone?: string }
  theme: {
    accent: string
    'accent-hover': string
    'font-body': string
    'font-heading': string
  }
  commerce: {
    ordersEnabled: boolean
    reservationsEnabled: boolean
    deliveryMethods: readonly ('pickup' | 'shipping')[]
  }
}
