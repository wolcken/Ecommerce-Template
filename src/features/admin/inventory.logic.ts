import type { InventorySummary } from './admin.models'

export function summarizeInventory(rows: readonly { onHand: number; committed: number }[]): InventorySummary {
  return rows.reduce<InventorySummary>((summary, row) => {
    if (
      !Number.isSafeInteger(row.onHand)
      || !Number.isSafeInteger(row.committed)
      || row.onHand < 0
      || row.committed < 0
      || row.committed > row.onHand
    ) {
      throw new Error('El inventario contiene valores inválidos.')
    }
    return {
      productCount: summary.productCount + 1,
      onHand: summary.onHand + row.onHand,
      committed: summary.committed + row.committed,
      available: summary.available + row.onHand - row.committed,
    }
  }, { productCount: 0, onHand: 0, committed: 0, available: 0 })
}
