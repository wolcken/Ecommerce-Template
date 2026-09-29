import { Link } from 'react-router'
import { useCatalog } from '../catalog/catalog.context'
import { formatMoney } from '../../shared/utils/formatMoney'

export function AdminDashboard() {
  const { products, categories } = useCatalog()
  return <>
    <p className="eyebrow">Vista general</p><h1>Todo empieza por una buena base.</h1>
    <p className="page-intro">Explora la estructura de tu catálogo publicado.</p>
    <div className="stat-grid">
      <Link className="stat-card" to="/admin/productos"><span>Productos publicados</span><strong>{products.length}</strong><span>Ver productos ↗</span></Link>
      <Link className="stat-card" to="/admin/categorias"><span>Categorías publicados</span><strong>{categories.length}</strong><span>Ver categorías ↗</span></Link>
    </div>
    <section className="admin-next"><h2>Un lugar para gestionar tu tienda.</h2><p>La creación de productos, el inventario y la gestión de pedidos se habilitarán cuando estén definidos los permisos y el almacenamiento.</p></section>
  </>
}

export function AdminProducts() {
  const { products, categories } = useCatalog()
  return <>
    <p className="eyebrow">Catálogo</p><h1>Productos</h1><p className="page-intro">Vista de consulta de los productos publicados.</p>
    <div className="table-scroll" role="region" aria-label="Productos publicados" tabIndex={0}>
      <table><caption className="sr-only">Productos publicado</caption><thead><tr><th scope="col">Producto</th><th scope="col">Categoría</th><th scope="col">Precio de venta</th></tr></thead>
        <tbody>{products.map(product => <tr key={product.id}><th scope="row"><Link to={`/productos/${product.slug}`}>{product.name}</Link></th><td>{categories.find(c => c.id === product.categoryId)?.name}</td><td>{formatMoney(product.priceMinor)}</td></tr>)}</tbody>
      </table>
    </div>
  </>
}

export function AdminCategories() {
  const { categories } = useCatalog()
  return <>
    <p className="eyebrow">Catálogo</p><h1>Categorías</h1><p className="page-intro">Organiza la forma en que tus clientes descubren los productos.</p>
    <div className="admin-category-grid">{categories.map(category => <article className="admin-next" key={category.id}><h2>{category.name}</h2><p>{category.description}</p><Link className="text-link" to={`/categorias/${category.slug}`}>Ver en la tienda ↗</Link></article>)}</div>
  </>
}
