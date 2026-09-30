import {createFirestoreAdminService} from '../src/infrastructure/firebase/admin.ts'
import test,{before,after} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing'
import {collection,doc,getDoc,getDocs,query,setDoc,Timestamp,where,writeBatch} from 'firebase/firestore'

const projectId='demo-ecommerce-test'
if(!process.env.FIRESTORE_EMULATOR_HOST?.startsWith('127.0.0.1:')) throw new Error('Only the local Firestore emulator is allowed')
let environment
const now=Timestamp.now()
const category={name:'Tecnología',slug:'tecnologia',description:'',active:true,parentId:null,position:0,version:1,createdAt:now,updatedAt:now}
const product={name:'Laptop',slug:'laptop',sku:'LAPTOP',description:'',categoryId:'tech',images:[{url:'https://images.example/laptop.jpg',alt:'Laptop',position:0}],
 priceMinor:603200,currency:'BOB',priceVersion:1,availability:'AVAILABLE',active:true,featured:false,version:1,createdAt:now,updatedAt:now}
const pricing={productId:'laptop',costMinor:500000,profitMinor:20000,billingRateBps:1600,currency:'BOB',pricingPolicyVersion:'cost-plus-fixed-v1',version:1,createdAt:now,updatedAt:now}
const inventory={productId:'laptop',onHand:10,committed:0,version:1,updatedAt:now}

before(async()=>{
 environment=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')}})
 await environment.clearFirestore()
})
after(async()=>environment.cleanup())

test('public reads only active catalog documents',async()=>{
 await environment.withSecurityRulesDisabled(async context=>{
  const db=context.firestore()
  await setDoc(doc(db,'categories','tech'),category)
  await setDoc(doc(db,'products','laptop'),product)
  await setDoc(doc(db,'products','hidden'),{...product,slug:'hidden',sku:'HIDDEN',active:false})
  await setDoc(doc(db,'productPricing','laptop'),pricing)
 })
 const db=environment.unauthenticatedContext().firestore()
 assert.equal((await assertSucceeds(getDocs(query(collection(db,'products'),where('active','==',true))))).size,1)
 await assertSucceeds(getDoc(doc(db,'products','laptop')))
 await assertFails(getDoc(doc(db,'products','hidden')))
 await assertFails(getDoc(doc(db,'productPricing','laptop')))
})

test('USER cannot write catalog or private collections',async()=>{
 const db=environment.authenticatedContext('customer').firestore()
 for(const [path,value] of [['categories/unsafe',category],['products/unsafe',product],['productPricing/unsafe',pricing],['inventory/unsafe',inventory]]) {
  await assertFails(setDoc(doc(db,path),value))
 }
})

test('ADMIN writes a complete catalog record atomically and reads private data',async()=>{
 const db=environment.authenticatedContext('admin-user',{admin:true}).firestore()
 const batch=writeBatch(db)
 batch.set(doc(db,'categories','spark-tech'),{...category,slug:'spark-tech'})
 batch.set(doc(db,'products','spark-laptop'),{...product,slug:'spark-laptop',sku:'SPARK-LAPTOP',categoryId:'spark-tech'})
 batch.set(doc(db,'productPricing','spark-laptop'),{...pricing,productId:'spark-laptop'})
 batch.set(doc(db,'inventory','spark-laptop'),{...inventory,productId:'spark-laptop'})
 batch.set(doc(db,'slugRegistry','product-spark-laptop'),{entityId:'spark-laptop'})
 batch.set(doc(db,'skuRegistry','SPARK-LAPTOP'),{entityId:'spark-laptop'})
 batch.set(doc(db,'auditEvents','event-1'),{actorId:'admin-user',action:'SAVE_PRODUCT',entityId:'spark-laptop',createdAt:now})
 await assertSucceeds(batch.commit())
 assert.equal((await assertSucceeds(getDoc(doc(db,'productPricing','spark-laptop')))).data().costMinor,500000)
})

test('rules reject private fields, insecure image URLs and impossible inventory',async()=>{
 const db=environment.authenticatedContext('admin-user',{admin:true}).firestore()
 await assertFails(setDoc(doc(db,'products','leak'),{...product,costMinor:1}))
 await assertFails(setDoc(doc(db,'products','image'),{...product,slug:'image',sku:'IMAGE',images:[{url:'http://example.test/a.jpg',alt:'',position:0}]}))
 await assertFails(setDoc(doc(db,'inventory','bad'),{...inventory,productId:'bad',onHand:1,committed:2}))
})

test('updates require sequential versions and preserve immutable identifiers',async()=>{
 const db=environment.authenticatedContext('admin-user',{admin:true}).firestore()
 const ref=doc(db,'products','spark-laptop')
 await assertFails(setDoc(ref,{...product,slug:'spark-laptop',sku:'SPARK-LAPTOP',categoryId:'spark-tech',version:1}))
 await assertFails(setDoc(ref,{...product,slug:'changed',sku:'SPARK-LAPTOP',categoryId:'spark-tech',version:2}))
 await assertSucceeds(setDoc(ref,{...product,slug:'spark-laptop',sku:'SPARK-LAPTOP',categoryId:'spark-tech',version:2,createdAt:now,updatedAt:Timestamp.now()}))
})

test('ADMIN cannot forge another audit actor or delete catalog history',async()=>{
 const db=environment.authenticatedContext('admin-user',{admin:true}).firestore()
 await assertFails(setDoc(doc(db,'auditEvents','event-2'),{actorId:'other',action:'SAVE_PRODUCT',entityId:'x',createdAt:now}))
 await assertFails((await import('firebase/firestore')).deleteDoc(doc(db,'products','spark-laptop')))
 assert.ok((await getDoc(doc(db,'products','spark-laptop'))).exists())
})

test('Spark admin adapter saves and lists a calculated product without Functions',async()=>{
 await environment.clearFirestore()
 const db=environment.authenticatedContext('admin-user',{admin:true}).firestore()
 const service=createFirestoreAdminService(db,()=> 'admin-user')
 await service.saveCategory({id:'adapter-tech',expectedVersion:0,name:'Tecnología',slug:'adapter-tech',description:'',active:true})
 await service.saveProduct({id:'adapter-laptop',expectedVersion:0,name:'Laptop Adapter',slug:'adapter-laptop',sku:'ADAPTER-LAPTOP',
  description:'',categoryId:'adapter-tech',imageUrl:'https://images.example/adapter.jpg',costMinor:500000,profitMinor:20000,
  billingRateBps:1600,onHand:5,active:true})
 const page=await service.listProducts()
 const saved=page.items.find(item=>item.id==='adapter-laptop')
 assert.equal(saved.priceMinor,603200)
 assert.equal(saved.costMinor,500000)
 assert.equal(saved.imageUrl,'https://images.example/adapter.jpg')
 assert.equal((await getDoc(doc(db,'products','adapter-laptop'))).data().costMinor,undefined)
})

