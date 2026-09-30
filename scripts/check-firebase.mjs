import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { loadEnv } from 'vite'
import { readEnvironment } from '../src/infrastructure/firebase/environment.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
process.chdir(root)
let failures = 0
function check(ok, message) {
  console.log((ok ? 'OK: ' : 'PENDIENTE: ') + message)
  if (!ok) failures++
}
const args = process.argv.slice(2)
if (args.some(arg => arg !== '--local')) {
  console.error('Uso: yarn firebase:check [--local]')
  process.exit(1)
}
const env = loadEnv('production', root, 'VITE_')
const config = readEnvironment(env)
check(config.mode === 'firebase', 'Configuración de producción en modo Firebase.')
if (config.mode === 'invalid') console.log(config.message)
if (config.mode !== 'firebase') process.exit(1)
check(!config.config.projectId.startsWith('demo-'), 'Proyecto real configurado.')
check(env.VITE_USE_FIREBASE_EMULATORS !== 'true', 'Emuladores desactivados para producción.')
const source = readFileSync(path.join(root, 'functions/src/index.ts'), 'utf8')
const backendRegion = source.match(/region:\s*'([^']+)'/)?.[1]
check(Boolean(backendRegion) && (env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1') === backendRegion,
  'Región del frontend alineada con las funciones.')
const versioned = spawnSync('git', ['ls-files', '--', '.env', '.env.*'], {cwd:root, encoding:'utf8'})
check(versioned.status === 0 && versioned.stdout.trim().split(/\r?\n/).filter(Boolean).every(file => file === '.env.example'),
  'Solo la plantilla de entorno está versionada.')
if (failures) process.exit(1)
console.log('Proyecto destino: ' + config.config.projectId)
console.log('Región: ' + backendRegion)
if (!args.includes('--local')) {
  // Capturar y resumir; nunca imprimir respuestas o errores con credenciales.
  const result = spawnSync(process.execPath,
    ['--use-system-ca', path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'), 'projects:list', '--json', '--non-interactive'],
    {cwd:root, encoding:'utf8', timeout:45000, maxBuffer:4*1024*1024})
  let projects
  try { projects = JSON.parse(result.stdout).result } catch { /* Diagnóstico resumido debajo. */ }
  check(result.status === 0 && Array.isArray(projects) && projects.some(p => p.projectId === config.config.projectId),
    'Sesión CLI con acceso al proyecto destino.')
  if (failures) console.log('Ejecuta yarn firebase login y revisa permisos/conectividad; después repite esta comprobación.')
}
console.log('Esta comprobación no despliega ni verifica facturación, roles ADMIN o funcionamiento de servicios publicados.')
process.exitCode = failures ? 1 : 0
