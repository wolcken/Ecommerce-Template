import { storeConfig } from '../../config/store.config'

const moneyFormatter = new Intl.NumberFormat(storeConfig.locale, {
  style: 'currency',
  currency: storeConfig.currency,
})

// Los importes del catálogo se expresan en unidades menores (centavos).
export function formatMoney(amountMinor: number) {
  return moneyFormatter.format(amountMinor / 100)
}
