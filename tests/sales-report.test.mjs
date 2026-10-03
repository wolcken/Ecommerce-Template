import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSalesReportView, initialSalesReportDates, salesReportRange } from '../src/features/admin/sales-report.logic.ts'

test('sales report uses the current month and inclusive local dates', () => {
  assert.deepEqual(initialSalesReportDates(new Date(2026, 9, 3, 12)), { from: '2026-10-01', to: '2026-10-03' })
  const range = salesReportRange('2026-10-01', '2026-10-03')
  const from = new Date(range.from)
  const until = new Date(range.until)
  assert.deepEqual([from.getFullYear(), from.getMonth(), from.getDate()], [2026, 9, 1])
  assert.deepEqual([until.getFullYear(), until.getMonth(), until.getDate()], [2026, 9, 4])
})

test('sales report rejects reversed, invalid and excessive ranges', () => {
  assert.throws(() => salesReportRange('2026-10-03', '2026-10-01'))
  assert.throws(() => salesReportRange('2026-02-30', '2026-03-01'))
  assert.throws(() => salesReportRange('2025-01-01', '2026-12-31'))
})

test('sales report aggregates sold items, shipping, costs and profit', () => {
  const order = {
    id: 'order-1', number: 'PED-1', completedAt: '2026-10-03T12:00:00.000Z', customerName: 'Ana Perez',
    shippingMinor: 2000, totalMinor: 1208400, commercialDataComplete: true,
    items: [{ productId: 'laptop', sku: 'LAP', name: 'Laptop', categoryName: 'Tecnologia', quantity: 2,
      unitSaleMinor: 603200, saleMinor: 1206400, costMinor: 1000000, profitMinor: 40000, taxMinor: 166400 }],
  }
  assert.deepEqual(buildSalesReportView([order]).summary, {
    orderCount: 1, lineCount: 1, units: 2, itemsMinor: 1206400, shippingMinor: 2000, totalMinor: 1208400,
    costMinor: 1000000, profitMinor: 40000, taxMinor: 166400, missingCommercialLines: 0,
  })
})

test('legacy sales keep their total and report missing commercial data', () => {
  const order = {
    id: 'legacy', number: 'PED-OLD', completedAt: '2026-09-01T12:00:00.000Z', customerName: 'Cliente',
    shippingMinor: 0, totalMinor: 10000, commercialDataComplete: false,
    items: [{ productId: 'old', sku: 'OLD', name: 'Anterior', categoryName: null, quantity: 1,
      unitSaleMinor: 10000, saleMinor: 10000, costMinor: null, profitMinor: null, taxMinor: null }],
  }
  const view = buildSalesReportView([order])
  assert.equal(view.summary.totalMinor, 10000)
  assert.equal(view.summary.missingCommercialLines, 1)
})
