import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { storeConfig } from '../../config/store.config'
import { EmptyState } from '../../shared/components/EmptyState'
import { Icon } from '../../shared/components/Icon'
import { formatMoney } from '../../shared/utils/formatMoney'
import { useAuth } from '../auth/auth.context'
import { canGenerateInvoice } from './invoice.logic'
import type { CustomerOrder } from './order.models'

function date(value: string) {
  return new Intl.DateTimeFormat(storeConfig.locale, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

function delivery(order: CustomerOrder) {
  if (order.delivery.method === 'PICKUP') {
    const locationId = order.delivery.locationId
    const location = storeConfig.commerce.pickupLocations.find((item) => item.id === locationId)
    return location ? `Recojo en ${location.name}: ${location.address}` : 'Recojo en tienda'
  }
  return `${order.delivery.address.line1}, ${order.delivery.address.city}`
}

export function InvoicePage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const { state, error: authError } = useAuth()
  const uid = state.status === 'AUTHENTICATED' ? state.user.uid : null
  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [loadedOwnerId, setLoadedOwnerId] = useState<string | null>(null)
  const [loadedOrderId, setLoadedOrderId] = useState('')
  const [error, setError] = useState('')
  const loading = uid !== null && (loadedOwnerId !== uid || loadedOrderId !== orderId)

  useEffect(() => {
    if (!uid || !orderId || runtime.mode !== 'firebase') return
    let cancelled = false
    runtime.orders.listMine()
      .then((orders) => {
        if (!cancelled) {
          setOrder(orders.find((item) => item.id === orderId) ?? null)
          setError('')
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setOrder(null)
          setError(caught instanceof Error ? caught.message : 'No se pudo preparar la factura simulada.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadedOwnerId(uid)
          setLoadedOrderId(orderId)
        }
      })
    return () => { cancelled = true }
  }, [orderId, uid])

  if (authError) return <EmptyState title="No se pudo verificar tu sesión." description={authError} />
  if (state.status === 'LOADING') return <p className="service-status">Verificando sesión…</p>
  if (state.status === 'ANONYMOUS') {
    return <EmptyState title="Inicia sesión para ver esta factura." description="El comprobante solo está disponible para quien realizó la compra." to="/login" action="Iniciar sesión" />
  }
  if (runtime.mode !== 'firebase') {
    return <EmptyState title="La factura simulada requiere Firebase." description="Activa Firebase para consultar una compra completada." to="/productos" action="Ver productos" />
  }
  if (loading) return <p className="service-status">Preparando factura simulada…</p>
  if (error) return <EmptyState title="No se pudo preparar la factura." description={error} to="/mis-solicitudes" action="Volver a mis solicitudes" />
  if (!order) return <EmptyState title="No encontramos esta solicitud." description="Comprueba que pertenezca a tu cuenta." to="/mis-solicitudes" action="Volver a mis solicitudes" />
  if (!canGenerateInvoice(order) || !order.totals) {
    return <EmptyState title="La factura todavía no está disponible." description="Se habilita cuando la tienda marca la solicitud como completada." to="/mis-solicitudes" action="Ver estado de la solicitud" />
  }

  const company = storeConfig.company
  const invoiceNumber = `SIM-${order.number}`

  return (
    <div className="container page-section invoice-page">
      <div className="invoice-actions">
        <Link className="text-link icon-action" to="/mis-solicitudes"><Icon name="arrow-left" />Mis solicitudes</Link>
        <button className="button" type="button" onClick={() => window.print()}><Icon name="printer" />Imprimir o guardar PDF</button>
      </div>
      <article className="invoice-sheet" aria-labelledby="invoice-title">
        <header className="invoice-header">
          <div>
            <p className="eyebrow">Comprobante de venta</p>
            <h1 id="invoice-title">Factura simulada</h1>
            <p className="invoice-disclaimer">Documento de demostración sin validez fiscal ni derecho a crédito fiscal.</p>
          </div>
          <dl className="invoice-meta">
            <div><dt>Número</dt><dd>{invoiceNumber}</dd></div>
            <div><dt>Pedido</dt><dd>{order.number}</dd></div>
            <div><dt>Fecha</dt><dd>{date(order.updatedAt)}</dd></div>
          </dl>
        </header>

        <div className="invoice-parties">
          <section>
            <h2>Empresa</h2>
            <p><strong>{company.legalName}</strong></p>
            <p>NIT: {company.taxId}</p>
            <p>{company.activity}</p>
            <p>{company.address}, {company.city}</p>
            {storeConfig.contact.email && <p>{storeConfig.contact.email}</p>}
            {storeConfig.contact.phone && <p>{storeConfig.contact.phone}</p>}
          </section>
          <section>
            <h2>Cliente</h2>
            <p><strong>{order.billing.name}</strong></p>
            <p>{order.billing.documentType}: {order.billing.documentNumber}{order.billing.documentComplement ? `-${order.billing.documentComplement}` : ''}</p>
            <p>Comprador: {order.customer.firstName} {order.customer.lastName}</p>
            <p>Teléfono: {order.customer.phone}</p>
            <p>Entrega: {delivery(order)}</p>
          </section>
        </div>

        <div className="table-scroll invoice-table">
          <table>
            <thead><tr><th>Producto</th><th>SKU</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead>
            <tbody>
              {order.confirmedItems.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name}</td><td>{item.sku}</td><td>{item.quantity}</td>
                  <td>{formatMoney(item.unitPriceMinor)}</td><td>{formatMoney(item.lineTotalMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-total-panel">
          <div><span>Productos</span><strong>{formatMoney(order.totals.itemsMinor)}</strong></div>
          <div><span>Envío</span><strong>{formatMoney(order.totals.shippingMinor)}</strong></div>
          <div className="invoice-grand-total"><span>Total de la compra</span><strong>{formatMoney(order.totals.totalMinor)}</strong></div>
        </div>
        <p className="invoice-footnote">Los importes corresponden al precio confirmado y ya incluyen el recargo de facturación configurado para cada producto.</p>
      </article>
    </div>
  )
}
