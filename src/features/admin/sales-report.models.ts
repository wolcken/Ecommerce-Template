import type { Instant, MinorAmount } from '../../shared/types/domain'

export interface SalesReportItem {
  productId: string
  sku: string
  name: string
  categoryName: string | null
  quantity: number
  unitSaleMinor: MinorAmount
  saleMinor: MinorAmount
  costMinor: MinorAmount | null
  profitMinor: MinorAmount | null
  taxMinor: MinorAmount | null
}

export interface SalesReportOrder {
  id: string
  number: string
  completedAt: Instant
  customerName: string
  items: readonly SalesReportItem[]
  shippingMinor: MinorAmount
  totalMinor: MinorAmount
  commercialDataComplete: boolean
}

export interface SalesReportResult {
  orders: readonly SalesReportOrder[]
  truncated: boolean
}

export interface SalesReportService {
  list(input: { from: Instant; until: Instant }): Promise<SalesReportResult>
}

export interface SalesReportRow extends SalesReportItem {
  orderId: string
  orderNumber: string
  completedAt: Instant
  customerName: string
}

export interface SalesReportSummary {
  orderCount: number
  lineCount: number
  units: number
  itemsMinor: MinorAmount
  shippingMinor: MinorAmount
  totalMinor: MinorAmount
  costMinor: MinorAmount
  profitMinor: MinorAmount
  taxMinor: MinorAmount
  missingCommercialLines: number
}

export interface SalesReportView {
  rows: readonly SalesReportRow[]
  summary: SalesReportSummary
}
