import { Link } from 'react-router'
import { storeConfig } from '../../../config/store.config'
import { categories, products } from '../data/demoCatalog'
import { ProductCard } from '../components/ProductCard'
import { ProductArtwork } from '../components/ProductArtwork'

export function HomePage() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Una forma más simple de elegir</p>
          <h1>Lo esencial.<br /><em>Todos los días.</em></h1>
          <p>{storeConfig.description}</p>
          <Link className="button" to="/productos">Explorar la colección <span aria-hidden="true">↗</span></Link>
          <span className="hero-note">Tecnología, hogar y un poco de inspiración.</span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-orbit" />
          <div className="hero-art-label">EL ARTE DE<br />LO COTIDIANO</div>
          <ProductArtwork kind="lamp" />
          <div className="hero-art-foot"><span>Formas simples.<br />Espacios con carácter.</span><span>01 / 03</span></div>
        </div>
      </section>
      <section className="category-strip" aria-label="Explorar por categoría">
        {categories.map((category, index) => <Link key={category.id} to={`/categorias/${category.slug}`}>
          <span className="category-number">0{index + 1}</span><span><strong>{category.name}</strong><small>{category.description}</small></span><span aria-hidden="true">↗</span>
        </Link>)}
      </section>
      <section className="collection-section">
        <div className="section-heading"><div><p className="eyebrow">Descubre tu próximo favorito</p><h2>Una selección con intención.</h2></div><Link className="text-link" to="/productos">Ver todo <span aria-hidden="true">↗</span></Link></div>
        <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
      </section>
      <section className="brand-note"><p className="eyebrow">Nuestra idea es sencilla</p><h2>Elegir bien empieza<br />por hacerlo simple.</h2><p>Explora a tu ritmo. Encuentra lo que va contigo.</p></section>
    </div>
  )
}
