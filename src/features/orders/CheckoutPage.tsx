import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { EmptyState } from '../../shared/components/EmptyState'
import { formatMoney } from '../../shared/utils/formatMoney'
import { useAuth } from '../auth/auth.context'
import { useCart } from '../cart/cart.context'
import { cartSummary } from '../cart/cart.logic'
import { useCatalog } from '../catalog/catalog.context'
import { validateCheckoutDetails, type CheckoutDetails } from './checkout.logic'

export function CheckoutPage() {
  const cart = useCart()
  const { products, loading, error } = useCatalog()
  const { state } = useAuth()
  const navigate = useNavigate()
  const [type, setType] = useState<'NIT' | 'CI'>('NIT')
  const [kind, setKind] = useState<'ORDER' | 'RESERVATION'>('ORDER')
  const [delivery, setDelivery] = useState<'PICKUP' | 'SHIPPING'>('PICKUP')
  const [shipping, setShipping] = useState({ recipient: '', phone: '', city: '', line1: '', notes: '' })
  const [details, setDetails] = useState<CheckoutDetails | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  if (!cart.ready || loading) return <p className="service-status" role="status">Preparando el resumen…</p>
  if (error) {
    return (
      <EmptyState
        title="No pudimos consultar el catálogo."
        description="Tus productos siguen en el carrito. Recarga la página para reintentar."
        to="/carrito"
        action="Volver al carrito"
      />
    )
  }

  const summary = cartSummary(cart.items, products)
  if (!cart.items.length || summary.unavailable || summary.overflow) {
    return (
      <EmptyState
        title="Revisa tu carrito."
        description="Necesitas productos disponibles antes de preparar el pedido."
        to="/carrito"
        action="Ver carrito"
      />
    )
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    try {
      setDetails(
        validateCheckoutDetails({
          customer: {
            firstName: String(fields.get('firstName') ?? ''),
            lastName: String(fields.get('lastName') ?? ''),
            phone: String(fields.get('phone') ?? ''),
          },
          billing: {
            name: String(fields.get('billingName') ?? ''),
            documentType: type,
            documentNumber: String(fields.get('documentNumber') ?? ''),
            documentComplement: String(fields.get('complement') ?? ''),
          },
        }),
      )
      setMessage('Datos revisados. Ya puedes enviar la solicitud.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Revisa los datos.')
    }
  }

  async function send() {
    if (!details || state.status !== 'AUTHENTICATED' || runtime.mode !== 'firebase') return
    setSending(true)
    setMessage('')
    try {
      await runtime.orders.create({
        kind,
        items: cart.items,
        customer: details.customer,
        billing: details.billing,
        delivery:
          delivery === 'PICKUP'
            ? { method: 'PICKUP', locationId: 'main-store' }
            : { method: 'SHIPPING', address: shipping },
      })
      cart.clear()
      navigate('/mis-solicitudes')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container page-section">
      <p className="eyebrow">Solicitud sin pago</p>
      <h1>Prepara tu pedido.</h1>
      <p className="page-intro">La tienda revisará precio y existencias antes de confirmar manualmente.</p>
      <div className="cart-layout">
        <form
          className="checkout-form"
          onSubmit={review}
          onChange={() => {
            setDetails(null)
            setMessage('')
          }}
        >
          <h2>Datos del comprador</h2>
          <label>Nombre<input name="firstName" required maxLength={120} autoComplete="given-name" /></label>
          <label>Apellidos<input name="lastName" required maxLength={120} autoComplete="family-name" /></label>
          <label>Teléfono<input name="phone" type="tel" required maxLength={30} autoComplete="tel" /></label>
          <h2>Datos de facturación</h2>
          <label>Nombre o razón social<input name="billingName" required maxLength={200} /></label>
          <label>
            Tipo de documento
            <select value={type} onChange={(event) => setType(event.target.value as 'NIT' | 'CI')}>
              <option value="NIT">NIT</option>
              <option value="CI">CI</option>
            </select>
          </label>
          <label>Número de documento<input name="documentNumber" required maxLength={40} /></label>
          {type === 'CI' && <label>Complemento (opcional)<input name="complement" maxLength={20} /></label>}
          {delivery === 'SHIPPING' && (
            <>
              <h2>Dirección de envío</h2>
              <label>Persona que recibe<input required maxLength={120} value={shipping.recipient} onChange={(event) => setShipping({ ...shipping, recipient: event.target.value })} /></label>
              <label>Teléfono de envío<input required maxLength={30} value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} /></label>
              <label>Ciudad<input required maxLength={120} value={shipping.city} onChange={(event) => setShipping({ ...shipping, city: event.target.value })} /></label>
              <label>Dirección<input required maxLength={300} value={shipping.line1} onChange={(event) => setShipping({ ...shipping, line1: event.target.value })} /></label>
              <label>Referencias<input maxLength={500} value={shipping.notes} onChange={(event) => setShipping({ ...shipping, notes: event.target.value })} /></label>
            </>
          )}
          <button className="button">Revisar datos</button>
          <p role="status">{message}</p>
        </form>
        <aside className="cart-summary">
          <h2>Resumen de la solicitud</h2>
          <label>
            Tipo
            <select value={kind} onChange={(event) => setKind(event.target.value as 'ORDER' | 'RESERVATION')}>
              <option value="ORDER">Pedido</option>
              <option value="RESERVATION">Reserva de 24 horas</option>
            </select>
          </label>
          <label>
            Entrega
            <select value={delivery} onChange={(event) => { setDelivery(event.target.value as 'PICKUP' | 'SHIPPING'); setDetails(null) }}>
              <option value="PICKUP">Recojo en tienda</option>
              <option value="SHIPPING">Envío</option>
            </select>
          </label>
          <p>{kind === 'RESERVATION' ? 'Las 24 horas comienzan cuando el ADMIN confirma.' : 'El ADMIN confirmará disponibilidad y precio.'}</p>
          <p>{delivery === 'SHIPPING' ? 'El costo de envío se coordina al confirmar y por ahora figura en Bs 0.' : 'La ubicación de recojo se informará al confirmar.'}</p>
          {cart.items.map((item) => <p key={item.productId}>{products.find((product) => product.id === item.productId)?.name} × {item.quantity}</p>)}
          <div className="summary-total"><span>Referencia del carrito</span><strong>{formatMoney(summary.subtotalMinor)}</strong></div>
          {details && (
            <div className="billing-review">
              <h3>Facturar a</h3>
              <p>{details.billing.name}</p>
              <p>{details.billing.documentType}: {details.billing.documentNumber}{details.billing.documentComplement ? ' — ' + details.billing.documentComplement : ''}</p>
            </div>
          )}
          <p>El carrito no reserva stock. El total se fija al confirmar.</p>
          <button
            className="button"
            type="button"
            disabled={!details || sending || state.status !== 'AUTHENTICATED' || runtime.mode !== 'firebase'}
            onClick={() => void send()}
          >
            {sending ? 'Enviando…' : 'Enviar solicitud'}
          </button>
          {state.status !== 'AUTHENTICATED' && <p>Inicia sesión antes de enviar. <Link className="text-link" to="/login">Mi cuenta</Link></p>}
          {runtime.mode === 'demo' && <p>El modo demostración no guarda solicitudes.</p>}
          <Link className="text-link" to="/carrito">Volver al carrito</Link>
        </aside>
      </div>
    </div>
  )
}
