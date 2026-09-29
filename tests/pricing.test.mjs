import test from 'node:test'
import assert from 'node:assert/strict'
import { calculatePrice } from '../src/features/pricing/calculatePrice.ts'

test('agreed laptop example: Bs 5000 + Bs 200 + 16% = Bs 6032', () => {
  const price = calculatePrice({ costMinor: 500000, profitMinor: 20000, billingRateBps: 1600 })
  assert.equal(price.baseMinor, 520000)
  assert.equal(price.billingMinor, 83200)
  assert.equal(price.saleMinor, 603200)
})

test('surcharge applies to cost plus profit, not cost alone', () => {
  assert.equal(calculatePrice({ costMinor: 10000, profitMinor: 5000, billingRateBps: 1600 }).saleMinor, 17400)
})

test('zero surcharge and zero profit remain valid', () => {
  assert.equal(calculatePrice({ costMinor: 12345, profitMinor: 0, billingRateBps: 0 }).saleMinor, 12345)
})

test('rounds half cents up without floating point drift', () => {
  assert.equal(calculatePrice({ costMinor: 1, profitMinor: 0, billingRateBps: 5000 }).billingMinor, 1)
  assert.equal(calculatePrice({ costMinor: 1, profitMinor: 0, billingRateBps: 4999 }).billingMinor, 0)
  assert.equal(calculatePrice({ costMinor: 101, profitMinor: 0, billingRateBps: 1600 }).saleMinor, 117)
})

test('rejects negative, fractional, non-finite and unsafe inputs for every field', () => {
  for (const field of ['costMinor', 'profitMinor', 'billingRateBps']) {
    for (const invalid of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => calculatePrice({ costMinor: 100, profitMinor: 10, billingRateBps: 1600, [field]: invalid }), RangeError)
    }
  }
})

test('rejects overflow in base and final price', () => {
  assert.throws(() => calculatePrice({ costMinor: Number.MAX_SAFE_INTEGER, profitMinor: 1, billingRateBps: 0 }), RangeError)
  assert.throws(() => calculatePrice({ costMinor: Number.MAX_SAFE_INTEGER, profitMinor: 0, billingRateBps: 1 }), RangeError)
})

test('preserves exact integers near the allowed numeric boundary', () => {
  assert.equal(calculatePrice({ costMinor: Number.MAX_SAFE_INTEGER, profitMinor: 0, billingRateBps: 0 }).saleMinor, Number.MAX_SAFE_INTEGER)
})
