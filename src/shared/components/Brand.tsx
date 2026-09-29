import { Link } from 'react-router'
import { storeConfig } from '../../config/store.config'
import type { StoreConfig } from '../../config/store.types'

export function Brand() {
  const config: StoreConfig = storeConfig
  return (
    <Link className="brand" to="/" aria-label={`${config.name}, inicio`}>
      {config.logoUrl
        ? <img className="brand-logo" src={config.logoUrl} alt="" />
        : <span className="brand-mark" aria-hidden="true">{config.monogram}</span>}
      <span>{config.name}<small>{config.tagline}</small></span>
    </Link>
  )
}
