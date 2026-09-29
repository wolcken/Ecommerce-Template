import { collection, documentId, getDocsFromServer, limit, orderBy, query, startAfter, where, type Firestore, type QueryConstraint } from 'firebase/firestore'
import type { CatalogService } from '../../app/services/contracts'
import type { Page, PageRequest, Result } from '../../shared/types/domain'
import { parseCategory, parseProduct } from './catalogValidation'

async function result<T>(action: () => Promise<T>): Promise<Result<T>> {
  try { return { ok: true, value: await action() } }
  catch { return { ok: false, error: { code: 'UNAVAILABLE', message: 'No se pudo cargar el catálogo. Comprueba conexión, reglas y formato de los datos.' } } }
}

export function createCatalogService(db: Firestore): CatalogService {
  async function list<T>(name: string, input: PageRequest, parse: (id: string, data: unknown) => T, extra: QueryConstraint[] = []): Promise<Page<T>> {
    if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 100) throw new Error('Límite inválido')
    const constraints = [where('active', '==', true), ...extra, orderBy(documentId()), limit(input.limit)]
    if (input.cursor) constraints.push(startAfter(input.cursor))
    const docs = (await getDocsFromServer(query(collection(db, name), ...constraints))).docs
    return { items: docs.map(doc => parse(doc.id, doc.data())), nextCursor: docs.length === input.limit ? docs[docs.length - 1].id : null }
  }
  async function bySlug<T>(name: string, slug: string, parse: (id: string, data: unknown) => T): Promise<T | null> {
    const docs = (await getDocsFromServer(query(collection(db, name), where('active', '==', true), where('slug', '==', slug), limit(2)))).docs
    if (docs.length > 1) throw new Error('Slug duplicado')
    return docs[0] ? parse(docs[0].id, docs[0].data()) : null
  }
  return {
    listProducts: input => result(() => list('products', input, parseProduct, [
      ...(input.categoryId ? [where('categoryId', '==', input.categoryId)] : []),
      ...(input.featured !== undefined ? [where('featured', '==', input.featured)] : []),
    ])),
    listCategories: input => result(() => list('categories', input, parseCategory)),
    getProductBySlug: slug => result(() => bySlug('products', slug, parseProduct)),
    getCategoryBySlug: slug => result(() => bySlug('categories', slug, parseCategory)),
  }
}
