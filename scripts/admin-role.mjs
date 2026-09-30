import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const auth = require('../node_modules/firebase-tools/lib/auth.js')
const scopes = require('../node_modules/firebase-tools/lib/scopes.js')
const allowed = new Set(['--project','--uid','--email','--grant'])
const args = process.argv.slice(2)
if (args.some(arg => arg.startsWith('--') && !allowed.has(arg))) usage()
function value(name) {
  const index=args.indexOf(name)
  if(index<0 || !args[index+1] || args[index+1].startsWith('--')) usage()
  return args[index+1]
}
function usage() {
  console.error('Uso: yarn firebase:admin --project ID --uid UID --email CORREO [--grant]')
  process.exit(1)
}
const project=value('--project'), uid=value('--uid'), expectedEmail=value('--email').toLowerCase()
if(!/^[a-z0-9-]{6,30}$/.test(project) || !/^[A-Za-z0-9_-]{20,128}$/.test(uid) || !expectedEmail.includes('@')) usage()
const account=auth.getGlobalDefaultAccount()
if(!account?.tokens?.refresh_token) throw new Error('Inicia sesión con yarn firebase login.')
const token=await auth.getAccessToken(account.tokens.refresh_token,[
  scopes.EMAIL,scopes.OPENID,scopes.CLOUD_PROJECTS_READONLY,scopes.FIREBASE_PLATFORM,scopes.CLOUD_PLATFORM,
])
async function request(action,body) {
  const response=await fetch('https://identitytoolkit.googleapis.com/v1/projects/'+project+'/accounts:'+action,{
    method:'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},
    body:JSON.stringify(body),signal:AbortSignal.timeout(30000),
  })
  const data=await response.json()
  if(!response.ok) throw new Error('Firebase rechazó la operación: '+(data.error?.status ?? response.status))
  return data
}
const lookup=await request('lookup',{localId:[uid]})
const user=lookup.users?.[0]
if(!user || user.localId!==uid) throw new Error('El UID no existe en el proyecto indicado.')
if(String(user.email??'').toLowerCase()!==expectedEmail) throw new Error('El UID no corresponde al correo esperado.')
let claims={}
if(user.customAttributes) {
  try { claims=JSON.parse(user.customAttributes) } catch { throw new Error('La cuenta tiene claims que no se pueden interpretar con seguridad.') }
}
if(args.includes('--grant')) {
  await request('update',{localId:uid,customAttributes:JSON.stringify({...claims,admin:true})})
  claims={...claims,admin:true}
}
console.log(JSON.stringify({project,uid,email:user.email,emailVerified:user.emailVerified===true,admin:claims.admin===true,changed:args.includes('--grant')},null,2))
