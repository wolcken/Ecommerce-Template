export type ProductIllustration = 'headphones' | 'lamp' | 'bag'

export interface Category {
  id: string
  slug: string
  name: string
  description: string
}

export interface CatalogProduct {
  id: string
  slug: string
  name: string
  categoryId: string
  description: string
  priceMinor: number
  illustration: ProductIllustration
  color: string
}
