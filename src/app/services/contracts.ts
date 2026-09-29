import type { AuthState, ProfileInput, UserProfile } from '../../features/auth/auth.models'
import type { CartItem, CustomerCart } from '../../features/cart/cart.models'
import type { CategoryRecord, InventoryRecord, ProductDraft, ProductPricing, PublicProduct } from '../../features/catalog/catalog.models'
import type { CheckoutInput, CheckoutQuote, CustomerOrder } from '../../features/orders/order.models'
import type { Page, PageRequest, Result } from '../../shared/types/domain'

/**
 * Contratos sin implementación. TypeScript no valida datos remotos ni autoriza.
 * Cada adaptador validará entradas/salidas; el servidor verificará la identidad.
 * ownerId/role nunca se reciben del cliente para decidir permisos.
 */
export interface AuthService {
  subscribe(listener: (state: AuthState) => void, onError: (error: Error) => void): () => void
  signIn(email: string, password: string): Promise<Result<void>>
  register(email: string, password: string): Promise<Result<void>>
  signOut(): Promise<Result<void>>
  requestPasswordReset(email: string): Promise<Result<void>>
}

export interface ProfileService {
  getMine(): Promise<Result<UserProfile | null>>
  saveMine(input: ProfileInput, expectedVersion: number | null): Promise<Result<UserProfile>>
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

export interface CheckoutService {
  createQuote(input: CheckoutInput): Promise<Result<CheckoutQuote>>
  /** Servidor recupera la cotización, revalida y confirma atómicamente. */
  confirm(input: { quoteId: string; idempotencyKey: string }): Promise<Result<CustomerOrder>>
}

export interface OrderService {
  listMine(input: PageRequest): Promise<Result<Page<CustomerOrder>>>
  getMine(orderId: string): Promise<Result<CustomerOrder | null>>
  /** El servidor decide si el estado y la política permiten cancelar. */
  cancelMine(input: { orderId: string; expectedVersion: number; idempotencyKey: string }): Promise<Result<CustomerOrder>>
}

export interface AdminCatalogService {
  /** Crear un borrador nunca lo publica ni calcula un precio implícito. */
  createDraft(input: ProductDraft): Promise<Result<{ productId: string; version: number }>>
  updateDraft(productId: string, input: ProductDraft, expectedVersion: number): Promise<Result<{ version: number }>>
  getPricing(productId: string): Promise<Result<ProductPricing>>
  getInventory(productId: string): Promise<Result<InventoryRecord>>
  /** Evitar el borrado físico de productos referenciados por pedidos. */
  deactivate(productId: string, expectedVersion: number): Promise<Result<void>>
}
