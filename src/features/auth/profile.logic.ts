import { validateCheckoutDetails } from '../orders/checkout.logic.ts'
import type { ProfileInput } from './auth.models'

export function validateProfileInput(input: ProfileInput): ProfileInput {
  if (!input) throw new Error('Completa tus datos.')
  if (input.billing === null) {
    const customer = validateCheckoutDetails({
      customer: { firstName: input.firstName, lastName: input.lastName, phone: input.phone },
      billing: {
        name: 'Perfil sin facturación',
        documentType: 'NIT',
        documentNumber: 'PENDIENTE',
        documentComplement: null,
      },
    }).customer
    return { ...customer, billing: null }
  }

  const result = validateCheckoutDetails({
    customer: { firstName: input.firstName, lastName: input.lastName, phone: input.phone },
    billing: input.billing,
  })
  return { ...result.customer, billing: result.billing }
}
