import { useState } from 'react'
import type { CatalogProduct } from '../catalog.types'
import { Icon } from '../../../shared/components/Icon'
import { ProductArtwork } from './ProductArtwork'

export function ProductMedia({ product }: { product: CatalogProduct }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const image = product.images?.[0]
  if (image && failedUrl !== image.url) return <img className="product-photo" src={image.url} alt={image.alt || product.name} loading="lazy" onError={() => setFailedUrl(image.url)} />
  if (product.illustration) return <ProductArtwork kind={product.illustration} />
  return (
    <span className="image-placeholder" role="img" aria-label={`Imagen no disponible para ${product.name}`}>
      <span className="image-placeholder-icon"><Icon name="products" /></span>
      <strong>{image ? 'No pudimos cargar la imagen' : 'Imagen en preparación'}</strong>
      <small>El producto sigue disponible para consultar.</small>
    </span>
  )
}
