import assert from 'node:assert/strict'
import test from 'node:test'
import { deliveryFeeMinor } from '../src/features/orders/delivery.logic.ts'

const rates = { nationalRateMinor: 2000, internationalRateMinor: 10000 }

test('delivery fees distinguish pickup, national and international shipping', () => {
  assert.equal(deliveryFeeMinor('PICKUP', rates), 0)
  assert.equal(deliveryFeeMinor('NATIONAL', rates), 2000)
  assert.equal(deliveryFeeMinor('INTERNATIONAL', rates), 10000)
})

test('delivery fees reject unsafe configuration', () => {
  assert.throws(() => deliveryFeeMinor('NATIONAL', { ...rates, nationalRateMinor: -1 }))
  assert.throws(() => deliveryFeeMinor('INTERNATIONAL', { ...rates, internationalRateMinor: 1.5 }))
})
