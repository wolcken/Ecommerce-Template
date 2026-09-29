export interface CategoryInput {
  id: string
  expectedVersion: number
  name: string
  slug: string
  description: string
  active: boolean
}
export interface ProductInput {
  id: string
  expectedVersion: number
  name: string
  slug: string
  sku: string
  description: string
  categoryId: string
  imageUrl: string
  costMinor: number
  profitMinor: number
  billingRateBps: number
  onHand: number
  active: boolean
}
export interface AdminCategory extends Omit<CategoryInput, 'expectedVersion'> { version: number }
export interface AdminProduct extends Omit<ProductInput, 'expectedVersion'> {
  version: number
  priceMinor: number
  committed: number
}
export interface AdminPage<T> { items: T[]; nextCursor: string | null }
export interface CatalogAdminService {
  listCategories(cursor?: string): Promise<AdminPage<AdminCategory>>
  listProducts(cursor?: string): Promise<AdminPage<AdminProduct>>
  saveCategory(input: CategoryInput): Promise<void>
  saveProduct(input: ProductInput): Promise<void>
}
