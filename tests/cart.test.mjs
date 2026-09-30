import test from 'node:test'
import assert from 'node:assert/strict'
import { readCart,changeQuantity,mergeCarts,cartSummary } from '../src/features/cart/cart.logic.ts'
import { createCartStore } from '../src/features/cart/cart.store.ts'
import { validateCheckoutDetails } from '../src/features/orders/checkout.logic.ts'
const pack=items=>JSON.stringify({version:1,items})
const memory=()=>{const data=new Map();return {persistent:true,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
test('corrupt and foreign storage cannot introduce invalid quantities or prices',()=>{
 assert.deepEqual(readCart('not JSON'),[])
 assert.deepEqual(readCart(JSON.stringify({version:2,items:[]})),[])
 assert.deepEqual(readCart(pack([{productId:'p',quantity:2,priceMinor:1},{productId:'bad',quantity:-1},{productId:'fraction',quantity:1.5},{productId:'nan',quantity:null}])),[{productId:'p',quantity:2}])
})
test('quantity bounds and cart capacity are enforced',()=>{
 for(const n of [0,-1,1.5,100,NaN,Infinity]) assert.throws(()=>changeQuantity([],'p',n))
 const full=Array.from({length:50},(_,i)=>({productId:String(i),quantity:1}))
 assert.throws(()=>changeQuantity(full,'extra',1))
 assert.equal(changeQuantity(full,'0',2).length,50)
})
test('guest merge is idempotent and retains overflow products',()=>{
 const saved=[{productId:'same',quantity:3}]
 const guest=[{productId:'same',quantity:2},{productId:'new',quantity:1}]
 const merged=mergeCarts(saved,guest).items
 assert.deepEqual(mergeCarts(merged,guest).items,merged)
 const full=Array.from({length:50},(_,i)=>({productId:String(i),quantity:1}))
 assert.equal(mergeCarts(full,[{productId:'extra',quantity:1}]).remainingGuest.length,1)
})
test('prices come from current catalog and unavailable items block continuation',()=>{
 const items=[{productId:'p',quantity:2},{productId:'missing',quantity:1}]
 assert.deepEqual(cartSummary(items,[{id:'p',priceMinor:603200}]),{subtotalMinor:1206400,unavailable:1,overflow:false,quantity:3})
 assert.equal(cartSummary([{productId:'p',quantity:1}],[{id:'p',priceMinor:603200,availability:'UNAVAILABLE'}]).unavailable,1)
 assert.equal(cartSummary([{productId:'p',quantity:99}],[{id:'p',priceMinor:Number.MAX_SAFE_INTEGER}]).overflow,true)
})
test('guest cart survives reload and is migrated only into the signing-in account',()=>{
 const storage=memory()
 const guest=createCartStore(storage,'guest');guest.start();guest.add('p')
 const reload=createCartStore(storage,'guest');reload.start()
 assert.equal(reload.getSnapshot().items.length,1)
 const userA=createCartStore(storage,'A','guest');userA.start()
 assert.equal(userA.getSnapshot().items.length,1)
 const userB=createCartStore(storage,'B','guest');userB.start()
 assert.deepEqual(userB.getSnapshot().items,[])
 const logout=createCartStore(storage,'guest');logout.start()
 assert.deepEqual(logout.getSnapshot().items,[])
 const again=createCartStore(storage,'A','guest');again.start()
 assert.equal(again.getSnapshot().items.length,1)
})
test('mutations reread persisted items rather than overwriting another tab additions',()=>{
 const storage=memory(),a=createCartStore(storage,'g'),b=createCartStore(storage,'g')
 a.start();b.start();a.add('one');b.add('two');a.refresh()
 assert.equal(a.getSnapshot().items.length,2)
 a.quantity('one',4);a.remove('two');assert.equal(a.getSnapshot().items[0].quantity,4)
 a.clear();assert.deepEqual(a.getSnapshot().items,[])
})
test('storage fallback announces session-only persistence',()=>{
 const storage=memory();storage.persistent=false
 const cart=createCartStore(storage,'g');cart.start();cart.add('p')
 assert.ok(cart.getSnapshot().warning)
 assert.equal(cart.getSnapshot().items.length,1)
})
test('billing keeps leading zeros and CI complement without accepting blank fields',()=>{
 const input={customer:{firstName:' Ana ',lastName:'Test',phone:'12345678'},billing:{name:'Ana Test',documentType:'CI',documentNumber:'001234',documentComplement:' 1A '}}
 const result=validateCheckoutDetails(input)
 assert.equal(result.customer.firstName,'Ana');assert.equal(result.billing.documentNumber,'001234');assert.equal(result.billing.documentComplement,'1A')
 assert.equal(validateCheckoutDetails({...input,billing:{...input.billing,documentType:'NIT'}}).billing.documentComplement,null)
 assert.throws(()=>validateCheckoutDetails({...input,customer:{...input.customer,firstName:'   '}}))
})
