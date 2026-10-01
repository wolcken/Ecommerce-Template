import { deleteApp, initializeApp } from 'firebase/app'
import { collection, doc, getDoc, getDocs, getFirestore, limit, query, terminate, where } from 'firebase/firestore'
import { loadEnv } from 'vite'
import { readEnvironment } from '../src/infrastructure/firebase/environment.ts'

const env=loadEnv('production',process.cwd(),'VITE_')
const environment=readEnvironment(env)
if(environment.mode!=='firebase' || environment.config.projectId.startsWith('demo-') || env.VITE_USE_FIREBASE_EMULATORS==='true') {
  throw new Error('La prueba requiere una configuración Firebase real sin emuladores.')
}
const app=initializeApp(environment.config,'live-rules-smoke')
const db=getFirestore(app)
try {
  const [products,categories]=await Promise.all([
    getDocs(query(collection(db,'products'),where('active','==',true),limit(1))),
    getDocs(query(collection(db,'categories'),where('active','==',true),limit(1))),
  ])
  let privateDenied=false, privateCode='none', ordersDenied=false, ordersCode='none', profileDenied=false, profileCode='none'
  try { await getDoc(doc(db,'productPricing','rules-probe')) }
  catch(error) {
    privateCode=typeof error==='object' && error!==null && 'code' in error ? String(error.code) : 'unknown'
    privateDenied=privateCode==='permission-denied' || privateCode==='firestore/permission-denied'
  }
  if(!privateDenied) throw new Error('La colección privada no fue rechazada por las reglas. Código: '+privateCode)
  try { await getDoc(doc(db,'orders','rules-probe')) }
  catch(error) {
    ordersCode=typeof error==='object' && error!==null && 'code' in error ? String(error.code) : 'unknown'
    ordersDenied=ordersCode==='permission-denied' || ordersCode==='firestore/permission-denied'
  }
  if(!ordersDenied) throw new Error('Las solicitudes no rechazaron la lectura anónima. Código: '+ordersCode)
  try { await getDoc(doc(db,'profiles','rules-probe')) }
  catch(error) {
    profileCode=typeof error==='object' && error!==null && 'code' in error ? String(error.code) : 'unknown'
    profileDenied=profileCode==='permission-denied' || profileCode==='firestore/permission-denied'
  }
  if(!profileDenied) throw new Error('Los perfiles no rechazaron la lectura anónima. Código: '+profileCode)
  console.log(JSON.stringify({project:environment.config.projectId,activeProductSample:products.size,activeCategorySample:categories.size,privateReadDenied:true,anonymousOrderReadDenied:true,anonymousProfileReadDenied:true},null,2))
} finally {
  await terminate(db)
  await deleteApp(app)
}
