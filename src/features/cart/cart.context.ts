import { createContext, useContext } from 'react'
import type { CartSnapshot } from './cart.store'
export interface CartContextValue extends CartSnapshot {
  add(productId:string):void
  quantity(productId:string,quantity:number):void
  remove(productId:string):void
  clear():void
}
export const CartContext=createContext<CartContextValue|null>(null)
export function useCart() {
  const value=useContext(CartContext)
  if(!value) throw new Error('CartProvider no disponible')
  return value
}
