import { BrowserRouter } from 'react-router'
import { AppRoutes } from './router'
import { runtime } from './services/runtime'
import { AuthProvider } from '../features/auth/AuthProvider'
import { CatalogProvider } from '../features/catalog/CatalogProvider'

export function App() {
  if (runtime.mode === 'invalid') return <section className="service-status" role="alert"><h1>Configuración pendiente</h1><p>{runtime.message}</p></section>
  return <AuthProvider><CatalogProvider><BrowserRouter><AppRoutes /></BrowserRouter></CatalogProvider></AuthProvider>
}
