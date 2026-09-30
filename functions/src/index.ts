import { previewCheckout as calculatePreview, previewInput } from './checkout.js'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { calculatePrice } from '../../src/features/pricing/calculatePrice.js'
import { categoryInput, productInput, identifier } from './validation.js'

initializeApp()
const db = getFirestore()
const options = { region: 'us-central1', maxInstances: 3 }
function admin(request: CallableRequest) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Inicia sesión.')
  if (request.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Acceso solo para administradores.')
  return request.auth.uid
}
function version(data: { version?: number } | undefined, expected: number) {
  if ((data?.version ?? 0) !== expected) throw new HttpsError('aborted', 'Los datos cambiaron. Recarga antes de guardar.')
}
function conflict(message: string): never { throw new HttpsError('failed-precondition', message) }

export const saveCategory = onCall(options, async request => {
  const uid = admin(request)
  const input = categoryInput(request.data)
  const ref = db.collection('categories').doc(input.id)
  const slugRef = db.collection('slugRegistry').doc('category-' + input.slug)
  const audit = db.collection('auditEvents').doc()
  await db.runTransaction(async tx => {
    const [snapshot, registry] = await Promise.all([tx.get(ref), tx.get(slugRef)])
    const old = snapshot.data()
    version(old, input.expectedVersion)
    if (old && old.slug !== input.slug) conflict('El slug no se puede cambiar después de crear la categoría.')
    if (old?.parentId) conflict('La edición de subcategorías se habilitará posteriormente.')
    if (registry.exists && registry.data()?.entityId !== input.id) conflict('Ese slug ya está en uso.')
    if (!input.active) {
      const [products, children] = await Promise.all([
        tx.get(db.collection('products').where('categoryId','==',input.id).where('active','==',true).limit(1)),
        tx.get(db.collection('categories').where('parentId','==',input.id).where('active','==',true).limit(1)),
      ])
      if (!products.empty || !children.empty) conflict('Primero desactiva o reasigna los productos y subcategorías activos.')
    }
    const now = Timestamp.now()
    tx.set(ref, { name:input.name, slug:input.slug, description:input.description, active:input.active, parentId:null,
      position:old?.position ?? 0, version:(old?.version ?? 0)+1, createdAt:old?.createdAt ?? now, updatedAt:now })
    tx.set(slugRef, { entityId:input.id })
    tx.set(audit, { actorId:uid, action:'SAVE_CATEGORY', entityId:input.id, createdAt:now })
  })
  return { id:input.id }
})

export const saveProduct = onCall(options, async request => {
  const uid = admin(request)
  const input = productInput(request.data)
  const ref = db.collection('products').doc(input.id)
  const pricing = db.collection('productPricing').doc(input.id)
  const inventory = db.collection('inventory').doc(input.id)
  const category = db.collection('categories').doc(input.categoryId)
  const slugRef = db.collection('slugRegistry').doc('product-' + input.slug)
  const skuRef = db.collection('skuRegistry').doc(input.sku)
  const audit = db.collection('auditEvents').doc()
  const price = calculatePrice(input)
  await db.runTransaction(async tx => {
    const [existing, stock, cat, slug, sku] = await Promise.all([tx.get(ref),tx.get(inventory),tx.get(category),tx.get(slugRef),tx.get(skuRef)])
    const old = existing.data()
    version(old, input.expectedVersion)
    if (old && (old.slug !== input.slug || old.sku !== input.sku)) conflict('SKU y slug no se pueden cambiar después del alta.')
    if (!cat.exists || (input.active && !cat.data()?.active)) conflict('Selecciona una categoría activa para publicar.')
    if ((slug.exists && slug.data()?.entityId !== input.id) || (sku.exists && sku.data()?.entityId !== input.id)) conflict('El SKU o slug ya está en uso.')
    const committed = stock.data()?.committed ?? 0
    if (!Number.isSafeInteger(committed) || committed < 0 || input.onHand < committed) conflict('Las existencias no pueden ser menores que las unidades comprometidas.')
    const now = Timestamp.now()
    const metadata = { createdAt:old?.createdAt ?? now, updatedAt:now, version:(old?.version ?? 0)+1 }
    tx.set(ref, { ...metadata, name:input.name, slug:input.slug, sku:input.sku, description:input.description, categoryId:input.categoryId,
      images:input.imageUrl ? [{url:input.imageUrl,alt:input.name,position:0}] : [],
      priceMinor:price.saleMinor, currency:'BOB', priceVersion:(old?.priceVersion ?? 0)+1,
      availability:input.onHand > committed ? 'AVAILABLE':'UNAVAILABLE', active:input.active, featured:old?.featured ?? false })
    tx.set(pricing, { ...metadata, productId:input.id, costMinor:input.costMinor, profitMinor:input.profitMinor,
      billingRateBps:input.billingRateBps, currency:'BOB', pricingPolicyVersion:'cost-plus-fixed-v1' })
    tx.set(inventory, { productId:input.id, onHand:input.onHand, committed, version:(stock.data()?.version ?? 0)+1, updatedAt:now })
    tx.set(slugRef,{entityId:input.id})
    tx.set(skuRef,{entityId:input.id})
    // Escritura compartida para serializar publicación frente a desactivación de categoría.
    tx.update(category,{ catalogUpdatedAt:now })
    tx.set(audit,{actorId:uid,action:'SAVE_PRODUCT',entityId:input.id,createdAt:now})
  })
  return { id:input.id }
})

export const listAdminCatalog = onCall(options, async request => {
  admin(request)
  const kind = request.data?.kind
  if (kind !== 'products' && kind !== 'categories') throw new HttpsError('invalid-argument','Colección inválida.')
  let query = db.collection(kind).orderBy('__name__').limit(100)
  if (request.data.cursor) query = query.startAfter(identifier(request.data.cursor))
  const snapshot = await query.get()
  const items = await Promise.all(snapshot.docs.map(async doc => {
    const d = doc.data()
    const common = {id:doc.id,version:d.version,name:d.name,slug:d.slug,description:d.description,active:d.active}
    if (kind === 'categories') return common
    const [price, stock] = await Promise.all([db.collection('productPricing').doc(doc.id).get(),db.collection('inventory').doc(doc.id).get()])
    if (!price.exists || !stock.exists) conflict('Hay productos sin costo o inventario. Completa su migración antes de administrarlos.')
    const p = price.data()!, s = stock.data()!
    return {...common, sku:d.sku, categoryId:d.categoryId, imageUrl:d.images?.[0]?.url ?? '',priceMinor:d.priceMinor,
      costMinor:p.costMinor,profitMinor:p.profitMinor,billingRateBps:p.billingRateBps,onHand:s.onHand,committed:s.committed}
  }))
  return {items,nextCursor:snapshot.size === 100 ? snapshot.docs[snapshot.size-1].id:null}
})

export const previewCheckout = onCall(options, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Inicia sesión para cotizar.')
  return calculatePreview(db, previewInput(request.data))
})
