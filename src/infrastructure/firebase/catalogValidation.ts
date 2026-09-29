import type { CategoryRecord, PublicProduct } from '../../features/catalog/catalog.models'

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') throw new Error('Documento inválido')
  return value as Record<string, unknown>
}
function text(value: unknown, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) throw new Error('Texto inválido')
  return value
}
function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Entero inválido')
  return value
}
function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Booleano inválido')
  return value
}
function instant(value: unknown): string {
  const object = typeof value === 'object' && value !== null ? value : null
  const date = object && 'toDate' in object && typeof object.toDate === 'function' ? object.toDate() : new Date(text(value))
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new Error('Fecha inválida')
  return date.toISOString()
}
function metadata(data: Record<string, unknown>) {
  return { createdAt: instant(data.createdAt), updatedAt: instant(data.updatedAt), version: integer(data.version) }
}
function slug(value: unknown) {
  const result = text(value)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) throw new Error('Slug inválido')
  return result
}
export function parseCategory(id: string, value: unknown): CategoryRecord {
  const d = record(value)
  return { id, ...metadata(d), name: text(d.name), slug: slug(d.slug), description: text(d.description, true),
    parentId: d.parentId === null ? null : text(d.parentId), active: bool(d.active), position: integer(d.position) }
}
export function parseProduct(id: string, value: unknown): PublicProduct {
  const d = record(value)
  if (d.currency !== 'BOB' || !['AVAILABLE', 'UNAVAILABLE'].includes(String(d.availability)) || !Array.isArray(d.images)) throw new Error('Producto inválido')
  const images = d.images.map(value => {
    const image = record(value)
    const url = text(image.url)
    if (new URL(url).protocol !== 'https:') throw new Error('URL de imagen inválida')
    return { url, alt: text(image.alt, true), position: integer(image.position) }
  }).sort((a, b) => a.position - b.position)
  // Proyección explícita: campos inesperados nunca se propagan a componentes.
  return { id, ...metadata(d), slug: slug(d.slug), sku: text(d.sku), name: text(d.name),
    description: text(d.description, true), categoryId: text(d.categoryId), images,
    priceMinor: integer(d.priceMinor), priceVersion: integer(d.priceVersion), currency: 'BOB',
    availability: d.availability as PublicProduct['availability'], active: bool(d.active), featured: bool(d.featured) }
}
