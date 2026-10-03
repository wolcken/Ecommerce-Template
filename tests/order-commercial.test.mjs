import test from 'node:test'
import assert from 'node:assert/strict'
import { commercialAmounts } from '../src/features/admin/order-commercial.logic.ts'

const laptop = { costMinor: 500000, profitMinor: 20000, billingRateBps: 1600, priceMinor: 603200 }

test('commercial breakdown separates cost, gain and tributary surcharge', () => {
  assert.deepEqual(commercialAmounts(laptop, 2), {
    costMinor: 1000000,
    profitMinor: 40000,
    taxableMinor: 1040000,
    taxMinor: 166400,
    saleMinor: 1206400,
    profitRateBps: 400,
  })
})

test('commercial breakdown rejects invalid or inconsistent prices', () => {
  assert.throws(() => commercialAmounts(laptop, 0))
  assert.throws(() => commercialAmounts({ ...laptop, priceMinor: 1 }, 1))
})
