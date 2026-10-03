import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../shared/components/EmptyState'
import { Icon } from '../../shared/components/Icon'
import { formatMoney } from '../../shared/utils/formatMoney'
import { useCatalog } from '../catalog/catalog.context'
import { useCart } from './cart.context'
import { cartSummary, MAX_QUANTITY } from './cart.logic'
import { ProductMedia } from '../catalog/components/ProductMedia'

export function CartPage() {
  const cart=useCart()
  const {products,loading,error}=useCatalog()
  const [message,setMessage]=useState('')
  const [confirmClear,setConfirmClear]=useState(false)
  if(!cart.ready) return <p className="service-status" role="status">Preparando tu carrito…</p>
  if(cart.items.length===0) return <EmptyState eyebrow="Tu carrito" title="Aquí empieza tu próxima elección." description="Explora la colección y agrega tus productos favoritos." />
  const summary=cartSummary(cart.items,products)
  const canContinue=!loading&&!error&&!summary.unavailable&&!summary.overflow
  function quantity(id:string,value:number) {
    try {cart.quantity(id,value);setMessage('Cantidad actualizada.')}
    catch(error) {setMessage(error instanceof Error?error.message:'No se pudo actualizar.')}
  }
  return <div className="container page-section">
    <p className="eyebrow">Tu selección</p><h1>Mi carrito</h1>
    <p className="page-intro">Guardado en este navegador. Los precios y la disponibilidad se revisarán antes de confirmar.</p>
    {cart.warning && <p className="notice" role="alert">{cart.warning}</p>}
    {loading && <p role="status">Actualizando precios…</p>}
    {error && <p role="alert">No pudimos consultar el catálogo. Tu carrito se conserva; recarga para reintentar.</p>}
    <div className="cart-layout">
      <div>
        {cart.items.map(item=>{
          const product=products.find(p=>p.id===item.productId)
          const available=product&&product.availability!=='UNAVAILABLE'
          return <article className="cart-row" key={item.productId}>
            <div className="cart-art">{product&&<ProductMedia product={product} />}</div>
            <div className="cart-description">
              <h2>{product?<Link to={'/productos/'+product.slug}>{product.name}</Link>:loading||error?'Producto guardado':'Producto no disponible'}</h2>
              {product && <p>{formatMoney(product.priceMinor)} por unidad</p>}
              {!loading&&!error&&!available && <p className="cart-unavailable">Retira este producto para continuar.</p>}
              <div className="quantity-control" aria-label={'Cantidad de '+(product?.name??'producto guardado')}>
                <button aria-label={'Reducir cantidad de '+(product?.name??'producto guardado')} disabled={item.quantity===1} onClick={()=>quantity(item.productId,item.quantity-1)}>−</button>
                <output aria-label="Cantidad">{item.quantity}</output>
                <button aria-label={'Aumentar cantidad de '+(product?.name??'producto guardado')} disabled={item.quantity===MAX_QUANTITY} onClick={()=>quantity(item.productId,item.quantity+1)}>+</button>
              </div>
              <button className="text-button icon-action" onClick={()=>{cart.remove(item.productId);setMessage('Producto retirado.')}}><Icon name="trash" />Eliminar {product?.name??'producto'}</button>
            </div>
          </article>
        })}
        <p role="status">{message}</p>
        {!confirmClear?<button className="text-button icon-action" onClick={()=>setConfirmClear(true)}><Icon name="trash" />Vaciar carrito</button>:<div className="clear-cart"><p>¿Retirar todos los productos?</p><button onClick={()=>cart.clear()}>Sí, vaciar</button><button onClick={()=>setConfirmClear(false)}>Conservar carrito</button></div>}
      </div>
      <aside className="cart-summary">
        <h2>Tu resumen</h2><p>{summary.quantity} unidades</p>
        <div className="summary-total"><span>Subtotal estimado</span><strong>{loading||error||summary.overflow?'—':formatMoney(summary.subtotalMinor)}</strong></div>
        <p>Entrega pendiente de definir. El precio unitario ya incluye el recargo tributario.</p>
        {summary.overflow&&<p role="alert">No se puede calcular este importe. Revisa las cantidades.</p>}
        {canContinue?<Link className="button" to="/checkout">Preparar pedido <Icon name="arrow-right" /></Link>:<p>Revisa los productos del carrito antes de continuar.</p>}
        <Link className="text-link" to="/productos">Seguir explorando</Link>
      </aside>
    </div>
  </div>
}
