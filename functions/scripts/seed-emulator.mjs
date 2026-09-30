// Este script está limitado a emuladores locales; nunca lee .env.local.
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
const projectId = 'demo-ecommerce-test'
const {initializeApp, deleteApp} = await import('firebase-admin/app')
const {getAuth} = await import('firebase-admin/auth')
const {getFirestore} = await import('firebase-admin/firestore')
const app = initializeApp({projectId})
try {
  const auth = getAuth(app), db = getFirestore(app)
  const email = 'admin@ecommerce.com', password = '123456'
  let user
  try { user = await auth.getUserByEmail(email) }
  catch (error) {
    if (error.code !== 'auth/user-not-found') throw error
    user = await auth.createUser({email,password})
  }
  // Conservar claims existentes; no cambiar la contraseña de una cuenta existente.
  await auth.setCustomUserClaims(user.uid,{...user.customClaims,admin:true})
  const login = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',
    {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true}),signal:AbortSignal.timeout(10000)})
  const session = await login.json()
  if (!session.idToken) throw new Error('No se pudo iniciar sesión con la cuenta local de prueba.')
  async function call(name,data) {
    const response = await fetch('http://127.0.0.1:5001/'+projectId+'/us-central1/'+name,
      {method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.idToken},body:JSON.stringify({data}),signal:AbortSignal.timeout(20000)})
    const body = await response.json()
    if (body.error) throw new Error('No se pudo preparar el catálogo local: '+body.error.status)
  }
  if (!(await db.doc('categories/demo-tech').get()).exists) {
    await call('saveCategory',{id:'demo-tech',expectedVersion:0,name:'Tecnología',slug:'demo-tecnologia',description:'Catálogo de prueba local',active:true})
  }
  if (!(await db.doc('products/demo-laptop').get()).exists) {
    await call('saveProduct',{id:'demo-laptop',expectedVersion:0,name:'Laptop de prueba',slug:'demo-laptop',sku:'DEMO-LAPTOP',
      description:'Producto de demostración para pruebas locales.',categoryId:'demo-tech',imageUrl:'',
      costMinor:500000,profitMinor:20000,billingRateBps:1600,onHand:10,active:true})
  }
  console.log('Cuenta ADMIN y catálogo local preparados. Proyecto: '+projectId)
} catch {
  console.error('No se pudo preparar el entorno local. Inicia yarn emulators y verifica que la cuenta de prueba no tenga otra contraseña.')
  process.exitCode=1
} finally {await deleteApp(app)}
