import { useState } from 'react'
import type { CatalogProduct } from '../catalog.types'
import { ProductArtwork } from './ProductArtwork'

export function ProductMedia({ product }: { product: CatalogProduct }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const image = product.images?.[0]
  if (image && failedUrl !== image.url) return <img className="product-photo" src={image.url} alt={image.alt || product.name} loading="lazy" onError={() => setFailedUrl(image.url)} />
  if (product.illustration) return <ProductArtwork kind={product.illustration} />
  return <span className="image-placeholder">Imagen no disponible</span>
}
