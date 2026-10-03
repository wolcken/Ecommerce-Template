import { useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../shared/components/Icon'
import type { CatalogProduct } from '../catalog/catalog.types'
import { useCart } from './cart.context'

type Feedback = { kind: 'success' | 'error'; text: string }

export function AddToCart({ product }: { product: CatalogProduct }) {
  const cart = useCart()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const unavailable = product.availability === 'UNAVAILABLE'

  function add() {
    try {
      cart.add(product.id)
      setFeedback({ kind: 'success', text: 'Producto agregado al carrito.' })
    } catch (caught) {
      setFeedback({ kind: 'error', text: caught instanceof Error ? caught.message : 'No se pudo agregar.' })
    }
  }

  return <div className="purchase-placeholder">
    <button className="button" disabled={!cart.ready || unavailable} onClick={add}><Icon name="cart" />{unavailable ? 'Sin disponibilidad' : 'Agregar al carrito'}</button>
    {feedback && <div className={`add-to-cart-feedback feedback-${feedback.kind}`}>
      <p role="status"><Icon name={feedback.kind === 'success' ? 'available' : 'close'} />{feedback.text}</p>
      {feedback.kind === 'success' && <Link className="button button-secondary" to="/carrito">Ver carrito <Icon name="arrow-right" /></Link>}
    </div>}
    <p>Agregar al carrito no reserva existencias. El precio y el stock se validan al confirmar.</p>
  </div>
}
