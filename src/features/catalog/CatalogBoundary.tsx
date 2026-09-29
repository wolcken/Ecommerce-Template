import type { ReactNode } from 'react'
import { useCatalog } from './catalog.context'

export function CatalogBoundary({ children }: { children: ReactNode }) {
  const { loading, error } = useCatalog()
  if (loading) return <p className="service-status" role="status">Cargando catálogo…</p>
  if (error) return <section className="service-status" role="alert"><h1>No pudimos cargar el catálogo.</h1><p>{error}</p><button className="button" onClick={() => window.location.reload()}>Reintentar</button></section>
  return children
}
