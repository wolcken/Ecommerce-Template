import { Link } from 'react-router'
import type { CatalogProduct } from '../catalog.types'
import { categories } from '../data/demoCatalog'
import { formatMoney } from '../../../shared/utils/formatMoney'
import { ProductArtwork } from './ProductArtwork'

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="product-card">
      <Link to={`/productos/${product.slug}`} className="product-card-link">
        <div className="product-visual" style={{ backgroundColor: product.color }}>
          <ProductArtwork kind={product.illustration} />
          <span className="product-arrow" aria-hidden="true">↗</span>
        </div>
        <p className="product-category">{categories.find(c => c.id === product.categoryId)?.name}</p>
        <div className="product-line"><h3>{product.name}</h3><span>{formatMoney(product.priceMinor)}</span></div>
      </Link>
    </article>
  )
}
