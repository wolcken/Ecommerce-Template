import type { BillingDetails } from '../auth/auth.models'
export interface CheckoutDetails {
  customer:{firstName:string;lastName:string;phone:string}
  billing:BillingDetails
}
function required(value:unknown,label:string,max:number) {
  if(typeof value!=='string'||!value.trim()||value.trim().length>max) throw new Error('Revisa '+label+'.')
  return value.trim()
}
export function validateCheckoutDetails(value:CheckoutDetails):CheckoutDetails {
  if(!value || !value.customer || !value.billing) throw new Error('Completa tus datos.')
  const type=value.billing.documentType
  if(type!=='NIT'&&type!=='CI') throw new Error('Selecciona NIT o CI.')
  return {
    customer:{firstName:required(value.customer.firstName,'el nombre',120),lastName:required(value.customer.lastName,'los apellidos',120),phone:required(value.customer.phone,'el teléfono',30)},
    billing:{name:required(value.billing.name,'el nombre o razón social',200),documentType:type,
      documentNumber:required(value.billing.documentNumber,'el documento',40),
      documentComplement:type==='CI' && value.billing.documentComplement?.trim()?required(value.billing.documentComplement,'el complemento',20):null},
  }
}
