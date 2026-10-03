import type { SalesReportOrder, SalesReportView } from './sales-report.models'

export const MAX_SALES_REPORT_DAYS = 366

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function dateInputValue(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new Error('Selecciona fechas válidas.')
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error('Selecciona fechas válidas.')
  }
  date.setHours(0, 0, 0, 0)
  return date
}

export function initialSalesReportDates(now = new Date()) {
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: dateInputValue(from), to: dateInputValue(to) }
}

export function salesReportRange(fromValue: string, toValue: string) {
  const from = parseLocalDate(fromValue)
  const to = parseLocalDate(toValue)
  if (from > to) throw new Error('La fecha inicial no puede ser posterior a la fecha final.')
  const until = new Date(to)
  until.setDate(until.getDate() + 1)
  const days = Math.round((until.getTime() - from.getTime()) / 86_400_000)
  if (days > MAX_SALES_REPORT_DAYS) {
    throw new Error(`El rango máximo del informe es de ${MAX_SALES_REPORT_DAYS} días.`)
  }
  return { from: from.toISOString(), until: until.toISOString() }
}

function addSafe(total: number, value: number) {
  const result = total + value
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('El informe excede el límite numérico permitido.')
  return result
}

export function buildSalesReportView(orders: readonly SalesReportOrder[]): SalesReportView {
  const rows = orders.flatMap((order) => order.items.map((item) => ({
    ...item,
    orderId: order.id,
    orderNumber: order.number,
    completedAt: order.completedAt,
    customerName: order.customerName,
  })))

  const summary = rows.reduce((total, row) => ({
    ...total,
    units: addSafe(total.units, row.quantity),
    itemsMinor: addSafe(total.itemsMinor, row.saleMinor),
    costMinor: addSafe(total.costMinor, row.costMinor ?? 0),
    profitMinor: addSafe(total.profitMinor, row.profitMinor ?? 0),
    taxMinor: addSafe(total.taxMinor, row.taxMinor ?? 0),
    missingCommercialLines: total.missingCommercialLines + (row.costMinor === null || row.profitMinor === null || row.taxMinor === null ? 1 : 0),
  }), {
    orderCount: orders.length,
    lineCount: rows.length,
    units: 0,
    itemsMinor: 0,
    shippingMinor: 0,
    totalMinor: 0,
    costMinor: 0,
    profitMinor: 0,
    taxMinor: 0,
    missingCommercialLines: 0,
  })

  summary.shippingMinor = orders.reduce((total, order) => addSafe(total, order.shippingMinor), 0)
  summary.totalMinor = orders.reduce((total, order) => addSafe(total, order.totalMinor), 0)
  return { rows, summary }
}
