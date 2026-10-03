import { useEffect, useState } from 'react'
import { runtime } from '../../app/services/runtime'
import { storeConfig } from '../../config/store.config'
import { formatMoney } from '../../shared/utils/formatMoney'
import { availableAdminActions, orderStatusLabel, paymentMethodLabel } from '../orders/order.logic'
import type { AdminOrderAction, CustomerOrder, OrderKind, OrderStatus } from '../orders/order.models'
import type { AdminCategory, AdminProduct, CatalogAdminService } from './admin.models'
import { commercialAmounts, type CommercialAmounts } from './order-commercial.logic'

const actionLabels: Record<AdminOrderAction, string> = {
  CONFIRM: 'Validar pago y comprometer stock',
  REJECT: 'Rechazar',
  CANCEL: 'Cancelar y liberar stock',
  COMPLETE: 'Completar y consumir stock',
  EXPIRE: 'Marcar vencida y liberar stock',
}

const statuses: OrderStatus[] = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED']

function date(value: string) {
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function percent(basisPoints: number) {
  return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(basisPoints / 100) + ' %'
}

async function loadAdminCatalog(service: CatalogAdminService) {
  const products: AdminProduct[] = []
  const categories: AdminCategory[] = []
  let productCursor: string | undefined
  let categoryCursor: string | undefined
  do {
    const page = await service.listProducts(productCursor)
    products.push(...page.items)
    productCursor = page.nextCursor ?? undefined
  } while (productCursor)
  do {
    const page = await service.listCategories(categoryCursor)
    categories.push(...page.items)
    categoryCursor = page.nextCursor ?? undefined
  } while (categoryCursor)
  return { products, categories }
}

function amountsFor(product: AdminProduct | undefined, quantity: number): CommercialAmounts | null {
  if (!product) return null
  try { return commercialAmounts(product, quantity) } catch { return null }
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [catalog, setCatalog] = useState<{ products: AdminProduct[]; categories: AdminCategory[] }>({ products: [], categories: [] })
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(runtime.mode === 'firebase')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [kindFilter, setKindFilter] = useState<OrderKind | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  function load() {
    if (runtime.mode !== 'firebase') return
    Promise.all([runtime.orders.listAdmin(), loadAdminCatalog(runtime.admin)]).then(([items, adminCatalog]) => {
      setOrders(items)
      setCatalog(adminCatalog)
      setError(null)
    })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'No se pudieron cargar las solicitudes.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function act(order: CustomerOrder, action: AdminOrderAction) {
    if (runtime.mode !== 'firebase') return
    setPending(order.id)
    setError(null)
    try {
      const updated = await runtime.orders.transition({ orderId: order.id, expectedVersion: order.version, action, note: notes[order.id] ?? '' })
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la solicitud.')
    } finally {
      setPending(null)
    }
  }

  const term = search.trim().toLocaleLowerCase('es')
  const filtered = orders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false
    if (kindFilter !== 'ALL' && order.kind !== kindFilter) return false
    if (!term) return true
    const productTerms = order.requestedItems.flatMap((item) => {
      const product = catalog.products.find((entry) => entry.id === item.productId)
      const category = catalog.categories.find((entry) => entry.id === product?.categoryId)
      return [item.productId, product?.name ?? '', product?.sku ?? '', category?.name ?? '']
    })
    return [order.id, order.number ?? '', order.customer.firstName, order.customer.lastName, order.customer.phone, order.billing.documentNumber, order.payment?.reference ?? '', ...productTerms]
      .some((value) => value.toLocaleLowerCase('es').includes(term))
  })

  return (
    <>
      <p className="eyebrow">Validación comercial</p>
      <h1>Pedidos y reservas.</h1>
      <p className="page-intro">Valida el pago reportado antes de confirmar. La operación recalcula precios y compromete el inventario en una transacción.</p>
      {runtime.mode === 'demo' && <p className="notice">La demostración no persiste solicitudes.</p>}
      {runtime.mode === 'firebase' && (
        <div className="order-filters" aria-label="Filtros de solicitudes">
          <label>Estado<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as OrderStatus | 'ALL')}><option value="ALL">Todos</option>{statuses.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}</select></label>
          <label>Tipo<select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as OrderKind | 'ALL')}><option value="ALL">Todos</option><option value="ORDER">Pedidos</option><option value="RESERVATION">Reservas</option></select></label>
          <label>Buscar<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Número, cliente, documento o pago" /></label>
        </div>
      )}
      {loading && <p role="status">Cargando solicitudes…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && runtime.mode === 'firebase' && orders.length === 0 && <p>No hay solicitudes todavía.</p>}
      {!loading && orders.length > 0 && <p className="demo-caption">Mostrando {filtered.length} de {orders.length} solicitudes recientes.</p>}
      <div className="order-list">
        {filtered.map((order) => {
          const pickupId = order.delivery.method === 'PICKUP' ? order.delivery.locationId : null
          const pickup = pickupId ? storeConfig.commerce.pickupLocations.find((location) => location.id === pickupId) : null
          const lines = order.requestedItems.map((request) => {
            const product = catalog.products.find((item) => item.id === request.productId)
            const category = catalog.categories.find((item) => item.id === product?.categoryId)
            const confirmed = order.confirmedItems.find((item) => item.productId === request.productId)
            return { request, product, category, confirmed, amounts: amountsFor(product, request.quantity) }
          })
          const completeCommercialData = lines.every((line) => line.amounts)
          const commercialTotals = lines.reduce((total, line) => ({
            costMinor: total.costMinor + (line.amounts?.costMinor ?? 0),
            profitMinor: total.profitMinor + (line.amounts?.profitMinor ?? 0),
            taxMinor: total.taxMinor + (line.amounts?.taxMinor ?? 0),
            saleMinor: total.saleMinor + (line.amounts?.saleMinor ?? 0),
          }), { costMinor: 0, profitMinor: 0, taxMinor: 0, saleMinor: 0 })
          return (
            <article className="order-card admin-order-card" key={order.id}>
              <header>
                <div><span className="eyebrow">{order.kind === 'ORDER' ? 'Pedido' : 'Reserva'}</span><h2>{order.number ?? order.id}</h2></div>
                <span className={`status-pill status-${order.status.toLowerCase()}`}>{orderStatusLabel(order.status, Boolean(order.payment))}</span>
              </header>
              <div className="order-details">
                <div><strong>Cliente</strong><p>{order.customer.firstName} {order.customer.lastName}</p><p>{order.customer.phone}</p></div>
                <div><strong>Datos tributarios</strong><p>{order.billing.name}</p><p>{order.billing.documentType}: {order.billing.documentNumber}{order.billing.documentComplement ? `-${order.billing.documentComplement}` : ''}</p></div>
                <div>
                  <strong>Entrega</strong>
                  {order.delivery.method === 'PICKUP'
                    ? <p>{pickup?.name ?? order.delivery.locationId}{pickup ? ` — ${pickup.address}` : ''}</p>
                    : <><p>Envío {order.delivery.scope === 'INTERNATIONAL' ? 'internacional' : 'nacional'}</p><p>{order.delivery.address.recipient}, {order.delivery.address.line1}, {order.delivery.address.city}, {order.delivery.address.country}</p></>}
                </div>
                <div>
                  <strong>{order.payment ? 'Pago reportado' : 'Pago'}</strong>
                  {order.payment
                    ? <><p>{paymentMethodLabel(order.payment.method)} — {formatMoney(order.payment.reportedAmountMinor)}</p><p>{order.payment.reference}</p><p>{date(order.payment.reportedAt)}</p></>
                    : <p>Solicitud anterior sin reporte de pago.</p>}
                </div>
              </div>
              <p>Enviada el {date(order.createdAt)}</p>
              <section className="admin-order-products" aria-label="Desglose comercial de productos">
                <h3>Productos y desglose comercial</h3>
                <p className="commercial-context">Costo, ganancia, recargo y disponibilidad según la configuración privada actual del catálogo.</p>
                {lines.map(({ request, product, category, confirmed, amounts }) => (
                  <article className="admin-order-product" key={request.productId}>
                    <header>
                      <div><strong>{confirmed?.name ?? product?.name ?? request.productId}</strong><span>{product?.sku ?? confirmed?.sku ?? 'SKU no disponible'}</span></div>
                      <span className="product-type-pill">{category?.name ?? 'Categoría no disponible'}</span>
                    </header>
                    {product && amounts ? (
                      <>
                        <dl className="admin-commercial-grid">
                          <div><dt>Cantidad</dt><dd>{request.quantity}</dd></div>
                          <div><dt>Costo unitario</dt><dd>{formatMoney(product.costMinor)}</dd></div>
                          <div><dt>Ganancia unitaria</dt><dd>{formatMoney(product.profitMinor)} <small>({percent(amounts.profitRateBps)})</small></dd></div>
                          <div><dt>Base antes del recargo</dt><dd>{formatMoney(product.costMinor + product.profitMinor)}</dd></div>
                          <div><dt>Recargo tributario</dt><dd>{formatMoney(product.priceMinor - product.costMinor - product.profitMinor)} <small>({percent(product.billingRateBps)})</small></dd></div>
                          <div><dt>Precio de venta unitario</dt><dd>{formatMoney(product.priceMinor)}</dd></div>
                          <div><dt>Disponible actualmente</dt><dd>{product.onHand - product.committed}</dd></div>
                          <div><dt>Venta total de la línea</dt><dd>{formatMoney(amounts.saleMinor)}</dd></div>
                        </dl>
                        {confirmed && confirmed.unitPriceMinor !== product.priceMinor && <p className="commercial-price-note">Precio confirmado en la solicitud: {formatMoney(confirmed.unitPriceMinor)} por unidad.</p>}
                      </>
                    ) : <p className="commercial-price-note">No se encontró el desglose privado actual de este producto.</p>}
                  </article>
                ))}
                {completeCommercialData && (
                  <div className="admin-commercial-totals">
                    <div><span>Costo de productos</span><strong>{formatMoney(commercialTotals.costMinor)}</strong></div>
                    <div><span>Ganancia prevista</span><strong>{formatMoney(commercialTotals.profitMinor)}</strong></div>
                    <div><span>Recargo tributario</span><strong>{formatMoney(commercialTotals.taxMinor)}</strong></div>
                    <div><span>Venta de productos</span><strong>{formatMoney(commercialTotals.saleMinor)}</strong></div>
                  </div>
                )}
              </section>
              {order.totals && <p className="order-total">Total confirmado: <strong>{formatMoney(order.totals.totalMinor)}</strong></p>}
              {order.reservedUntil && <p>Vence el {date(order.reservedUntil)}.</p>}
              {availableAdminActions(order).length > 0 && (
                <div className="order-actions">
                  <label>Nota para el cliente<textarea maxLength={500} value={notes[order.id] ?? order.adminNote} onChange={(event) => setNotes((current) => ({ ...current, [order.id]: event.target.value }))} /></label>
                  <div>{availableAdminActions(order).map((action) => <button className={action === 'CONFIRM' || action === 'COMPLETE' ? 'button' : 'text-button'} disabled={pending === order.id} key={action} onClick={() => void act(order, action)}>{actionLabels[action]}</button>)}</div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}
