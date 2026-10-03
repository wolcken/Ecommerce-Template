import type { StoreConfig } from './store.types'

export const storeConfig = {
  name: 'Esencial',
  monogram: 'e.',
  tagline: 'Objetos para vivir mejor',
  description: 'Una selección de objetos útiles, simples y hechos para acompañarte cada día.',
  locale: 'es-BO',
  currency: 'BOB',
  contact: { email: '', phone: '' },
  company: {
    legalName: 'Razón social por configurar',
    taxId: 'NIT por configurar',
    activity: 'Actividad económica por configurar',
    address: 'Dirección por configurar',
    city: 'Ciudad por configurar',
  },
  theme: {
    accent: '#245646',
    'accent-hover': '#173e32',
    'font-body': '"Segoe UI", system-ui, sans-serif',
    'font-heading': 'Georgia, "Times New Roman", serif',
  },
  commerce: {
    ordersEnabled: true,
    reservationsEnabled: true,
    reservationDurationHours: 24,
    deliveryMethods: ['pickup', 'shipping'],
    pickupLocations: [
      {
        id: 'main-store',
        name: 'Tienda principal',
        address: 'Dirección por configurar',
        instructions: 'Horario de recojo por coordinar.',
      },
    ],
    shipping: {
      nationalRateMinor: 2000,
      internationalRateMinor: 10000,
      notice: 'La cobertura y el horario se coordinan al confirmar.',
    },
    payments: {
      simulationEnabled: true,
      methods: ['QR', 'CARD', 'PAYPAL'],
    },
  },
} satisfies StoreConfig
