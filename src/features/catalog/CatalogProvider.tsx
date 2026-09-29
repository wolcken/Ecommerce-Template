import { useEffect, useState, type ReactNode } from 'react'
import { runtime } from '../../app/services/runtime'
import { products, categories } from './data/demoCatalog'
import { CatalogContext, type CatalogState } from './catalog.context'
import type { Page, PageRequest, Result } from '../../shared/types/domain'

async function allPages<T>(fetch: (input: PageRequest) => Promise<Result<Page<T>>>): Promise<T[]> {
  const rows: T[] = []
  let cursor: string | undefined
  do {
    const response = await fetch({ limit: 100, cursor })
    if (!response.ok) throw new Error(response.error.message)
    rows.push(...response.value.items)
    const next = response.value.nextCursor
    if (next === cursor) throw new Error('No se pudo continuar la lectura del catálogo.')
    cursor = next ?? undefined
  } while (cursor)
  return rows
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>(() => runtime.mode === 'demo'
    ? { products, categories, loading: false, error: null }
    : { products: [], categories: [], loading: true, error: null })
  useEffect(() => {
    if (runtime.mode !== 'firebase') return
    const service = runtime.catalog
    let cancelled = false
    Promise.all([allPages(service.listProducts), allPages(service.listCategories)]).then(([products, categories]) => {
      if (!cancelled) setState({
        products: products.filter(p => categories.some(c => c.id === p.categoryId)),
        categories: categories.sort((a, b) => a.position - b.position),
        loading: false, error: null,
      })
    }).catch(error => { if (!cancelled) setState({ products: [], categories: [], loading: false, error: error instanceof Error ? error.message : 'No se pudo cargar el catálogo.' }) })
    return () => { cancelled = true }
  }, [])
  return <CatalogContext value={state}>{children}</CatalogContext>
}
