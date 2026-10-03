import { Link } from 'react-router'
import type { CatalogProduct } from '../catalog.types'
import { useCatalog } from '../catalog.context'
import { formatMoney } from '../../../shared/utils/formatMoney'
import { ProductMedia } from './ProductMedia'

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { categories } = useCatalog()
  return (
    <article className="product-card">
      <Link to={`/productos/${product.slug}`} className="product-card-link">
        <div className="product-visual" style={{ backgroundColor: product.color }}>
          <ProductMedia product={product} />
          <span className="product-arrow" aria-hidden="true">↗</span>
        </div>
        <div className="product-card-copy">
          <div className="product-card-meta"><p className="product-category">{categories.find(c => c.id === product.categoryId)?.name}</p><span className={`availability-dot${product.availability === 'UNAVAILABLE' ? ' availability-dot-off' : ''}`}>{product.availability === 'UNAVAILABLE' ? 'Agotado' : 'Disponible'}</span></div>
          <div className="product-line"><h3>{product.name}</h3><span>{formatMoney(product.priceMinor)}</span></div>
        </div>
      </Link>
    </article>
  )
}
