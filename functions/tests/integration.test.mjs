import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { initializeApp as adminApp, deleteApp as deleteAdmin } from 'firebase-admin/app'
import { getAuth as adminAuth } from 'firebase-admin/auth'
import { getFirestore as adminFirestore } from 'firebase-admin/firestore'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore'

const projectId='demo-ecommerce-test'
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
 !process.env.FIRESTORE_EMULATOR_HOST.startsWith('127.0.0.1:') || !process.env.FIREBASE_AUTH_EMULATOR_HOST.startsWith('127.0.0.1:')) throw new Error('Only local emulators are allowed')

const app=adminApp({projectId})
const auth=adminAuth(app), db=adminFirestore(app)
let rules, adminToken, userToken
const password='Test-only-Password42'
async function account(email,isAdmin) {
  let user
  try { user=await auth.getUserByEmail(email) } catch { user=await auth.createUser({email,password}) }
  await auth.setCustomUserClaims(user.uid,isAdmin?{admin:true}:{})
  const response=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true}),
  })
  const body=await response.json()
  assert.ok(body.idToken)
  return body.idToken
}
async function callable(name,data,token) {
  const response=await fetch('http://127.0.0.1:5001/'+projectId+'/us-central1/'+name,{
    method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
    body:JSON.stringify({data}),
  })
  return response.json()
}
const category={id:'test-tech',expectedVersion:0,name:'Tecnología',slug:'test-tecnologia',description:'',active:true}
const product={id:'test-laptop',expectedVersion:0,name:'Laptop',slug:'test-laptop',sku:'TEST-LAPTOP',description:'Laptop de prueba local',
 categoryId:category.id,imageUrl:'',costMinor:500000,profitMinor:20000,billingRateBps:1600,onHand:10,active:true}

before(async()=>{
 rules=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8080,rules:await readFile('firestore.rules','utf8')}})
 await rules.clearFirestore()
 adminToken=await account('admin@example.test',true)
 userToken=await account('user@example.test',false)
})
after(async()=>{await rules.cleanup();await deleteAdmin(app)})

test('anonymous and USER cannot invoke administration',async()=>{
 for(const token of [undefined,userToken]){
  const result=await callable('saveCategory',category,token)
  assert.ok(result.error)
  assert.ok(['UNAUTHENTICATED','PERMISSION_DENIED'].includes(result.error.status))
 }
})
test('ADMIN creates category and product with server-calculated public price',async()=>{
 assert.ok((await callable('saveCategory',category,adminToken)).result)
 assert.ok((await callable('saveProduct',product,adminToken)).result)
 const visible=(await db.doc('products/'+product.id).get()).data()
 assert.equal(visible.priceMinor,603200)
 assert.ok(!('costMinor' in visible));assert.ok(!('profitMinor' in visible))
 assert.equal((await db.doc('productPricing/'+product.id).get()).data().costMinor,500000)
})
test('public active catalog is readable but costs, inventory and unrestricted queries are denied',async()=>{
 const client=rules.unauthenticatedContext().firestore()
 await assertSucceeds(getDocs(query(collection(client,'products'),where('active','==',true))))
 await assertFails(getDocs(collection(client,'products')))
 for(const path of ['productPricing/test-laptop','inventory/test-laptop','auditEvents/unknown']) await assertFails(getDoc(doc(client,path)))
})
test('even ADMIN cannot write documents directly from the client',async()=>{
 const client=rules.authenticatedContext('fake-admin',{admin:true}).firestore()
 await assertFails(setDoc(doc(client,'products','unsafe'),{active:true,priceMinor:1}))
 await assertFails(setDoc(doc(client,'users','fake-admin'),{admin:true}))
})
test('stale versions and duplicate slugs are rejected',async()=>{
 assert.equal((await callable('saveProduct',{...product,name:'stale'},adminToken)).error.status,'ABORTED')
 assert.equal((await callable('saveProduct',{...product,id:'duplicate'},adminToken)).error.status,'FAILED_PRECONDITION')
})
test('unknown fields and client price overrides are rejected',async()=>{
 assert.equal((await callable('saveProduct',{...product,id:'injected',priceMinor:1},adminToken)).error.status,'INVALID_ARGUMENT')
})
test('category cannot be deactivated while active products remain',async()=>{
 assert.equal((await callable('saveCategory',{...category,expectedVersion:1,active:false},adminToken)).error.status,'FAILED_PRECONDITION')
})
test('inventory cannot drop below committed units',async()=>{
 await db.doc('inventory/'+product.id).update({committed:3})
 assert.equal((await callable('saveProduct',{...product,expectedVersion:1,onHand:2},adminToken)).error.status,'FAILED_PRECONDITION')
})
test('concurrent updates accept exactly one version and preserve private stock',async()=>{
 const results=await Promise.all([
  callable('saveProduct',{...product,expectedVersion:1,name:'Laptop A'},adminToken),
  callable('saveProduct',{...product,expectedVersion:1,name:'Laptop B'},adminToken),
 ])
 assert.equal(results.filter(r=>r.result).length,1)
 assert.equal(results.filter(r=>r.error?.status==='ABORTED').length,1)
 assert.equal((await db.doc('inventory/'+product.id).get()).data().committed,3)
})
test('deactivated products disappear from public access and remain in admin listing',async()=>{
 assert.ok((await callable('saveProduct',{...product,expectedVersion:2,active:false},adminToken)).result)
 await assertFails(getDoc(doc(rules.unauthenticatedContext().firestore(),'products',product.id)))
 const result=await callable('listAdminCatalog',{kind:'products'},adminToken)
 assert.equal(result.result.items[0].active,false)
 assert.equal(result.result.items[0].costMinor,500000)
 // Dejar un producto visible para la revisión local de interfaz.
 assert.ok((await callable('saveProduct',{...product,expectedVersion:3},adminToken)).result)
})
