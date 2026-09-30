import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { useAuth } from '../auth/auth.context'
import { CartContext } from './cart.context'
import { browserCartStorage, createCartStore } from './cart.store'

const storage=browserCartStorage()
const namespace=['ecommerce-base','cart','v1',import.meta.env.VITE_DATA_SOURCE??'demo',import.meta.env.VITE_USE_FIREBASE_EMULATORS==='true'?'emulator':'live',import.meta.env.VITE_FIREBASE_PROJECT_ID??'demo'].join(':')
const guestKey=namespace+':guest'
const waiting={items:[],ready:false,warning:null,add:()=>{},quantity:()=>{},remove:()=>{},clear:()=>{}}

function CartSession({ identity, children }: { identity:string; children:ReactNode }) {
  const key=namespace+':'+encodeURIComponent(identity)
  const store=useMemo(()=>createCartStore(storage,key,identity==='guest'?undefined:guestKey),[key,identity])
  const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot)
  useEffect(()=>{
    store.start()
    const listener=(event:StorageEvent)=>{if(event.key===key || event.key===null) store.refresh()}
    window.addEventListener('storage',listener)
    return ()=>window.removeEventListener('storage',listener)
  },[store,key])
  return <CartContext value={{...snapshot,add:store.add,quantity:store.quantity,remove:store.remove,clear:store.clear}}>{children}</CartContext>
}

export function CartProvider({children}:{children:ReactNode}) {
  const {state,error}=useAuth()
  if(state.status==='LOADING' || error) return <CartContext value={waiting}>{children}</CartContext>
  const identity=state.status==='AUTHENTICATED'?'user:'+state.user.uid:'guest'
  return <CartSession key={identity} identity={identity}>{children}</CartSession>
}
