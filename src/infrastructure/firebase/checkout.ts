import { httpsCallable, type Functions } from 'firebase/functions'
import type { CheckoutPreview, CheckoutPreviewService, PreviewInput } from '../../features/orders/preview.models'

export function createCheckoutPreviewService(functions: Functions): CheckoutPreviewService {
  return {
    async preview(input: PreviewInput) {
      try {
        return (await httpsCallable<PreviewInput, CheckoutPreview>(functions, 'previewCheckout')(input)).data
      } catch (error) {
        const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
        if (['functions/unauthenticated', 'functions/invalid-argument', 'functions/failed-precondition'].includes(code) && error instanceof Error) {
          throw new Error(error.message, {cause:error})
        }
        throw new Error('No se pudo cotizar. Verifica la conexión y que el backend esté publicado; después intenta nuevamente.', {cause:error})
      }
    },
  }
}
