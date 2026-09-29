import { Link, useParams } from 'react-router'
import { useCatalog } from '../catalog.context'
import { ProductMedia } from '../components/ProductMedia'
import { formatMoney } from '../../../shared/utils/formatMoney'
import { NotFoundPage } from '../../../shared/components/NotFoundPage'

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
        <div className="product-visual detail-visual" style={{ backgroundColor: product.color }}><ProductMedia product={product} /></div>
        <div className="detail-copy">
          {category && <Link className="eyebrow" to={`/categorias/${category.slug}`}>{category.name}</Link>}
          <h1>{product.name}</h1><p className="detail-price">{formatMoney(product.priceMinor)}</p>
          <p>{product.description}</p>
          <div className="purchase-placeholder"><span className="badge">Vista del catálogo</span><p>Las compras y reservas aún no están disponibles.</p></div>
          <Link className="text-link" to="/productos">← Seguir explorando</Link>
        </div>
      </section>
    </div>
  )
}
