import { AddToCart } from '../../cart/AddToCart'
import { Link, useParams } from 'react-router'
import { useCatalog } from '../catalog.context'
import { ProductMedia } from '../components/ProductMedia'
import { formatMoney } from '../../../shared/utils/formatMoney'
import { NotFoundPage } from '../../../shared/components/NotFoundPage'
import { Icon } from '../../../shared/components/Icon'

export function ProductPage() {
  const { categories, products } = useCatalog()
  const { slug } = useParams()
  const product = products.find(item => item.slug === slug)
  if (!product) return <NotFoundPage />
  const category = categories.find(item => item.id === product.categoryId)
  return (
    <div className="container page-section">
      <nav className="breadcrumbs" aria-label="Ruta de navegación"><Link to="/productos">Colección</Link><span aria-hidden="true">/</span><span>{product.name}</span></nav>
      <section className="product-detail">
        <div className="product-gallery">
          <div className="product-visual detail-visual" style={{ backgroundColor: product.color }}><ProductMedia product={product} /></div>
          <p><Icon name="shield" /> Imagen referencial del producto publicado.</p>
        </div>
        <div className="detail-copy">
          {category && <Link className="eyebrow" to={`/categorias/${category.slug}`}>{category.name}</Link>}
          <h1>{product.name}</h1>
          <div className="detail-price-block"><span>Precio final</span><p className="detail-price">{formatMoney(product.priceMinor)}</p><small>Incluye el recargo tributario configurado.</small></div>
          <p className="detail-description">{product.description}</p>
          <div className="detail-benefits" aria-label="Información del producto">
            <span><Icon name={product.availability === 'UNAVAILABLE' ? 'reserved' : 'available'} />{product.availability === 'UNAVAILABLE' ? 'Sin disponibilidad' : 'Disponible para solicitar'}</span>
            <span><Icon name="truck" />Recojo o envío</span>
            <span><Icon name="shield" />Precio validado al confirmar</span>
          </div>
          <AddToCart key={product.id} product={product} />
          <Link className="text-link icon-action" to="/productos"><Icon name="arrow-left" />Seguir explorando</Link>
        </div>
      </section>
    </div>
  )
}
