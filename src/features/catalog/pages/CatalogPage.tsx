import { NavLink, useParams } from 'react-router'
import { useCatalog } from '../catalog.context'
import { ProductCard } from '../components/ProductCard'
import { NotFoundPage } from '../../../shared/components/NotFoundPage'

export function CatalogPage() {
  const { categories, products } = useCatalog()
  const { slug } = useParams()
  const category = categories.find(item => item.slug === slug)
  if (slug && !category) return <NotFoundPage />
  const visibleProducts = category ? products.filter(item => item.categoryId === category.id) : products
  return (
    <div className="container page-section">
      <p className="eyebrow">La colección</p>
      <h1>{category?.name ?? 'Encuentra tu esencial.'}</h1>
      <p className="page-intro">{category?.description ?? 'Objetos para disfrutar tu espacio y tu día a día.'}</p>
      <div className="catalog-toolbar">
        <nav className="category-tabs" aria-label="Filtrar por categoría">
          <NavLink to="/productos" end>Todo</NavLink>
          {categories.map(item => <NavLink key={item.id} to={`/categorias/${item.slug}`}>{item.name}</NavLink>)}
        </nav>
        <span>{visibleProducts.length} {visibleProducts.length === 1 ? 'producto' : 'productos'}</span>
      </div>
      <p role="status">{visibleProducts.length === 0 ? 'Todavía no hay productos publicados aquí.' : ''}</p><div className="product-grid">{visibleProducts.map(product => <ProductCard key={product.id} product={product} />)}</div>
      <p className="demo-caption">Los precios publicados incluyen el recargo tributario. La disponibilidad se valida al confirmar.</p>
    </div>
  )
}
