import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { storeConfig } from '../../config/store.config'
import { EmptyState } from '../../shared/components/EmptyState'
import { Icon, type IconName } from '../../shared/components/Icon'
import { formatMoney } from '../../shared/utils/formatMoney'
import { useAuth } from '../auth/auth.context'
import type { UserProfile } from '../auth/auth.models'
import { useCart } from '../cart/cart.context'
import { cartSummary } from '../cart/cart.logic'
import { useCatalog } from '../catalog/catalog.context'
import { validateCheckoutDetails, type CheckoutDetails } from './checkout.logic'
import { deliveryFeeMinor } from './delivery.logic'
import type { OrderKind, PaymentMethod } from './order.models'

const firstPickup = storeConfig.commerce.pickupLocations[0]
type DeliveryChoice = 'PICKUP' | 'NATIONAL' | 'INTERNATIONAL'

function Choice({
  checked,
  description,
  icon,
  label,
  name,
  onChange,
}: {
  checked: boolean
  description: string
  icon: IconName
  label: string
  name: string
  onChange: () => void
}) {
  return (
    <label className={`checkout-choice${checked ? ' checkout-choice-selected' : ''}`}>
      <input className="sr-only" type="radio" name={name} checked={checked} onChange={onChange} />
      <span className="checkout-choice-icon"><Icon name={icon} /></span>
      <span><strong>{label}</strong><small>{description}</small></span>
    </label>
  )
}

const paymentContent: Record<PaymentMethod, { label: string; description: string; icon: IconName }> = {
  QR: { label: 'QR', description: 'Escanea un código de demostración.', icon: 'qr' },
  CARD: { label: 'Tarjeta', description: 'Crédito o débito, sin ingresar datos reales.', icon: 'credit-card' },
  PAYPAL: { label: 'PayPal', description: 'Redirección simulada a una billetera.', icon: 'wallet' },
}

