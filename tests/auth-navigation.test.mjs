import assert from 'node:assert/strict'
import test from 'node:test'
import { postAuthDestination } from '../src/features/auth/auth.navigation.ts'

test('USER lands in the collection and ADMIN lands in administration', () => {
  assert.equal(postAuthDestination('USER'), '/productos')
  assert.equal(postAuthDestination('ADMIN'), '/admin')
})

test('authentication returns to an allowed requested route', () => {
  assert.equal(postAuthDestination('USER', '/checkout'), '/checkout')
  assert.equal(postAuthDestination('ADMIN', '/admin/solicitudes'), '/admin/solicitudes')
})

test('USER cannot be redirected into ADMIN and auth routes never loop', () => {
  assert.equal(postAuthDestination('USER', '/admin'), '/productos')
  assert.equal(postAuthDestination('USER', '/login'), '/productos')
  assert.equal(postAuthDestination('ADMIN', '//external.example'), '/admin')
})
