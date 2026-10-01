import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { EmptyState } from '../../shared/components/EmptyState'
import { formatMoney } from '../../shared/utils/formatMoney'
import { useAuth } from '../auth/auth.context'
import { orderStatusLabel } from './order.logic'
import type { CustomerOrder } from './order.models'

function date(value: string) {
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function OrderHistoryPage() {
  const { state } = useAuth()
  const uid = state.status === 'AUTHENTICATED' ? state.user.uid : null
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid || runtime.mode !== 'firebase') return
    let cancelled = false
    runtime.orders
      .listMine()
      .then((items) => {
        if (!cancelled) {
          setOrders(items)
          setError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) setError(error instanceof Error ? error.message : 'No se pudieron cargar tus solicitudes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  if (state.status === 'LOADING') return <p className="service-status">Verificando sesión…</p>
  if (state.status === 'ANONYMOUS') {
    return (
      <EmptyState
        eyebrow="Tus solicitudes"
        title="Inicia sesión para consultar tus pedidos."
        description="Aquí verás la revisión, confirmación y estado de cada solicitud."
        to="/login"
        action="Iniciar sesión"
      />
    )
  }
  if (runtime.mode !== 'firebase') {
    return (
      <EmptyState
        eyebrow="Demostración"
        title="Las solicitudes requieren Firebase."
        description="Cambia la fuente de datos a Firebase para probar este flujo."
        to="/productos"
        action="Ver productos"
      />
    )
  }

  return (
    <div className="container page-section">
      <p className="eyebrow">Mi cuenta</p>
      <h1>Mis solicitudes.</h1>
      <p className="page-intro">El precio y las existencias quedan fijados cuando la tienda confirma.</p>
      {loading && <p role="status">Cargando solicitudes…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <EmptyState
          title="Todavía no enviaste solicitudes."
          description="Agrega productos al carrito y prepara tu primer pedido o reserva."
          to="/productos"
          action="Explorar productos"
        />
      )}
      <div className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <header>
              <div>
                <span className="eyebrow">{order.kind === 'ORDER' ? 'Pedido' : 'Reserva'}</span>
                <h2>{order.number ?? 'Solicitud en revisión'}</h2>
              </div>
              <span className={`status-pill status-${order.status.toLowerCase()}`}>
                {orderStatusLabel(order.status)}
              </span>
            </header>
            <p>Enviada el {date(order.createdAt)}</p>
            <ul>
              {order.confirmedItems.length
                ? order.confirmedItems.map((item) => <li key={item.productId}>{item.name} × {item.quantity}</li>)
                : order.requestedItems.map((item) => <li key={item.productId}>{item.productId} × {item.quantity}</li>)}
            </ul>
            {order.totals && (
              <p className="order-total">
                Total confirmado: <strong>{formatMoney(order.totals.totalMinor)}</strong>
              </p>
            )}
            {order.reservedUntil && <p>Reserva válida hasta {date(order.reservedUntil)}.</p>}
            {order.adminNote && <p className="order-note">Nota de la tienda: {order.adminNote}</p>}
          </article>
        ))}
      </div>
      <Link className="text-link" to="/productos">Seguir comprando</Link>
    </div>
  )
}