export function CheckoutPage() {
  const cart = useCart()
  const { products, loading, error } = useCatalog()
  const { state } = useAuth()
  const uid = state.status === 'AUTHENTICATED' ? state.user.uid : null
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileOwnerId, setProfileOwnerId] = useState<string | null>(null)
  const profileLoading = uid !== null && profileOwnerId !== uid
  const [type, setType] = useState<'NIT' | 'CI'>('NIT')
  const [kind, setKind] = useState<OrderKind>('ORDER')
  const [delivery, setDelivery] = useState<DeliveryChoice>(
    storeConfig.commerce.deliveryMethods.includes('pickup') ? 'PICKUP' : 'NATIONAL',
  )
  const [pickupId, setPickupId] = useState(firstPickup?.id ?? '')
  const [shipping, setShipping] = useState({ recipient: '', phone: '', country: 'Bolivia', city: '', line1: '', notes: '' })
  const [details, setDetails] = useState<CheckoutDetails | null>(null)
  const [paymentVisible, setPaymentVisible] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QR')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!uid || runtime.mode !== 'firebase') return
    let cancelled = false
    runtime.profile
      .getMine()
      .then((value) => {
        if (cancelled) return
        setProfile(value)
        setType(value?.billing?.documentType ?? 'NIT')
        setShipping((current) => ({
          ...current,
          recipient: value ? `${value.firstName} ${value.lastName}`.trim() : '',
          phone: value?.phone ?? '',
        }))
        setDetails(null)
        setPaymentVisible(false)
        setMessage('')
      })
      .catch((caught) => {
        if (!cancelled) {
          setProfile(null)
          setType('NIT')
          setShipping((current) => ({ ...current, recipient: '', phone: '' }))
          setMessage(caught instanceof Error ? caught.message : 'No se pudo cargar tu perfil.')
        }
      })
      .finally(() => {
        if (!cancelled) setProfileOwnerId(uid)
      })
    return () => { cancelled = true }
  }, [uid])

  if (!cart.ready || loading || (uid && profileLoading)) {
    return <p className="service-status" role="status">Preparando el resumen…</p>
  }
  if (error) {
    return <EmptyState title="No pudimos consultar el catálogo." description="Tus productos siguen en el carrito. Recarga la página para reintentar." to="/carrito" action="Volver al carrito" />
  }

  const summary = cartSummary(cart.items, products)
  if (!cart.items.length || summary.unavailable || summary.overflow) {
    return <EmptyState title="Revisa tu carrito." description="Necesitas productos disponibles antes de preparar el pedido." to="/carrito" action="Ver carrito" />
  }

  const shippingMinor = deliveryFeeMinor(delivery, storeConfig.commerce.shipping)
  const reportedTotalMinor = summary.subtotalMinor + shippingMinor

  function resetReview() {
    setDetails(null)
    setPaymentVisible(false)
    setMessage('')
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    try {
      setDetails(validateCheckoutDetails({
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
      }))
      setPaymentVisible(false)
      setMessage('Datos confirmados. Continúa con el modo de pago.')
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Revisa los datos.')
    }
  }

  function chooseDelivery(next: DeliveryChoice) {
    setDelivery(next)
    setShipping((current) => ({
      ...current,
      country: next === 'NATIONAL' ? 'Bolivia' : next === 'INTERNATIONAL' && current.country === 'Bolivia' ? '' : current.country,
    }))
    resetReview()
  }

  async function reportPayment() {
    if (!details || !paymentVisible || state.status !== 'AUTHENTICATED' || runtime.mode !== 'firebase') return
    setSending(true)
    setMessage('')
    try {
      await runtime.orders.create({
        kind,
        items: cart.items,
        customer: details.customer,
        billing: details.billing,
        delivery: delivery === 'PICKUP'
          ? { method: 'PICKUP', locationId: pickupId }
          : {
              method: 'SHIPPING',
              scope: delivery,
              address: shipping,
            },
        payment: { method: paymentMethod, reportedAmountMinor: reportedTotalMinor },
      })
      cart.clear()
      navigate('/mis-solicitudes')
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'No se pudo registrar el pago reportado.')
    } finally {
      setSending(false)
    }
  }

  const pickup = storeConfig.commerce.pickupLocations.find((location) => location.id === pickupId)

  return (
    <div className="container page-section">
      <p className="eyebrow">Compra protegida</p>
      <h1>Prepara tu pedido.</h1>
      <p className="page-intro">Revisa tus datos, elige la entrega y simula el modo de pago. La tienda validará el reporte antes de comprometer stock.</p>
      <div className="cart-layout checkout-layout">
        <form className="checkout-form" key={`${uid}:${profile?.version ?? 0}`} onSubmit={review} onChange={resetReview}>
          <h2>Datos del comprador</h2>
          <label>Nombre<input name="firstName" required maxLength={120} defaultValue={profile?.firstName ?? ''} autoComplete="given-name" /></label>
          <label>Apellidos<input name="lastName" required maxLength={120} defaultValue={profile?.lastName ?? ''} autoComplete="family-name" /></label>
          <label>Teléfono<input name="phone" type="tel" required maxLength={30} defaultValue={profile?.phone ?? ''} autoComplete="tel" /></label>
          <h2>Datos para el comprobante</h2>
          <label>Nombre o razón social<input name="billingName" required maxLength={200} defaultValue={profile?.billing?.name ?? ''} /></label>
          <label>
            Tipo de documento
            <select value={type} onChange={(event) => setType(event.target.value as 'NIT' | 'CI')}>
              <option value="NIT">NIT</option>
              <option value="CI">CI</option>
            </select>
          </label>
          <label>Número de documento<input name="documentNumber" required maxLength={40} defaultValue={profile?.billing?.documentNumber ?? ''} /></label>
          {type === 'CI' && <label>Complemento (opcional)<input name="complement" maxLength={20} defaultValue={profile?.billing?.documentComplement ?? ''} /></label>}
          {delivery !== 'PICKUP' && (
            <>
              <h2>Dirección de envío</h2>
              <label>Persona que recibe<input required maxLength={120} value={shipping.recipient} onChange={(event) => setShipping({ ...shipping, recipient: event.target.value })} /></label>
              <label>Teléfono de envío<input required maxLength={30} value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} /></label>
              {delivery === 'INTERNATIONAL' && <label>País<input required maxLength={120} value={shipping.country} onChange={(event) => setShipping({ ...shipping, country: event.target.value })} /></label>}
              <label>Ciudad<input required maxLength={120} value={shipping.city} onChange={(event) => setShipping({ ...shipping, city: event.target.value })} /></label>
              <label>Dirección<input required maxLength={300} value={shipping.line1} onChange={(event) => setShipping({ ...shipping, line1: event.target.value })} /></label>
              <label>Referencias<input maxLength={500} value={shipping.notes} onChange={(event) => setShipping({ ...shipping, notes: event.target.value })} /></label>
            </>
          )}
          <button className="button">Confirmar datos</button>
          <p role="status">{message}</p>
          {state.status === 'AUTHENTICATED' && !profile && <p className="demo-caption">Puedes guardar estos datos en <Link className="text-link" to="/cuenta">tu perfil</Link> para futuros pedidos.</p>}
        </form>

        <aside className="cart-summary checkout-summary">
          <h2>Resumen de la solicitud</h2>
          <fieldset className="checkout-choice-group">
            <legend>Tipo de solicitud</legend>
            <div className="checkout-choice-grid checkout-choice-grid-two">
              <Choice checked={kind === 'ORDER'} name="order-kind" icon="cart" label="Pedido" description="Compra para entrega." onChange={() => { setKind('ORDER'); setPaymentVisible(false) }} />
              <Choice checked={kind === 'RESERVATION'} name="order-kind" icon="reserved" label="Reserva" description={`Válida por ${storeConfig.commerce.reservationDurationHours} horas al confirmar.`} onChange={() => { setKind('RESERVATION'); setPaymentVisible(false) }} />
            </div>
          </fieldset>

          <fieldset className="checkout-choice-group">
            <legend>Entrega</legend>
            <div className="checkout-choice-grid">
              {storeConfig.commerce.deliveryMethods.includes('pickup') && <Choice checked={delivery === 'PICKUP'} name="delivery" icon="home" label="Recojo" description="Sin comisión." onChange={() => chooseDelivery('PICKUP')} />}
              {storeConfig.commerce.deliveryMethods.includes('shipping') && <Choice checked={delivery === 'NATIONAL'} name="delivery" icon="truck" label="Nacional" description={formatMoney(storeConfig.commerce.shipping.nationalRateMinor)} onChange={() => chooseDelivery('NATIONAL')} />}
              {storeConfig.commerce.deliveryMethods.includes('shipping') && <Choice checked={delivery === 'INTERNATIONAL'} name="delivery" icon="globe" label="Internacional" description={formatMoney(storeConfig.commerce.shipping.internationalRateMinor)} onChange={() => chooseDelivery('INTERNATIONAL')} />}
            </div>
          </fieldset>

          {delivery === 'PICKUP' && (
            <div className="checkout-pickup">
              <label>Punto de recojo<select value={pickupId} onChange={(event) => { setPickupId(event.target.value); resetReview() }}>{storeConfig.commerce.pickupLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
              {pickup && <p>{pickup.address}. {pickup.instructions}</p>}
            </div>
          )}

          {cart.items.map((item) => <p key={item.productId}>{products.find((product) => product.id === item.productId)?.name} × {item.quantity}</p>)}
          <div className="checkout-totals">
            <div><span>Productos</span><strong>{formatMoney(summary.subtotalMinor)}</strong></div>
            <div><span>Entrega</span><strong>{formatMoney(shippingMinor)}</strong></div>
            <div className="summary-total"><span>Total estimado</span><strong>{formatMoney(reportedTotalMinor)}</strong></div>
          </div>

          {details && (
            <div className="billing-review">
              <h3>Comprobante para</h3>
              <p>{details.billing.name}</p>
              <p>{details.billing.documentType}: {details.billing.documentNumber}{details.billing.documentComplement ? ' — ' + details.billing.documentComplement : ''}</p>
            </div>
          )}

          {!paymentVisible && (
            <button className="button" type="button" disabled={!details} onClick={() => setPaymentVisible(true)}>
              Elegir modo de pago <Icon name="arrow-right" />
            </button>
          )}

          {paymentVisible && details && (
            <section className="payment-stage" id="modos-de-pago" aria-labelledby="payment-title">
              <p className="eyebrow">Pago de demostración</p>
              <h3 id="payment-title">Modo de pago</h3>
              <div className="checkout-choice-grid payment-choice-grid">
                {storeConfig.commerce.payments.methods.map((method) => (
                  <Choice
                    checked={paymentMethod === method}
                    description={paymentContent[method].description}
                    icon={paymentContent[method].icon}
                    key={method}
                    label={paymentContent[method].label}
                    name="payment-method"
                    onChange={() => setPaymentMethod(method)}
                  />
                ))}
              </div>
              <div className="payment-simulation">
                {paymentMethod === 'QR' && <div className="demo-qr" aria-hidden="true"><span>QR</span></div>}
                <div>
                  <strong>{paymentContent[paymentMethod].label}</strong>
                  <p>{paymentMethod === 'QR' ? 'Código visual de prueba; no procesa una transferencia.' : paymentMethod === 'CARD' ? 'Autorización simulada; no ingreses números ni datos bancarios.' : 'Redirección simulada; no se abrirá un servicio externo.'}</p>
                  <p>Importe: {formatMoney(reportedTotalMinor)}</p>
                </div>
              </div>
              <button className="button" type="button" disabled={sending || state.status !== 'AUTHENTICATED' || runtime.mode !== 'firebase'} onClick={() => void reportPayment()}>
                {sending ? 'Registrando…' : 'Ya realicé el pago'}
              </button>
              <p className="demo-caption">Se registrará como pago reportado. La tienda validará el importe, el precio y el stock antes de confirmar.</p>
            </section>
          )}

          {state.status !== 'AUTHENTICATED' && <p>Inicia sesión antes de reportar el pago. <Link className="text-link" to="/login">Mi cuenta</Link></p>}
          {runtime.mode === 'demo' && <p>El modo demostración no guarda solicitudes.</p>}
          <Link className="text-link" to="/carrito">Volver al carrito</Link>
        </aside>
      </div>
    </div>
  )
}
