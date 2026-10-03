import test from 'node:test'
import assert from 'node:assert/strict'
import { availableAdminActions, orderStatusLabel, paymentMethodLabel, validateOrderRequest } from '../src/features/orders/order.logic.ts'

const base = {
  kind: 'ORDER',
  items: [{ productId: 'laptop', quantity: 1 }],
  customer: { firstName: 'Ana', lastName: 'Pérez', phone: '70000000' },
  billing: { name: 'Ana Pérez', documentType: 'NIT', documentNumber: '00123', documentComplement: null },
  delivery: { method: 'PICKUP', locationId: 'main-store' },
  payment: { method: 'QR', reportedAmountMinor: 605200 },
}

test('order request keeps identifiers, tributary data and reported payment without accepting totals', () => {
  const value = validateOrderRequest(base)
  assert.equal(value.items[0].productId, 'laptop')
  assert.equal(value.billing.documentNumber, '00123')
  assert.equal(value.payment.method, 'QR')
  assert.equal(value.payment.reportedAmountMinor, 605200)
  assert.equal('totals' in value, false)
})

test('order request accepts national and international shipping with a country', () => {
  const address = { recipient: 'Ana Pérez', phone: '70000000', country: 'Bolivia', city: 'La Paz', line1: 'Calle 1', notes: '' }
  assert.equal(validateOrderRequest({ ...base, delivery: { method: 'SHIPPING', scope: 'NATIONAL', address } }).delivery.scope, 'NATIONAL')
  assert.equal(validateOrderRequest({ ...base, delivery: { method: 'SHIPPING', scope: 'INTERNATIONAL', address: { ...address, country: 'Perú' } } }).delivery.scope, 'INTERNATIONAL')
})

test('order request rejects repeated products, invalid payment and incomplete shipping', () => {
  assert.throws(() => validateOrderRequest({ ...base, items: [...base.items, ...base.items] }))
  assert.throws(() => validateOrderRequest({ ...base, payment: { method: 'CASH', reportedAmountMinor: 10 } }))
  assert.throws(() => validateOrderRequest({ ...base, payment: { method: 'QR', reportedAmountMinor: -1 } }))
  assert.throws(() => validateOrderRequest({ ...base, delivery: { method: 'SHIPPING', scope: 'NATIONAL', address: { recipient: '', phone: '', country: '', city: '', line1: '', notes: '' } } }))
})

test('manual actions only expose valid transitions', () => {
  const order = { status: 'REQUESTED', kind: 'RESERVATION' }
  assert.deepEqual(availableAdminActions(order), ['CONFIRM', 'REJECT'])
  assert.deepEqual(availableAdminActions({ ...order, status: 'CONFIRMED' }), ['COMPLETE', 'CANCEL', 'EXPIRE'])
  assert.deepEqual(availableAdminActions({ ...order, status: 'EXPIRED' }), [])
  assert.equal(orderStatusLabel('REQUESTED', true), 'Pago reportado')
  assert.equal(orderStatusLabel('CONFIRMED'), 'Confirmada')
  assert.equal(paymentMethodLabel('CARD'), 'Tarjeta de crédito o débito')
})
