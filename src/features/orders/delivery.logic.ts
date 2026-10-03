import type { MinorAmount } from '../../shared/types/domain'
import type { ShippingScope } from './order.models'

export function deliveryFeeMinor(
  delivery: 'PICKUP' | ShippingScope,
  rates: { nationalRateMinor: number; internationalRateMinor: number },
): MinorAmount {
  if (delivery === 'PICKUP') return 0
  const amount = delivery === 'INTERNATIONAL' ? rates.internationalRateMinor : rates.nationalRateMinor
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error('La tarifa de envío configurada no es válida.')
  }
  return amount
}
