import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../shared/components/EmptyState'
import { Icon } from '../../shared/components/Icon'
import { formatMoney } from '../../shared/utils/formatMoney'
import { useCatalog } from '../catalog/catalog.context'
import { ProductMedia } from '../catalog/components/ProductMedia'
import { useCart } from './cart.context'
import { cartSummary, MAX_QUANTITY } from './cart.logic'

export function CartPage() {
  const cart = useCart()
  const { products, loading, error } = useCatalog()
  const [message, setMessage] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  if (!cart.ready) return <p className="service-status" role="status">Preparando tu carrito…</p>
  if (cart.items.length === 0) {
    return <EmptyState eyebrow="Tu carrito" title="Aquí empieza tu próxima elección." description="Explora la colección y agrega los productos que quieras comparar o comprar." action="Seguir explorando" />
  }

  const summary = cartSummary(cart.items, products)
  const canContinue = !loading && !error && !summary.unavailable && !summary.overflow

  function quantity(id: string, value: number) {
    try {
      cart.quantity(id, value)
      setMessage('Cantidad actualizada.')
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'No se pudo actualizar.')
    }
  }

  function remove(productId: string, name: string) {
    cart.remove(productId)
    setMessage(`${name} se eliminó del carrito.`)
  }

  return <div className="container page-section cart-page">
    <header className="cart-page-heading">
      <div>
        <p className="eyebrow">Tu selección</p>
        <h1>Mi carrito</h1>
        <p className="page-intro">Guardado en este navegador. Los precios y la disponibilidad se revisarán antes de confirmar.</p>
      </div>
      <Link className="button button-secondary" to="/productos"><Icon name="arrow-left" />Seguir explorando</Link>
    </header>

    {cart.warning && <p className="notice" role="alert">{cart.warning}</p>}
    {loading && <p role="status">Actualizando precios…</p>}
    {error && <p role="alert">No pudimos consultar el catálogo. Tu carrito se conserva; recarga para reintentar.</p>}

    <div className="cart-layout">
      <section className="cart-products" aria-labelledby="cart-products-title">
        <div className="cart-products-heading">
          <h2 id="cart-products-title">Productos</h2>
          <span>{summary.quantity} {summary.quantity === 1 ? 'unidad' : 'unidades'}</span>
        </div>

        {cart.items.map((item) => {
          const product = products.find((entry) => entry.id === item.productId)
          const available = product && product.availability !== 'UNAVAILABLE'
          const productName = product?.name ?? 'Producto'
          return <article className="cart-row" key={item.productId}>
            <Link className="cart-art" to={product ? `/productos/${product.slug}` : '/productos'} aria-label={`Ver ${productName}`}>
              {product && <ProductMedia product={product} />}
            </Link>
            <div className="cart-description">
              <div className="cart-product-heading">
                <div>
                  <h3>{product ? <Link to={`/productos/${product.slug}`}>{product.name}</Link> : loading || error ? 'Producto guardado' : 'Producto no disponible'}</h3>
                  {product && <p>{formatMoney(product.priceMinor)} por unidad</p>}
                </div>
                <button className="cart-remove-button" type="button" onClick={() => remove(item.productId, productName)} aria-label={`Eliminar ${productName} del carrito`}>
                  <Icon name="trash" /><span>Eliminar</span>
                </button>
              </div>
              {!loading && !error && !available && <p className="cart-unavailable">Retira este producto para continuar.</p>}
              <div className="cart-line-footer">
                <div className="quantity-control" aria-label={`Cantidad de ${productName}`}>
                  <button type="button" aria-label={`Reducir cantidad de ${productName}`} disabled={item.quantity === 1} onClick={() => quantity(item.productId, item.quantity - 1)}>−</button>
                  <output aria-label="Cantidad">{item.quantity}</output>
                  <button type="button" aria-label={`Aumentar cantidad de ${productName}`} disabled={item.quantity === MAX_QUANTITY} onClick={() => quantity(item.productId, item.quantity + 1)}>+</button>
                </div>
                {product && <div className="cart-line-total"><span>Total del producto</span><strong>{formatMoney(product.priceMinor * item.quantity)}</strong></div>}
              </div>
            </div>
          </article>
        })}

        {message && <p className="cart-status" role="status"><Icon name="available" />{message}</p>}

        {!confirmClear ? (
          <div className="cart-list-actions">
            <Link className="button button-secondary" to="/productos"><Icon name="arrow-left" />Seguir explorando</Link>
            <button className="cart-clear-trigger" type="button" onClick={() => setConfirmClear(true)}><Icon name="trash" />Vaciar carrito</button>
          </div>
        ) : (
          <div className="clear-cart" role="alert">
            <div className="clear-cart-copy">
              <span className="clear-cart-icon"><Icon name="trash" /></span>
              <div><strong>¿Vaciar todo el carrito?</strong><p>Se eliminarán los {summary.quantity} productos seleccionados.</p></div>
            </div>
            <div className="clear-cart-actions">
              <button className="button button-danger" type="button" onClick={() => cart.clear()}><Icon name="trash" />Sí, vaciar carrito</button>
              <button className="button button-secondary" type="button" onClick={() => setConfirmClear(false)}>Conservar productos</button>
            </div>
          </div>
        )}
      </section>

      <aside className="cart-summary">
        <span className="eyebrow">Resumen</span>
        <h2>Tu pedido</h2>
        <div className="cart-summary-row"><span>Productos</span><strong>{summary.quantity}</strong></div>
        <div className="summary-total"><span>Subtotal estimado</span><strong>{loading || error || summary.overflow ? '—' : formatMoney(summary.subtotalMinor)}</strong></div>
        <p>La entrega se define en el siguiente paso. El precio unitario ya incluye el recargo tributario.</p>
        {summary.overflow && <p role="alert">No se puede calcular este importe. Revisa las cantidades.</p>}
        {canContinue ? <Link className="button" to="/checkout">Preparar pedido <Icon name="arrow-right" /></Link> : <p className="cart-review-note">Revisa los productos del carrito antes de continuar.</p>}
        <Link className="cart-summary-explore" to="/productos"><Icon name="collection" />Volver a la colección</Link>
      </aside>
    </div>
  </div>
}
