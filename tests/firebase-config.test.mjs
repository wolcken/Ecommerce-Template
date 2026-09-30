import test from 'node:test'
import assert from 'node:assert/strict'
import { readEnvironment } from '../src/infrastructure/firebase/environment.ts'
import { parseProduct, parseCategory } from '../src/infrastructure/firebase/catalogValidation.ts'

test('demo does not require Firebase values',()=>assert.deepEqual(readEnvironment({}),{mode:'demo'}))
test('Firebase mode fails closed on missing values without leaking values',()=>{
 const result=readEnvironment({VITE_DATA_SOURCE:'firebase',VITE_FIREBASE_API_KEY:'not-for-logs'})
 assert.equal(result.mode,'invalid');assert.match(result.message,/VITE_FIREBASE_PROJECT_ID/);assert.ok(!result.message.includes('not-for-logs'))
})
test('unsupported mode is rejected',()=>assert.equal(readEnvironment({VITE_DATA_SOURCE:'firebas'}).mode,'invalid'))
test('Spark configuration does not require Storage or Functions values',()=>{
 const env=Object.fromEntries(['API_KEY','AUTH_DOMAIN','PROJECT_ID','APP_ID'].map(key=>['VITE_FIREBASE_'+key,'example']))
 const result=readEnvironment({...env,VITE_DATA_SOURCE:'firebase'})
 assert.equal(result.mode,'firebase');assert.equal(result.config.projectId,'example');assert.equal(result.config.storageBucket,undefined)
})
const base={createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',version:1}
const product={...base,name:'Laptop',slug:'laptop',sku:'L1',description:'',categoryId:'tech',images:[],priceMinor:603200,priceVersion:1,currency:'BOB',availability:'AVAILABLE',active:true,featured:false}
test('public projection strips unexpected private fields',()=>{
 const result=parseProduct('p1',{...product,costMinor:500000});assert.equal(result.priceMinor,603200);assert.ok(!('costMinor' in result))
})
test('malformed prices, currencies, flags and image URLs are rejected',()=>{
 for(const change of [{priceMinor:-1},{priceMinor:1.5},{currency:'USD'},{active:'true'},{images:[{url:'javascript:alert(1)',alt:'',position:0}]}])
  assert.throws(()=>parseProduct('p1',{...product,...change}))
})
test('category accepts Timestamp-like dates and rejects missing parent',()=>{
 const category={...base,name:'Tecnología',slug:'tecnologia',description:'',parentId:null,active:true,position:0}
 assert.equal(parseCategory('tech',{...category,createdAt:{toDate:()=>new Date('2026-01-01Z')}}).createdAt,'2026-01-01T00:00:00.000Z')
 assert.throws(()=>parseCategory('tech',{...category,parentId:undefined}))
})
