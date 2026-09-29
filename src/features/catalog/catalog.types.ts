import type { CategoryRecord, PublicProduct } from './catalog.models'

export type ProductIllustration = 'headphones' | 'lamp' | 'bag'

export type Category = Pick<CategoryRecord, 'id' | 'slug' | 'name' | 'description'>

/** Proyección de presentación exclusiva del catálogo de demostración. */
export interface CatalogProduct extends Pick<PublicProduct, 'id' | 'slug' | 'name' | 'categoryId' | 'description' | 'priceMinor'> {
  illustration: ProductIllustration
  color: string
}
