import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeInventory } from '../src/features/admin/inventory.logic.ts'

test('inventory summary separates physical, committed and available units', () => {
  assert.deepEqual(
    summarizeInventory([
      { onHand: 10, committed: 3 },
      { onHand: 4, committed: 4 },
      { onHand: 0, committed: 0 },
    ]),
    { productCount: 3, onHand: 14, committed: 7, available: 7 },
  )
})

test('inventory summary rejects impossible stock values', () => {
  assert.throws(() => summarizeInventory([{ onHand: 2, committed: 3 }]), /valores inválidos/)
  assert.throws(() => summarizeInventory([{ onHand: -1, committed: 0 }]), /valores inválidos/)
  assert.throws(() => summarizeInventory([{ onHand: 1.5, committed: 0 }]), /valores inválidos/)
})

test('empty inventory returns a zero summary', () => {
  assert.deepEqual(summarizeInventory([]), { productCount: 0, onHand: 0, committed: 0, available: 0 })
})
