import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { useCatalog } from '../catalog/catalog.context'
import type { InventorySummary } from './admin.models'

export function AdminDashboard() {
  const { products, categories, loading: catalogLoading, error: catalogError } = useCatalog()
  const service = runtime.mode === 'firebase' ? runtime.admin : null
  const [inventory, setInventory] = useState<InventorySummary | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(Boolean(service))
  const [inventoryError, setInventoryError] = useState('')

  useEffect(() => {
    if (!service) return
    let cancelled = false
    service.getInventorySummary()
      .then((summary) => {
        if (!cancelled) {
          setInventory(summary)
          setInventoryError('')
        }
      })
      .catch((error) => {
        if (!cancelled) setInventoryError(error instanceof Error ? error.message : 'No se pudo cargar el inventario.')
      })
      .finally(() => {
        if (!cancelled) setInventoryLoading(false)
      })
    return () => { cancelled = true }
  }, [service])

  const loading = catalogLoading || inventoryLoading
  const error = catalogError || inventoryError
  const stockValue = (value: number | undefined) => inventoryLoading || inventoryError ? '—' : value ?? '—'

  return (
    <>
      <p className="eyebrow">Administración</p>
      <h1>Tu catálogo y solicitudes, bajo control.</h1>
      <p className="page-intro">Consulta el inventario disponible y gestiona productos, pedidos y reservas.</p>
      {loading && <p role="status">Actualizando el resumen…</p>}
      {error && <p role="alert">No se pudo completar el resumen. {inventoryError || 'Revisa la conexión de Firebase.'}</p>}
      <div className="stat-grid">
        <Link className="stat-card" to="/admin/productos"><span>Productos publicados</span><strong>{catalogLoading || catalogError ? '—' : products.length}</strong><span>Ver inventario por producto ↗</span></Link>
        <div className="stat-card"><span>Stock físico</span><strong>{stockValue(inventory?.onHand)}</strong><span>Unidades registradas</span></div>
        <div className="stat-card"><span>Comprometido</span><strong>{stockValue(inventory?.committed)}</strong><span>Pedidos y reservas confirmados</span></div>
        <Link className="stat-card stat-card-primary" to="/admin/productos"><span>Disponible</span><strong>{stockValue(inventory?.available)}</strong><span>Unidades que puedes confirmar ↗</span></Link>
        <Link className="stat-card" to="/admin/categorias"><span>Categorías publicadas</span><strong>{catalogLoading || catalogError ? '—' : categories.length}</strong><span>Administrar categorías ↗</span></Link>
        <Link className="stat-card" to="/admin/solicitudes"><span>Operación comercial</span><strong>↗</strong><span>Revisar solicitudes</span></Link>
      </div>
      <section className="admin-next">
        <h2>Cómo leer el inventario.</h2>
        <p><strong>Stock físico</strong> es lo que tienes en almacén. <strong>Comprometido</strong> ya pertenece a pedidos o reservas confirmados. <strong>Disponible</strong> es la cantidad que todavía puedes confirmar.</p>
      </section>
    </>
  )
}
