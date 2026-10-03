import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_PRODUCT_IMAGE_BYTES, readCloudinaryEnvironment, validateProductImage } from '../src/infrastructure/cloudinary/cloudinary.ts'

test('Cloudinary accepts a public cloud name and unsigned preset', () => {
  assert.deepEqual(readCloudinaryEnvironment({
    VITE_CLOUDINARY_CLOUD_NAME: 'demo-cloud',
    VITE_CLOUDINARY_UPLOAD_PRESET: 'assets_base_unsigned',
  }), {
    configured: true,
    config: { cloudName: 'demo-cloud', uploadPreset: 'assets_base_unsigned' },
  })
})

test('Cloudinary fails closed when its public configuration is missing or malformed', () => {
  assert.equal(readCloudinaryEnvironment({}).configured, false)
  assert.equal(readCloudinaryEnvironment({
    VITE_CLOUDINARY_CLOUD_NAME: 'bad/cloud',
    VITE_CLOUDINARY_UPLOAD_PRESET: 'preset',
  }).configured, false)
})

test('product images enforce supported formats and the 10 MB limit', () => {
  assert.doesNotThrow(() => validateProductImage({ name: 'product.webp', type: 'image/webp', size: 1024 }))
  assert.throws(() => validateProductImage({ name: 'product.svg', type: 'image/svg+xml', size: 1024 }))
  assert.throws(() => validateProductImage({ name: 'large.jpg', type: 'image/jpeg', size: MAX_PRODUCT_IMAGE_BYTES + 1 }))
})
