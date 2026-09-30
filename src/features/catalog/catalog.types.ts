import type { CategoryRecord, PublicProduct } from './catalog.models'

export type ProductIllustration = 'headphones' | 'lamp' | 'bag'

export type Category = Pick<CategoryRecord, 'id' | 'slug' | 'name' | 'description'>

/** Proyección de presentación exclusiva del catálogo de demostración. */
export interface CatalogProduct extends Pick<PublicProduct, 'id' | 'slug' | 'name' | 'categoryId' | 'description' | 'priceMinor'> {
  availability?: PublicProduct['availability']
  illustration?: ProductIllustration
  color?: string
  images?: PublicProduct['images']
}
