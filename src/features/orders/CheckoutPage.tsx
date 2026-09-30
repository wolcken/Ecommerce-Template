import { CheckoutEstimate } from './CheckoutEstimate'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useCart } from '../cart/cart.context'
import { useCatalog } from '../catalog/catalog.context'
import { useAuth } from '../auth/auth.context'
import { cartSummary } from '../cart/cart.logic'
import { validateCheckoutDetails, type CheckoutDetails } from './checkout.logic'
import { EmptyState } from '../../shared/components/EmptyState'
import { formatMoney } from '../../shared/utils/formatMoney'

export function CheckoutPage() {
  const cart=useCart()
  const {products,loading,error}=useCatalog()
  const {state}=useAuth()
  const [type,setType]=useState<'NIT'|'CI'>('NIT')
  const [details,setDetails]=useState<CheckoutDetails|null>(null)
  const [message,setMessage]=useState('')
  if(!cart.ready||loading) return <p className="service-status" role="status">Preparando el resumen…</p>
  if(error) return <EmptyState title="No pudimos consultar el catálogo." description="Tus productos siguen en el carrito. Recarga la página para reintentar." to="/carrito" action="Volver al carrito" />
  const summary=cartSummary(cart.items,products)
  if(!cart.items.length||summary.unavailable||summary.overflow) return <EmptyState title="Revisa tu carrito." description="Necesitas productos disponibles antes de preparar el pedido." to="/carrito" action="Ver carrito" />
  function review(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields=new FormData(event.currentTarget)
    try {
      setDetails(validateCheckoutDetails({
        customer:{firstName:String(fields.get('firstName')??''),lastName:String(fields.get('lastName')??''),phone:String(fields.get('phone')??'')},
        billing:{name:String(fields.get('billingName')??''),documentType:type,documentNumber:String(fields.get('documentNumber')??''),documentComplement:String(fields.get('complement')??'')},
      }))
      setMessage('Datos revisados. Todavía no se ha creado ningún pedido.')
    } catch(error) {setMessage(error instanceof Error?error.message:'Revisa los datos.')}
  }
  return <div className="container page-section">
    <p className="eyebrow">Borrador de compra</p><h1>Prepara tu pedido.</h1>
    <p className="page-intro">Puedes revisar tus datos y productos. La confirmación, entrega y pago aún no están habilitados.</p>
    <div className="cart-layout">
      <form className="checkout-form" onSubmit={review} onChange={()=>{setDetails(null);setMessage('')}}>
        <h2>Datos del comprador</h2>
        <label>Nombre<input name="firstName" required maxLength={120} autoComplete="given-name" /></label>
        <label>Apellidos<input name="lastName" required maxLength={120} autoComplete="family-name" /></label>
        <label>Teléfono<input name="phone" type="tel" required maxLength={30} autoComplete="tel" /></label>
        <h2>Datos de facturación</h2>
        <label>Nombre o razón social<input name="billingName" required maxLength={200} /></label>
        <label>Tipo de documento<select value={type} onChange={e=>setType(e.target.value as 'NIT'|'CI')}><option value="NIT">NIT</option><option value="CI">CI</option></select></label>
        <label>Número de documento<input name="documentNumber" required maxLength={40} /></label>
        {type==='CI'&&<label>Complemento (opcional)<input name="complement" maxLength={20} /></label>}
        <button className="button">Revisar datos</button>
        <p role="status">{message}</p>
        <p className="demo-caption">Estos datos no se guardan al salir ni se envían a la tienda en esta fase.</p>
      </form>
      <aside className="cart-summary">
        <h2>Resumen del borrador</h2><CheckoutEstimate />
        {cart.items.map(item=><p key={item.productId}>{products.find(p=>p.id===item.productId)?.name} × {item.quantity}</p>)}
        <div className="summary-total"><span>Referencia del carrito</span><strong>{formatMoney(summary.subtotalMinor)}</strong></div>
        {details&&<div className="billing-review"><h3>Facturar a</h3><p>{details.billing.name}</p><p>{details.billing.documentType}: {details.billing.documentNumber}{details.billing.documentComplement?' — '+details.billing.documentComplement:''}</p></div>}
        <p>El total final se volverá a validar al confirmar.</p>
        <button className="button" disabled>Confirmación próximamente</button>
        {state.status!=='AUTHENTICATED'&&<p>Necesitarás una cuenta para confirmar cuando las compras estén habilitadas. <Link className="text-link" to="/login">Mi cuenta</Link></p>}
        <Link className="text-link" to="/carrito">Volver al carrito</Link>
      </aside>
    </div>
  </div>
}
