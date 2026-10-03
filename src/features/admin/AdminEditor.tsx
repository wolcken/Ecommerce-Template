import { useEffect, useState, type FormEvent } from 'react'
import { runtime } from '../../app/services/runtime'
import type { AdminCategory, AdminProduct, CategoryInput, ProductInput } from './admin.models'
import { calculatePrice } from '../pricing/calculatePrice'
import { formatMoney } from '../../shared/utils/formatMoney'

const blankCategory = (): CategoryInput => ({id:crypto.randomUUID(),expectedVersion:0,name:'',slug:'',description:'',active:true})
const blankProduct = (): ProductInput => ({...blankCategory(),sku:'',categoryId:'',imageUrl:'',costMinor:0,profitMinor:0,billingRateBps:1600,onHand:0,active:false})

export function AdminEditor({ kind }: { kind: 'products' | 'categories' }) {
  const service = runtime.mode === 'firebase' ? runtime.admin : null
  const [rows, setRows] = useState<(AdminCategory | AdminProduct)[]>([])
  const [categories,setCategories] = useState<AdminCategory[]>([])
  const [next,setNext] = useState<string|null>(null)
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [input,setInput] = useState<ProductInput>(blankProduct)
  const [editing,setEditing] = useState(false)
  const [editingCommitted,setEditingCommitted] = useState(0)

  useEffect(() => {
    if (!service) return
    let cancelled = false
    const list = kind === 'products' ? service.listProducts : service.listCategories
    async function load() {
      const data = await list()
      const cats: AdminCategory[] = []
      if (kind === 'products') {
        let cursor: string | undefined
        do { const page = await service!.listCategories(cursor); cats.push(...page.items); cursor = page.nextCursor ?? undefined } while (cursor)
      }
      if (!cancelled) { setRows(data.items);setNext(data.nextCursor);setCategories(cats);setLoading(false) }
    }
    load().catch(e => { if (!cancelled) {setError(e.message);setLoading(false)} })
    return () => {cancelled=true}
  },[kind,service])

  async function more() {
    if (!service || !next) return
    setLoading(true);setError('')
    try { const page=await (kind==='products'?service.listProducts(next):service.listCategories(next));setRows(old=>[...old,...page.items]);setNext(page.nextCursor) }
    catch(e) {setError(e instanceof Error?e.message:'No se pudo cargar.')}
    finally {setLoading(false)}
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!service) return
    setSaving(true);setError('');setNotice('')
    let persisted = false
    try {
      if (kind==='products') await service.saveProduct(input)
      else {
        const {id,expectedVersion,name,slug,description,active}=input
        await service.saveCategory({id,expectedVersion,name,slug,description,active})
      }
      persisted = true
      setEditing(false);setInput(blankProduct());setEditingCommitted(0)
      const page=await (kind==='products'?service.listProducts():service.listCategories())
      setRows(page.items);setNext(page.nextCursor);setEditing(false);setInput(blankProduct());setEditingCommitted(0);setNotice('Cambios guardados. Recarga la tienda para ver el catálogo actualizado.')
    } catch(e) {setError(persisted ? 'Los cambios se guardaron, pero no se pudo actualizar la lista. Recarga la página.' : e instanceof Error?e.message:'No se pudo guardar.')}
    finally {setSaving(false)}
  }
  function edit(row: AdminCategory|AdminProduct) {
    setError('');setNotice('');setInput({id:row.id,expectedVersion:row.version,name:row.name,slug:row.slug,description:row.description,active:row.active,sku:'sku' in row?row.sku:'',categoryId:'categoryId' in row?row.categoryId:'',imageUrl:'imageUrl' in row?row.imageUrl:'',costMinor:'costMinor' in row?row.costMinor:0,profitMinor:'profitMinor' in row?row.profitMinor:0,billingRateBps:'billingRateBps' in row?row.billingRateBps:1600,onHand:'onHand' in row?row.onHand:0});setEditing(true)
    setEditingCommitted('committed' in row?row.committed:0)
  }
  function update<K extends keyof ProductInput>(key: K,value: ProductInput[K]) {setInput(old=>({...old,[key]:value}))}
  if (!service) return <p>La edición requiere Firebase y una cuenta administradora. El modo demo no guarda cambios.</p>
  let preview = '—'
  try {preview=formatMoney(calculatePrice(input).saleMinor)} catch { /* Entrada incompleta mientras se edita. */ }
  return <section>
    <p className="eyebrow">Administración del catálogo</p><h1>{kind==='products'?'Productos':'Categorías'}</h1>
    <p>Crear, editar o desactivar. Los registros históricos se conservan.</p>
    {error && <p role="alert" className="notice">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {loading && <p role="status">Cargando…</p>}
    <button className="button" disabled={saving} onClick={()=>{setInput({...blankProduct(),active:kind==='categories'});setEditingCommitted(0);setEditing(true);setNotice('')}}>Crear {kind==='products'?'producto':'categoría'}</button>
    <div className="table-scroll"><table><thead><tr><th>Nombre</th><th>Estado</th>{kind==='products'&&<><th>Físico</th><th>Comprometido</th><th>Disponible</th></>}<th>Acción</th></tr></thead><tbody>
      {rows.map(row=>{
        const product='onHand' in row?row:null
        return <tr key={row.id}>
          <td><strong>{row.name}</strong>{product&&<small className="stock-sku">SKU: {product.sku}</small>}</td>
          <td>{row.active?'Activo':'Inactivo'}</td>
          {product&&<><td>{product.onHand}</td><td>{product.committed}</td><td><strong>{product.onHand-product.committed}</strong></td></>}
          <td><button disabled={saving} onClick={()=>edit(row)}>Editar</button></td>
        </tr>
      })}
    </tbody></table></div>
    {!loading && rows.length===0 && <p>No hay registros todavía.</p>}
    {next && <button disabled={loading||saving} onClick={more}>Cargar más</button>}
    {editing && <form className="admin-form" onSubmit={save}>
      <h2>{input.expectedVersion ? 'Editar registro':'Nuevo registro'}</h2>
      <fieldset disabled={saving}>
        <label>Nombre<input required maxLength={120} value={input.name} onChange={e=>update('name',e.target.value)} /></label>
        <label>Slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} disabled={input.expectedVersion>0} value={input.slug} onChange={e=>update('slug',e.target.value)} /><small>Identificador de URL, por ejemplo laptop-studio. No cambia después del alta.</small></label>
        <label>Descripción<textarea maxLength={kind==='products'?5000:2000} value={input.description} onChange={e=>update('description',e.target.value)} /></label>
        {kind==='products' && <>
          <label>SKU<input required maxLength={120} pattern="[a-zA-Z0-9][a-zA-Z0-9_-]*" disabled={input.expectedVersion>0} value={input.sku} onChange={e=>update('sku',e.target.value)} /></label>
          <label>Categoría<select required value={input.categoryId} onChange={e=>update('categoryId',e.target.value)}><option value="">Selecciona una categoría</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}{c.active?'':' (inactiva)'}</option>)}</select></label>
          <label>URL HTTPS de imagen (opcional)<input type="url" maxLength={2000} value={input.imageUrl} onChange={e=>update('imageUrl',e.target.value)} /></label>
          <div className="admin-fields">
            <label>Costo (Bs)<input type="number" min="0" max="10000000" step=".01" required value={input.costMinor/100} onChange={e=>update('costMinor',Math.round(Number(e.target.value)*100))} /></label>
            <label>Ganancia fija (Bs)<input type="number" min="0" max="10000000" step=".01" required value={input.profitMinor/100} onChange={e=>update('profitMinor',Math.round(Number(e.target.value)*100))} /></label>
            <label>Recargo tributario (%)<input type="number" min="0" max="100" step=".01" required value={input.billingRateBps/100} onChange={e=>update('billingRateBps',Math.round(Number(e.target.value)*100))} /></label>
            <label>Stock físico total<input type="number" min={editingCommitted} max="1000000" step="1" required value={input.onHand} onChange={e=>update('onHand',Number(e.target.value))} /></label>
          </div>
          <div className="inventory-preview" aria-label="Resumen de inventario del producto">
            <span>Físico <strong>{input.onHand}</strong></span>
            <span>Comprometido <strong>{editingCommitted}</strong></span>
            <span>Disponible <strong>{Math.max(0,input.onHand-editingCommitted)}</strong></span>
          </div>
          {editingCommitted>0&&<p className="demo-caption">Las unidades comprometidas se liberan o consumen al cancelar, vencer o completar la solicitud correspondiente.</p>}
          <p>Precio público calculado: <strong>{preview}</strong></p>
        </>}
        <label className="checkbox-label"><input type="checkbox" checked={input.active} onChange={e=>update('active',e.target.checked)} />{kind==='products'?'Publicar producto':'Categoría activa'}</label>
        <div className="auth-links"><button className="button" disabled={saving}>{saving?'Guardando…':'Guardar'}</button><button type="button" onClick={()=>setEditing(false)}>Cancelar</button></div>
      </fieldset>
    </form>}
  </section>
}
