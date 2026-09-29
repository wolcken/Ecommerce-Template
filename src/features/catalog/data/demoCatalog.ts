import type { CatalogProduct, Category } from '../catalog.types'

// Datos ficticios. Este archivo se sustituirá por un servicio de catálogo.
export const categories: readonly Category[] = [
  { id: 'tech', slug: 'tecnologia', name: 'Tecnología', description: 'Conecta con lo que disfrutas.' },
  { id: 'home', slug: 'hogar', name: 'Hogar', description: 'Pequeños detalles, grandes espacios.' },
  { id: 'life', slug: 'estilo-de-vida', name: 'Estilo de vida', description: 'Contigo, donde vayas.' },
]

export const products: readonly CatalogProduct[] = [
  { id: 'demo-01', slug: 'audifonos-studio', name: 'Audífonos Studio', categoryId: 'tech', description: 'Una pausa para escuchar lo que te mueve. Diseño envolvente y una silueta sencilla para acompañar tus momentos favoritos.', priceMinor: 45900, illustration: 'headphones', color: '#e9e8df' },
  { id: 'demo-02', slug: 'lampara-arco', name: 'Lámpara Arco', categoryId: 'home', description: 'Un punto de luz que transforma tu rincón favorito. Líneas suaves y una presencia discreta para tu escritorio o mesa de noche.', priceMinor: 28900, illustration: 'lamp', color: '#eee3d4' },
  { id: 'demo-03', slug: 'bolso-diario', name: 'Bolso Diario', categoryId: 'life', description: 'Lleva lo esencial y deja espacio para lo inesperado. Una forma atemporal pensada para el ritmo de cada día.', priceMinor: 17900, illustration: 'bag', color: '#e0e7df' },
]
