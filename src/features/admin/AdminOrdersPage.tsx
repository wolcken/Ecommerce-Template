import { useEffect, useState } from 'react'
import { runtime } from '../../app/services/runtime'
import { storeConfig } from '../../config/store.config'
import { formatMoney } from '../../shared/utils/formatMoney'
import { availableAdminActions, orderStatusLabel } from '../orders/order.logic'
import type { AdminOrderAction, CustomerOrder, OrderKind, OrderStatus } from '../orders/order.models'

const actionLabels: Record<AdminOrderAction, string> = {
  CONFIRM: 'Confirmar y comprometer stock',
  REJECT: 'Rechazar',
  CANCEL: 'Cancelar y liberar stock',
  COMPLETE: 'Completar y consumir stock',
  EXPIRE: 'Marcar vencida y liberar stock',
}

const statuses: OrderStatus[] = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED']

function date(value: string) {
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(runtime.mode === 'firebase')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [kindFilter, setKindFilter] = useState<OrderKind | 'ALL'>('ALL')
  const [search, setSearch] = useState('')

  function load() {
    if (runtime.mode !== 'firebase') return
    runtime.orders
      .listAdmin()
      .then((items) => {
        setOrders(items)
        setError(null)
      })
      .catch((error) => setError(error instanceof Error ? error.message : 'No se pudieron cargar las solicitudes.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function act(order: CustomerOrder, action: AdminOrderAction) {
    if (runtime.mode !== 'firebase') return
    setPending(order.id)
    setError(null)
    try {
      const updated = await runtime.orders.transition({
        orderId: order.id,
        expectedVersion: order.version,
        action,
        note: notes[order.id] ?? '',
      })
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo actualizar la solicitud.')
    } finally {
      setPending(null)
    }
  }

  const term = search.trim().toLocaleLowerCase('es')
  const filtered = orders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false
    if (kindFilter !== 'ALL' && order.kind !== kindFilter) return false
    if (!term) return true
    return [
      order.id,
      order.number ?? '',
      order.customer.firstName,
      order.customer.lastName,
      order.customer.phone,
      order.billing.documentNumber,
    ].some((value) => value.toLocaleLowerCase('es').includes(term))
  })

  return (
    <>
      <p className="eyebrow">Operación manual</p>
      <h1>Pedidos y reservas.</h1>
      <p className="page-intro">
        Confirma después de revisar los datos. La operación recalcula precios y mueve el inventario en una transacción.
      </p>
      {runtime.mode === 'demo' && <p className="notice">La demostración no persiste solicitudes.</p>}
      {runtime.mode === 'firebase' && (
        <div className="order-filters" aria-label="Filtros de solicitudes">
          <label>
            Estado
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as OrderStatus | 'ALL')}>
              <option value="ALL">Todos</option>
              {statuses.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}
            </select>
          </label>
          <label>
            Tipo
            <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as OrderKind | 'ALL')}>
              <option value="ALL">Todos</option>
              <option value="ORDER">Pedidos</option>
              <option value="RESERVATION">Reservas</option>
            </select>
          </label>
          <label>
            Buscar
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Número, cliente, teléfono o documento" />
          </label>
        </div>
      )}
      {loading && <p role="status">Cargando solicitudes…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && runtime.mode === 'firebase' && orders.length === 0 && <p>No hay solicitudes todavía.</p>}
      {!loading && orders.length > 0 && <p className="demo-caption">Mostrando {filtered.length} de {orders.length} solicitudes recientes.</p>}
      <div className="order-list">
        {filtered.map((order) => {
          const pickupId = order.delivery.method === 'PICKUP' ? order.delivery.locationId : null
          const pickup = pickupId
            ? storeConfig.commerce.pickupLocations.find((location) => location.id === pickupId)
            : null
          return (
            <article className="order-card admin-order-card" key={order.id}>
              <header>
                <div>
                  <span className="eyebrow">{order.kind === 'ORDER' ? 'Pedido' : 'Reserva'}</span>
                  <h2>{order.number ?? order.id}</h2>
                </div>
                <span className={`status-pill status-${order.status.toLowerCase()}`}>
                  {orderStatusLabel(order.status)}
                </span>
              </header>
              <div className="order-details">
                <div>
                  <strong>Cliente</strong>
                  <p>{order.customer.firstName} {order.customer.lastName}</p>
                  <p>{order.customer.phone}</p>
                </div>
                <div>
                  <strong>Facturación</strong>
                  <p>{order.billing.name}</p>
                  <p>{order.billing.documentType}: {order.billing.documentNumber}{order.billing.documentComplement ? `-${order.billing.documentComplement}` : ''}</p>
                </div>
                <div>
                  <strong>Entrega</strong>
                  {order.delivery.method === 'PICKUP' ? (
                    <p>{pickup?.name ?? order.delivery.locationId}{pickup ? ` — ${pickup.address}` : ''}</p>
                  ) : (
                    <p>{order.delivery.address.recipient}, {order.delivery.address.line1}, {order.delivery.address.city}</p>
                  )}
                </div>
              </div>
              <p>Enviada el {date(order.createdAt)}</p>
              <ul>
                {order.confirmedItems.length
                  ? order.confirmedItems.map((item) => (
                      <li key={item.productId}>{item.name} — {formatMoney(item.lineTotalMinor)} × {item.quantity}</li>
                    ))
                  : order.requestedItems.map((item) => <li key={item.productId}>{item.productId} × {item.quantity}</li>)}
              </ul>
              {order.totals && <p className="order-total">Total: <strong>{formatMoney(order.totals.totalMinor)}</strong></p>}
              {order.reservedUntil && <p>Vence el {date(order.reservedUntil)}.</p>}
              {availableAdminActions(order).length > 0 && (
                <div className="order-actions">
                  <label>
                    Nota para el cliente
                    <textarea
                      maxLength={500}
                      value={notes[order.id] ?? order.adminNote}
                      onChange={(event) => setNotes((current) => ({ ...current, [order.id]: event.target.value }))}
                    />
                  </label>
                  <div>
                    {availableAdminActions(order).map((action) => (
                      <button
                        className={action === 'CONFIRM' || action === 'COMPLETE' ? 'button' : 'text-button'}
                        disabled={pending === order.id}
                        key={action}
                        onClick={() => void act(order, action)}
                      >
                        {actionLabels[action]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}
