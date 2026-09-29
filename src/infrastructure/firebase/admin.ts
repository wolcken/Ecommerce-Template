import { httpsCallable, type Functions } from 'firebase/functions'
import type { AdminPage, AdminCategory, AdminProduct, CategoryInput, ProductInput, CatalogAdminService } from '../../features/admin/admin.models'

export function createAdminService(functions: Functions): CatalogAdminService {
  async function call<T>(name: string, input: unknown): Promise<T> {
    try { return (await httpsCallable<unknown,T>(functions,name)(input)).data }
    catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
      if (['functions/invalid-argument','functions/failed-precondition','functions/aborted','functions/permission-denied','functions/unauthenticated'].includes(code) && error instanceof Error) throw new Error(error.message, { cause: error })
      throw new Error('No se pudo conectar con la administración. Verifica que las funciones estén desplegadas e intenta de nuevo.', { cause: error })
    }
  }
  return {
    listCategories: cursor => call<AdminPage<AdminCategory>>('listAdminCatalog',{kind:'categories',...(cursor ? {cursor}: {})}),
    listProducts: cursor => call<AdminPage<AdminProduct>>('listAdminCatalog',{kind:'products',...(cursor ? {cursor}: {})}),
    saveCategory: async (input: CategoryInput) => { await call('saveCategory',input) },
    saveProduct: async (input: ProductInput) => { await call('saveProduct',input) },
  }
}
