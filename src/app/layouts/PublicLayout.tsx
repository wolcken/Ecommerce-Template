import { NavLink, Outlet } from 'react-router'
import { Brand } from '../../shared/components/Brand'
import { storeConfig } from '../../config/store.config'
import type { StoreConfig } from '../../config/store.types'

export function PublicLayout() {
  const config: StoreConfig = storeConfig
  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <div className="announcement">Menos ruido. Más cosas que importan.</div>
      <header className="site-header container">
        <Brand />
        <nav className="main-nav" aria-label="Navegación principal">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/productos">Colección</NavLink>
        </nav>
        <nav className="account-nav" aria-label="Tu cuenta y carrito">
          <NavLink to="/login">Mi cuenta</NavLink>
          <NavLink className="cart-link" to="/carrito">Carrito <span>0</span></NavLink>
        </nav>
      </header>
      <main id="contenido" className="public-main" tabIndex={-1}><Outlet /></main>
      <footer className="site-footer">
        <div className="container footer-content">
          <div><Brand /><p>{config.description}</p></div>
          <nav aria-label="Enlaces del pie">
            <NavLink to="/productos">Ver colección</NavLink>
            <NavLink to="/carrito">Mi carrito</NavLink>
            {config.contact.email && <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a>}
            {config.contact.phone && <a href={`tel:${config.contact.phone}`}>{config.contact.phone}</a>}
          </nav>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} {config.name}</span><span>Catálogo de muestra</span></div>
      </footer>
    </>
  )
}
