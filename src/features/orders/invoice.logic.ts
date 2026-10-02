import type { CustomerOrder } from './order.models'

export function canGenerateInvoice(order: CustomerOrder) {
  if (order.status !== 'COMPLETED' || !order.number || order.confirmedItems.length === 0 || !order.totals) {
    return false
  }

  const itemsMinor = order.confirmedItems.reduce((total, item) => {
    const expectedLineTotal = item.unitPriceMinor * item.quantity
    if (!Number.isSafeInteger(expectedLineTotal) || expectedLineTotal !== item.lineTotalMinor) return Number.NaN
    return total + item.lineTotalMinor
  }, 0)

  const expectedTotal = order.totals.itemsMinor + order.totals.shippingMinor
  return order.status === 'COMPLETED'
    && Number.isSafeInteger(itemsMinor)
    && itemsMinor === order.totals.itemsMinor
    && Number.isSafeInteger(expectedTotal)
    && order.totals.totalMinor === expectedTotal
}
