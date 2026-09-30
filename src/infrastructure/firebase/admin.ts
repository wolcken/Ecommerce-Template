import {
  collection, doc, documentId, getDocFromServer, getDocsFromServer, limit, orderBy, query,
  runTransaction, startAfter, Timestamp, where, type DocumentData, type Firestore, type QueryConstraint,
} from 'firebase/firestore'
import type { AdminCategory, AdminPage, AdminProduct, CatalogAdminService, CategoryInput, ProductInput } from '../../features/admin/admin.models'
import { calculatePrice } from '../../features/pricing/calculatePrice.ts'

const PAGE_SIZE=100
function text(value:string,name:string,max:number,empty=false) {
  const result=value.trim()
  if(result.length>max||(!empty&&!result)) throw new Error(`Revisa ${name}.`)
  return result
}
function identifier(value:string,name='identificador') {
  const result=text(value,name,120)
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(result)) throw new Error(`Revisa ${name}.`)
  return result
}
function integer(value:number,name:string,max=1_000_000_000) {
  if(!Number.isSafeInteger(value)||value<0||value>max) throw new Error(`Revisa ${name}.`)
  return value
}
function categoryInput(input:CategoryInput):CategoryInput {
  const slug=text(input.slug,'slug',120)
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Usa un slug en minúsculas, sin espacios.')
  return {id:identifier(input.id),expectedVersion:integer(input.expectedVersion,'versión'),name:text(input.name,'nombre',120),
    slug,description:text(input.description,'descripción',2000,true),active:Boolean(input.active)}
}
function productInput(input:ProductInput):ProductInput {
  const base=categoryInput(input)
  const imageUrl=text(input.imageUrl,'imagen',2000,true)
  if(imageUrl) {
    try {if(new URL(imageUrl).protocol!=='https:') throw new Error()}
    catch {throw new Error('La imagen debe tener una URL HTTPS pública y válida.')}
  }
  return {...base,sku:identifier(input.sku,'SKU'),categoryId:identifier(input.categoryId,'categoría'),imageUrl,
    costMinor:integer(input.costMinor,'costo'),profitMinor:integer(input.profitMinor,'ganancia'),
    billingRateBps:integer(input.billingRateBps,'porcentaje',10000),onHand:integer(input.onHand,'existencias',1_000_000)}
}
function version(data:DocumentData|undefined,expected:number) {
  if((data?.version??0)!==expected) throw new Error('Los datos cambiaron. Recarga antes de guardar.')
}
function failure(error:unknown):Error {
  if(error instanceof Error && !('code' in error)) return error
  const code=typeof error==='object'&&error!==null&&'code' in error?String(error.code):''
  if(code.includes('permission-denied')) return new Error('Tu sesión no tiene permisos ADMIN. Cierra y vuelve a iniciar sesión.')
  if(code.includes('aborted')) return new Error('Los datos cambiaron. Recarga antes de guardar.')
  return new Error('No se pudo guardar en Firestore. Revisa conexión, permisos y formato de los datos.',{cause:error})
}
function common(id:string,data:DocumentData):AdminCategory {
  return {id,version:data.version,name:data.name,slug:data.slug,description:data.description,active:data.active}
}

