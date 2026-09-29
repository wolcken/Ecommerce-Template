import type { StoreConfig } from './store.types'

// Solo información pública: nunca incluir costos, márgenes ni credenciales.
export const storeConfig = {
  name: 'Esencial',
  monogram: 'e.',
  tagline: 'Objetos para vivir mejor',
  description: 'Una selección de objetos útiles, simples y hechos para acompañarte cada día.',
  locale: 'es-BO',
  currency: 'BOB',
  contact: {},
  theme: {
    accent: '#245646',
    'accent-hover': '#173e32',
    'font-body': '"Segoe UI", system-ui, sans-serif',
    'font-heading': 'Georgia, "Times New Roman", serif',
  },
  commerce: {
    ordersEnabled: false,
    reservationsEnabled: false,
    deliveryMethods: [],
  },
} satisfies StoreConfig
