import { useEffect, useState } from 'react'
import { runtime } from '../../app/services/runtime'
import { formatMoney } from '../../shared/utils/formatMoney'
import { availableAdminActions, orderStatusLabel } from '../orders/order.logic'
import type { AdminOrderAction, CustomerOrder } from '../orders/order.models'

const actionLabels: Record<AdminOrderAction, string> = {
  CONFIRM: 'Confirmar y comprometer stock',
  REJECT: 'Rechazar',
  CANCEL: 'Cancelar y liberar stock',
  COMPLETE: 'Completar y consumir stock',
  EXPIRE: 'Marcar vencida y liberar stock',
}

function date(value: string) {
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(runtime.mode === 'firebase')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <>
      <p className="eyebrow">Operación manual</p>
      <h1>Pedidos y reservas.</h1>
      <p className="page-intro">
        Confirma después de revisar los datos. La operación recalcula precios y mueve el inventario en una transacción.
      </p>
      {runtime.mode === 'demo' && <p className="notice">La demostración no persiste solicitudes.</p>}
      {loading && <p role="status">Cargando solicitudes…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && runtime.mode === 'firebase' && orders.length === 0 && <p>No hay solicitudes todavía.</p>}
      <div className="order-list">
        {orders.map((order) => (
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
                  <p>Recojo en tienda</p>
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
        ))}
      </div>
    </>
  )
}
