import { useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../shared/components/Icon'
import { useCart } from './cart.context'
import type { CatalogProduct } from '../catalog/catalog.types'

export function AddToCart({product}:{product:CatalogProduct}) {
  const cart=useCart()
  const [message,setMessage]=useState('')
  const unavailable=product.availability==='UNAVAILABLE'
  function add() {
    try {cart.add(product.id);setMessage('Producto agregado al carrito.')}
    catch(error) {setMessage(error instanceof Error?error.message:'No se pudo agregar.')}
  }
  return <div className="purchase-placeholder">
    <button className="button" disabled={!cart.ready||unavailable} onClick={add}><Icon name="cart" />{unavailable?'Sin disponibilidad':'Agregar al carrito'}</button>
    <p role="status">{message}</p>
    {message && <Link className="text-link icon-action" to="/carrito">Ver carrito <Icon name="arrow-right" /></Link>}
    <p>Agregar al carrito no reserva existencias. Los pedidos aún no se pueden confirmar.</p>
  </div>
}
