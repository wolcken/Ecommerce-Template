import assert from 'node:assert/strict'
import test from 'node:test'
import { canGenerateInvoice } from '../src/features/orders/invoice.logic.ts'

const order = {
  status: 'COMPLETED',
  number: 'ORD-001',
  confirmedItems: [{ productId: 'p', quantity: 1, unitPriceMinor: 1000, lineTotalMinor: 1000 }],
  totals: { itemsMinor: 1000, shippingMinor: 200, totalMinor: 1200 },
}

test('completed orders with frozen items and totals may generate an invoice', () => {
  assert.equal(canGenerateInvoice(order), true)
})

test('pending or inconsistent orders cannot generate an invoice', () => {
  assert.equal(canGenerateInvoice({ ...order, status: 'CONFIRMED' }), false)
  assert.equal(canGenerateInvoice({ ...order, number: null }), false)
  assert.equal(canGenerateInvoice({ ...order, confirmedItems: [] }), false)
  assert.equal(canGenerateInvoice({
    ...order,
    confirmedItems: [{ productId: 'p', quantity: 1, unitPriceMinor: 1000, lineTotalMinor: 900 }],
  }), false)
  assert.equal(canGenerateInvoice({
    ...order,
    totals: { itemsMinor: 1000, shippingMinor: 200, totalMinor: 1000 },
  }), false)
})