export function createFirestoreAdminService(db:Firestore,currentUserId:()=>string|null):CatalogAdminService {
  function actorId() {const uid=currentUserId();if(!uid) throw new Error('Inicia sesión nuevamente.');return uid}
  async function listCategories(cursor?:string):Promise<AdminPage<AdminCategory>> {
    try {
      const constraints:QueryConstraint[]=[orderBy(documentId()),limit(PAGE_SIZE)]
      if(cursor) constraints.push(startAfter(cursor))
      const snapshot=await getDocsFromServer(query(collection(db,'categories'),...constraints))
      return {items:snapshot.docs.map(item=>common(item.id,item.data())),nextCursor:snapshot.size===PAGE_SIZE?snapshot.docs.at(-1)!.id:null}
    } catch(error) {throw failure(error)}
  }
  async function listProducts(cursor?:string):Promise<AdminPage<AdminProduct>> {
    try {
      const constraints:QueryConstraint[]=[orderBy(documentId()),limit(PAGE_SIZE)]
      if(cursor) constraints.push(startAfter(cursor))
      const snapshot=await getDocsFromServer(query(collection(db,'products'),...constraints))
      const items=await Promise.all(snapshot.docs.map(async item=>{
        const data=item.data()
        const [pricing,inventory]=await Promise.all([
          getDocFromServer(doc(db,'productPricing',item.id)),getDocFromServer(doc(db,'inventory',item.id)),
        ])
        if(!pricing.exists()||!inventory.exists()) throw new Error('Hay productos sin costo o inventario. Completa su migración antes de administrarlos.')
        const price=pricing.data(),stock=inventory.data()
        return {...common(item.id,data),sku:data.sku,categoryId:data.categoryId,imageUrl:data.images?.[0]?.url??'',
          priceMinor:data.priceMinor,costMinor:price.costMinor,profitMinor:price.profitMinor,billingRateBps:price.billingRateBps,
          onHand:stock.onHand,committed:stock.committed} satisfies AdminProduct
      }))
      return {items,nextCursor:snapshot.size===PAGE_SIZE?snapshot.docs.at(-1)!.id:null}
    } catch(error) {throw failure(error)}
  }
  async function saveCategory(raw:CategoryInput) {
    const input=categoryInput(raw)
    try {
      if(!input.active) {
        const [products,children]=await Promise.all([
          getDocsFromServer(query(collection(db,'products'),where('categoryId','==',input.id),where('active','==',true),limit(1))),
          getDocsFromServer(query(collection(db,'categories'),where('parentId','==',input.id),where('active','==',true),limit(1))),
        ])
        if(!products.empty||!children.empty) throw new Error('Primero desactiva los productos y subcategorías activas.')
      }
      await runTransaction(db,async transaction=>{
        const ref=doc(db,'categories',input.id),slugRef=doc(db,'slugRegistry','category-'+input.slug)
        const [snapshot,registry]=await Promise.all([transaction.get(ref),transaction.get(slugRef)])
        const old=snapshot.data()
        version(old,input.expectedVersion)
        if(old&&old.slug!==input.slug) throw new Error('El slug no se puede cambiar después del alta.')
        if(registry.exists()&&registry.data().entityId!==input.id) throw new Error('Ese slug ya está en uso.')
        const now=Timestamp.now()
        transaction.set(ref,{name:input.name,slug:input.slug,description:input.description,active:input.active,parentId:null,
          position:old?.position??0,version:(old?.version??0)+1,createdAt:old?.createdAt??now,updatedAt:now})
        transaction.set(slugRef,{entityId:input.id})
        transaction.set(doc(collection(db,'auditEvents')),{actorId:actorId(),action:'SAVE_CATEGORY',entityId:input.id,createdAt:now})
      })
    } catch(error) {throw failure(error)}
  }
  async function saveProduct(raw:ProductInput) {
    const input=productInput(raw)
    const price=calculatePrice(input)
    try {
      await runTransaction(db,async transaction=>{
        const ref=doc(db,'products',input.id),pricingRef=doc(db,'productPricing',input.id),inventoryRef=doc(db,'inventory',input.id)
        const categoryRef=doc(db,'categories',input.categoryId),slugRef=doc(db,'slugRegistry','product-'+input.slug),skuRef=doc(db,'skuRegistry',input.sku)
        const [existing,inventory,category,slug,sku]=await Promise.all([
          transaction.get(ref),transaction.get(inventoryRef),transaction.get(categoryRef),transaction.get(slugRef),transaction.get(skuRef),
        ])
        const old=existing.data(),stock=inventory.data()
        version(old,input.expectedVersion)
        if(old&&(old.slug!==input.slug||old.sku!==input.sku)) throw new Error('SKU y slug no se pueden cambiar después del alta.')
        if(!category.exists()||(input.active&&category.data().active!==true)) throw new Error('Selecciona una categoría activa para publicar.')
        if((slug.exists()&&slug.data().entityId!==input.id)||(sku.exists()&&sku.data().entityId!==input.id)) throw new Error('El SKU o slug ya está en uso.')
        const committed=stock?.committed??0
        if(!Number.isSafeInteger(committed)||committed<0||input.onHand<committed) throw new Error('Las existencias no pueden ser menores que las unidades comprometidas.')
        const now=Timestamp.now(),nextVersion=(old?.version??0)+1
        transaction.set(ref,{name:input.name,slug:input.slug,sku:input.sku,description:input.description,categoryId:input.categoryId,
          images:input.imageUrl?[{url:input.imageUrl,alt:input.name,position:0}]:[],priceMinor:price.saleMinor,currency:'BOB',
          priceVersion:(old?.priceVersion??0)+1,availability:input.onHand>committed?'AVAILABLE':'UNAVAILABLE',
          active:input.active,featured:old?.featured??false,version:nextVersion,createdAt:old?.createdAt??now,updatedAt:now})
        transaction.set(pricingRef,{productId:input.id,costMinor:input.costMinor,profitMinor:input.profitMinor,
          billingRateBps:input.billingRateBps,currency:'BOB',pricingPolicyVersion:'cost-plus-fixed-v1',
          version:nextVersion,createdAt:old?.createdAt??now,updatedAt:now})
        transaction.set(inventoryRef,{productId:input.id,onHand:input.onHand,committed,
          version:(stock?.version??0)+1,updatedAt:now})
        transaction.set(slugRef,{entityId:input.id});transaction.set(skuRef,{entityId:input.id})
        transaction.update(categoryRef,{catalogUpdatedAt:now})
        transaction.set(doc(collection(db,'auditEvents')),{actorId:actorId(),action:'SAVE_PRODUCT',entityId:input.id,createdAt:now})
      })
    } catch(error) {throw failure(error)}
  }
  return {listCategories,listProducts,saveCategory,saveProduct}
}
