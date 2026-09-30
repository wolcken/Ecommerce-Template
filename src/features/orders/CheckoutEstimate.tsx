import { useState } from 'react'
import { Link } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { useAuth } from '../auth/auth.context'
import { useCart } from '../cart/cart.context'
import { formatMoney } from '../../shared/utils/formatMoney'
import type { CheckoutPreview, PreviewInput } from './preview.models'

export function CheckoutEstimate() {
  const {items} = useCart()
  const {state} = useAuth()
  const [kind, setKind] = useState<PreviewInput['kind']>('ORDER')
  const [deliveryMethod, setDeliveryMethod] = useState<PreviewInput['deliveryMethod']>('PICKUP')
  const input = {items, kind, deliveryMethod}
  const signature = JSON.stringify(input)
  return <section className="checkout-form">
    <h2>Modalidad y entrega</h2>
    <label>Tipo de solicitud<select value={kind} onChange={event => setKind(event.target.value as PreviewInput['kind'])}>
      <option value="ORDER">Pedido</option><option value="RESERVATION">Reserva de 24 horas</option>
    </select></label>
    <label>Entrega simulada<select value={deliveryMethod} onChange={event => setDeliveryMethod(event.target.value as PreviewInput['deliveryMethod'])}>
      <option value="PICKUP">Recojo en tienda</option><option value="SHIPPING">Envío</option>
    </select></label>
    <p>La entrega se simula con costo cero. No representa una tarifa real. Las reservas durarán 24 horas desde su futura confirmación.</p>
    {runtime.mode === 'firebase' && state.status === 'AUTHENTICATED'
      ? <EstimateResult key={signature} input={input} />
      : <p>Inicia sesión en el entorno Firebase para consultar precios y existencias en el servidor. <Link className="text-link" to="/login">Mi cuenta</Link></p>}
  </section>
}

function EstimateResult({input}: {input: PreviewInput}) {
  const [preview, setPreview] = useState<CheckoutPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function check() {
    if (runtime.mode !== 'firebase' || busy) return
    setBusy(true)
    setError('')
    setPreview(null)
    try { setPreview(await runtime.checkout.preview(input)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cotizar.') }
    finally { setBusy(false) }
  }
  return <div>
    <button type="button" className="button" disabled={busy} onClick={() => void check()}>{busy ? 'Consultando…' : 'Cotizar en el servidor'}</button>
    {error && <p role="alert">{error}</p>}
    {preview && <div role="status">
      <h3>Cotización de prueba</h3>
      {preview.items.map(item => <p key={item.productId}>{item.name} × {item.quantity}: {formatMoney(item.lineTotalMinor)}</p>)}
      <p>Entrega simulada: {formatMoney(preview.shippingMinor)}</p>
      <p><strong>Total simulado: {formatMoney(preview.totalMinor)}</strong></p>
      <p>Disponibilidad comprobada al cotizar. Los precios y existencias pueden cambiar. Todavía no se creó un pedido ni se reservó stock.</p>
    </div>}
  </div>
}
