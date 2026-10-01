import test from 'node:test'
import assert from 'node:assert/strict'
import { validateProfileInput } from '../src/features/auth/profile.logic.ts'

test('profile accepts reusable buyer and billing data', () => {
  const profile = validateProfileInput({
    firstName: ' Ana ',
    lastName: ' Pérez ',
    phone: ' 70000000 ',
    billing: {
      name: ' Empresa Uno ',
      documentType: 'NIT',
      documentNumber: '00123',
      documentComplement: 'ignored',
    },
  })
  assert.equal(profile.firstName, 'Ana')
  assert.equal(profile.billing.documentNumber, '00123')
  assert.equal(profile.billing.documentComplement, null)
})

test('profile may omit billing but never buyer identity', () => {
  const profile = validateProfileInput({ firstName: 'Ana', lastName: 'Pérez', phone: '70000000', billing: null })
  assert.equal(profile.billing, null)
  assert.throws(() => validateProfileInput({ ...profile, phone: ' ' }))
})
