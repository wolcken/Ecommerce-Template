import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { storeConfig } from '../../config/store.config'
import type { StoreConfig } from '../../config/store.types'
import { useAuth } from '../../features/auth/auth.context'
import { SignOutButton } from '../../features/auth/SignOutButton'
import { useCart } from '../../features/cart/cart.context'
import { Brand } from '../../shared/components/Brand'
import { Icon } from '../../shared/components/Icon'
import { runtime } from '../services/runtime'

export function PublicLayout() {
  const cart = useCart()
  const { state } = useAuth()
  const quantity = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const config: StoreConfig = storeConfig
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!accountMenuOpen) return

    function closeOnPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setAccountMenuOpen(false)
      menuButtonRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnPointerDown)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <div className="announcement">Menos ruido. Más cosas que importan.</div>
      <header className="site-header container">
        <Brand />
        <nav className="main-nav" aria-label="Navegación principal">
          <NavLink className="nav-item" to="/" end><Icon name="home" />Inicio</NavLink>
          <NavLink className="nav-item" to="/productos"><Icon name="collection" />Colección</NavLink>
        </nav>
        <div className={`account-menu${accountMenuOpen ? ' account-menu-open' : ''}`} ref={accountMenuRef}>
          <button
            aria-controls="account-navigation"
            aria-expanded={accountMenuOpen}
            aria-label={accountMenuOpen ? 'Cerrar menú de cuenta' : 'Abrir menú de cuenta'}
            className="mobile-menu-button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            <Icon name={accountMenuOpen ? 'close' : 'menu'} />
            <span>Menú</span>
          </button>
          <nav className="account-nav" id="account-navigation" aria-label="Tu cuenta y carrito">
            {state.status === 'AUTHENTICATED' && <NavLink className="nav-item" onClick={() => setAccountMenuOpen(false)} to="/mis-solicitudes"><Icon name="orders" />Solicitudes</NavLink>}
            <NavLink className="nav-item" onClick={() => setAccountMenuOpen(false)} to={state.status === 'AUTHENTICATED' ? '/cuenta' : '/login'}><Icon name="user" />Mi cuenta</NavLink>
            <NavLink className="cart-link nav-item" onClick={() => setAccountMenuOpen(false)} to="/carrito"><Icon name="cart" />Carrito <span className="cart-count">{cart.ready ? quantity : '…'}</span></NavLink>
            <SignOutButton onSignedOut={() => setAccountMenuOpen(false)} />
          </nav>
        </div>
      </header>
      <main id="contenido" className="public-main" tabIndex={-1}><Outlet /></main>
      <footer className="site-footer">
        <div className="container footer-content">
          <div><Brand /><p>{config.description}</p></div>
          <nav aria-label="Enlaces del pie">
            <NavLink to="/productos">Ver colección</NavLink>
            <NavLink to="/carrito">Mi carrito</NavLink>
            {state.status === 'AUTHENTICATED' && <NavLink to="/mis-solicitudes">Mis solicitudes</NavLink>}
            {config.contact.email && <a href={`mailto:${config.contact.email}`}>{config.contact.email}</a>}
            {config.contact.phone && <a href={`tel:${config.contact.phone}`}>{config.contact.phone}</a>}
          </nav>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} {config.name}</span><span>{runtime.mode === 'demo' ? 'Catálogo de muestra' : 'Colección'}</span></div>
      </footer>
    </>
  )
}
