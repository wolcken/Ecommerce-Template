export interface CloudinaryConfig {
  cloudName: string
  uploadPreset: string
}

export type CloudinaryEnvironment =
  | { configured: true; config: CloudinaryConfig }
  | { configured: false; message: string }

export const MAX_PRODUCT_IMAGE_BYTES = 10 * 1024 * 1024
export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const

export function readCloudinaryEnvironment(env: Record<string, unknown>): CloudinaryEnvironment {
  const cloudName = typeof env.VITE_CLOUDINARY_CLOUD_NAME === 'string' ? env.VITE_CLOUDINARY_CLOUD_NAME.trim() : ''
  const uploadPreset = typeof env.VITE_CLOUDINARY_UPLOAD_PRESET === 'string' ? env.VITE_CLOUDINARY_UPLOAD_PRESET.trim() : ''
  if (!cloudName || !uploadPreset) {
    return { configured: false, message: 'Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET.' }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName) || !/^[a-zA-Z0-9_-]+$/.test(uploadPreset)) {
    return { configured: false, message: 'La configuración pública de Cloudinary tiene un formato inválido.' }
  }
  return { configured: true, config: { cloudName, uploadPreset } }
}

export function validateProductImage(file: Pick<File, 'name' | 'size' | 'type'>) {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type as (typeof PRODUCT_IMAGE_TYPES)[number])) {
    throw new Error('Selecciona una imagen JPG, PNG, WebP o AVIF.')
  }
  if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error('La imagen debe pesar como máximo 10 MB.')
  }
  return file
}

interface CloudinaryUploadResponse {
  secure_url?: unknown
  public_id?: unknown
  error?: { message?: unknown }
}

export async function uploadProductImage(file: File, config: CloudinaryConfig) {
  validateProductImage(file)
  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', config.uploadPreset)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
    method: 'POST',
    body,
  })
  let data: CloudinaryUploadResponse = {}
  try { data = await response.json() as CloudinaryUploadResponse } catch { /* Cloudinary puede responder sin JSON en errores de red. */ }
  if (!response.ok) {
    const detail = typeof data.error?.message === 'string' ? ` ${data.error.message}` : ''
    throw new Error(`Cloudinary rechazó la imagen.${detail}`)
  }
  if (typeof data.secure_url !== 'string' || typeof data.public_id !== 'string') {
    throw new Error('Cloudinary no devolvió una URL válida para la imagen.')
  }
  const url = new URL(data.secure_url)
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') {
    throw new Error('Cloudinary devolvió una URL de imagen inesperada.')
  }
  return { secureUrl: url.toString(), publicId: data.public_id }
}

