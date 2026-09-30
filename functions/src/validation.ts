import { HttpsError } from 'firebase-functions/v2/https'
import type { CategoryInput, ProductInput } from '../../src/features/admin/admin.models.js'

export function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpsError('invalid-argument', 'Datos inválidos.')
  const data = value as Record<string, unknown>
  if (Object.keys(data).some(key => !keys.includes(key))) throw new HttpsError('invalid-argument', 'Hay campos no permitidos.')
  return data
}
function text(value: unknown, name: string, max = 120, empty = false): string {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) throw new HttpsError('invalid-argument', `Revisa ${name}.`)
  return value.trim()
}
export function integer(value: unknown, name: string, max = 1_000_000_000): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > max) throw new HttpsError('invalid-argument', `Revisa ${name}.`)
  return value
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new HttpsError('invalid-argument', 'Estado inválido.')
  return value
}
export function identifier(value: unknown): string {
  const id = text(value, 'identificador', 120)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) throw new HttpsError('invalid-argument', 'Identificador inválido.')
  return id
}
function slug(value: unknown): string {
  const s = text(value, 'slug')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) throw new HttpsError('invalid-argument', 'Usa un slug en minúsculas, sin espacios.')
  return s
}
export function categoryInput(value: unknown): CategoryInput {
  const d = object(value, ['id','expectedVersion','name','slug','description','active'])
  return { id:identifier(d.id), expectedVersion:integer(d.expectedVersion,'versión'), name:text(d.name,'nombre'), slug:slug(d.slug), description:text(d.description,'descripción',2000,true), active:boolean(d.active) }
}
export function productInput(value: unknown): ProductInput {
  const d = object(value, ['id','expectedVersion','name','slug','sku','description','categoryId','imageUrl','costMinor','profitMinor','billingRateBps','onHand','active'])
  const imageUrl = text(d.imageUrl, 'imagen', 2000, true)
  if (imageUrl) {
    try { if (new URL(imageUrl).protocol !== 'https:') throw new Error() }
    catch { throw new HttpsError('invalid-argument', 'La imagen debe tener una URL HTTPS válida.') }
  }
  return { id:identifier(d.id), expectedVersion:integer(d.expectedVersion,'versión'), name:text(d.name,'nombre'), slug:slug(d.slug),
    sku:identifier(d.sku), description:text(d.description,'descripción',5000,true), categoryId:identifier(d.categoryId), imageUrl,
    costMinor:integer(d.costMinor,'costo'), profitMinor:integer(d.profitMinor,'ganancia'),
    billingRateBps:integer(d.billingRateBps,'porcentaje',10000), onHand:integer(d.onHand,'existencias',1000000), active:boolean(d.active) }
}
