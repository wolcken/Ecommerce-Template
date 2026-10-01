import type { AuthState } from '../../features/auth/auth.models'
import type { CartItem, CustomerCart } from '../../features/cart/cart.models'
import type {
  CategoryRecord,
  InventoryRecord,
  ProductDraft,
  ProductPricing,
  PublicProduct,
} from '../../features/catalog/catalog.models'
import type { Page, PageRequest, Result } from '../../shared/types/domain'

export interface AuthService {
  subscribe(listener: (state: AuthState) => void, onError: (error: Error) => void): () => void
  signIn(email: string, password: string): Promise<Result<void>>
  register(email: string, password: string): Promise<Result<void>>
  signOut(): Promise<Result<void>>
  requestPasswordReset(email: string): Promise<Result<void>>
}

export interface CatalogService {
  listProducts(input: PageRequest & { categoryId?: string; featured?: boolean }): Promise<Result<Page<PublicProduct>>>
  getProductBySlug(slug: string): Promise<Result<PublicProduct | null>>
  listCategories(input: PageRequest): Promise<Result<Page<CategoryRecord>>>
  getCategoryBySlug(slug: string): Promise<Result<CategoryRecord | null>>
}

export interface CartService {
  getMine(): Promise<Result<CustomerCart | null>>
  saveMine(items: readonly CartItem[], expectedVersion: number | null): Promise<Result<CustomerCart>>
}

export interface AdminCatalogService {
  createDraft(input: ProductDraft): Promise<Result<{ productId: string; version: number }>>
  updateDraft(productId: string, input: ProductDraft, expectedVersion: number): Promise<Result<{ version: number }>>
  getPricing(productId: string): Promise<Result<ProductPricing>>
  getInventory(productId: string): Promise<Result<InventoryRecord>>
  deactivate(productId: string, expectedVersion: number): Promise<Result<void>>
}
