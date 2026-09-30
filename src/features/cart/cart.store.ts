import { changeQuantity, mergeCarts, readCart } from './cart.logic.ts'
import type { CartItem } from './cart.models'

export interface CartStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  persistent: boolean
}
export interface CartSnapshot { items: readonly CartItem[]; ready: boolean; warning: string | null }

export function createCartStore(storage: CartStorage, key: string, guestKey?: string) {
  let snapshot: CartSnapshot = {items:[],ready:false,warning:null}
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach(fn => fn())
  const write = (target: string, items: readonly CartItem[]) => storage.setItem(target,JSON.stringify({version:1,items}))
  function publish(items: readonly CartItem[]) {
    snapshot={items,ready:true,warning:storage.persistent?null:'No se pudo guardar el carrito en este navegador. Se conservará mientras esta página permanezca abierta.'}
    notify()
  }
  return {
    subscribe(listener: () => void) {listeners.add(listener);return () => {listeners.delete(listener)}},
    getSnapshot: () => snapshot,
    start() {
      let items=readCart(storage.getItem(key))
      if (guestKey) {
        const merged=mergeCarts(items,readCart(storage.getItem(guestKey)))
        items=merged.items
        write(key,items)
        write(guestKey,merged.remainingGuest)
      }
      publish(items)
    },
    refresh() {publish(readCart(storage.getItem(key)))},
    add(productId: string) {
      const current=readCart(storage.getItem(key))
      const items=changeQuantity(current,productId,(current.find(i=>i.productId===productId)?.quantity??0)+1)
      write(key,items);publish(items)
    },
    quantity(productId: string, quantity: number) {
      const items=changeQuantity(readCart(storage.getItem(key)),productId,quantity)
      write(key,items);publish(items)
    },
    remove(productId: string) {const items=readCart(storage.getItem(key)).filter(i=>i.productId!==productId);write(key,items);publish(items)},
    clear() {write(key,[]);publish([])},
  }
}

/** La memoria permite conservar cambios durante la sesión si storage está bloqueado. */
const memory = new Map<string,string>()
export function browserCartStorage(): CartStorage {
  const storage: CartStorage = {
    persistent:true,
    getItem(key) {
      if (storage.persistent) {
        try {const value=window.localStorage.getItem(key); if(value===null) memory.delete(key); else memory.set(key,value);return value}
        catch {storage.persistent=false}
      }
      return memory.get(key)??null
    },
    setItem(key,value) {
      memory.set(key,value)
      if (storage.persistent) {
        try {window.localStorage.setItem(key,value)}
        catch {storage.persistent=false}
      }
    },
  }
  return storage
}
