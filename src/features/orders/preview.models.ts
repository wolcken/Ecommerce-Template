

export interface PreviewInput {
  items: readonly { productId: string; quantity: number }[]
  kind: 'ORDER' | 'RESERVATION'
  deliveryMethod: 'PICKUP' | 'SHIPPING'
}
export interface CheckoutPreview {
  items: { productId: string; name: string; quantity: number; unitPriceMinor: number; lineTotalMinor: number }[]
  itemsMinor: number
  shippingMinor: number
  totalMinor: number
  currency: 'BOB'
  kind: PreviewInput['kind']
  deliveryMethod: PreviewInput['deliveryMethod']
  simulatedDelivery: true
  reservationHours: 24
  checkedAt: number
}
export interface CheckoutPreviewService {
  preview(input: PreviewInput): Promise<CheckoutPreview>
}
