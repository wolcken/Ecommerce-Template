import { createContext, useContext } from 'react'
import type { CatalogProduct, Category } from './catalog.types'
export interface CatalogState { products: readonly CatalogProduct[]; categories: readonly Category[]; loading: boolean; error: string | null }
export const CatalogContext = createContext<CatalogState>({ products: [], categories: [], loading: true, error: null })
export function useCatalog() { return useContext(CatalogContext) }
