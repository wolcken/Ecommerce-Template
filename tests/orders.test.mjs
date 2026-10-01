import test from 'node:test'
import assert from 'node:assert/strict'
import { availableAdminActions, orderStatusLabel, validateOrderRequest } from '../src/features/orders/order.logic.ts'

const base = {
  kind: 'ORDER',
  items: [{ productId: 'laptop', quantity: 1 }],
  customer: { firstName: 'Ana', lastName: 'Pérez', phone: '70000000' },
  billing: { name: 'Ana Pérez', documentType: 'NIT', documentNumber: '00123', documentComplement: null },
  delivery: { method: 'PICKUP', locationId: 'main-store' },
}

test('order request keeps identifiers and billing text without accepting totals', () => {
  const value = validateOrderRequest(base)
  assert.equal(value.items[0].productId, 'laptop')
  assert.equal(value.billing.documentNumber, '00123')
  assert.equal('totals' in value, false)
})

test('order request rejects repeated products, invalid quantities and incomplete shipping', () => {
  assert.throws(() => validateOrderRequest({ ...base, items: [...base.items, ...base.items] }))
  assert.throws(() => validateOrderRequest({ ...base, items: [{ productId: 'laptop', quantity: 100 }] }))
  assert.throws(() => validateOrderRequest({
    ...base,
    delivery: { method: 'SHIPPING', address: { recipient: '', phone: '', city: '', line1: '', notes: '' } },
  }))
})

test('manual actions only expose valid transitions', () => {
  const order = { status: 'REQUESTED', kind: 'RESERVATION' }
  assert.deepEqual(availableAdminActions(order), ['CONFIRM', 'REJECT'])
  assert.deepEqual(availableAdminActions({ ...order, status: 'CONFIRMED' }), ['COMPLETE', 'CANCEL', 'EXPIRE'])
  assert.deepEqual(availableAdminActions({ ...order, status: 'EXPIRED' }), [])
  assert.equal(orderStatusLabel('CONFIRMED'), 'Confirmada')
})
