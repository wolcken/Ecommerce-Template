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
if (args.some((arg) => arg !== '--local')) {
  console.error('Uso: yarn firebase:check [--local]')
  process.exit(1)
}

const env = loadEnv('production', root, 'VITE_')
const environment = readEnvironment(env)
check(environment.mode === 'firebase', 'Configuración de producción en modo Firebase.')

if (environment.mode === 'invalid') console.log(environment.message)
if (environment.mode !== 'firebase') process.exit(1)

check(!environment.config.projectId.startsWith('demo-'), 'Proyecto real configurado.')
check(env.VITE_USE_FIREBASE_EMULATORS !== 'true', 'Emuladores desactivados para producción.')

const firebaseConfig = JSON.parse(readFileSync(path.join(root, 'firebase.json'), 'utf8'))
check(
  !firebaseConfig.functions && !firebaseConfig.storage,
  'Configuración limitada a Firestore en el plan Spark.',
)

const versioned = spawnSync('git', ['ls-files', '--', '.env', '.env.*'], {
  cwd: root,
  encoding: 'utf8',
})
check(
  versioned.status === 0 &&
    versioned.stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .every((file) => file === '.env.example'),
  'Solo la plantilla de entorno está versionada.',
)

if (failures) process.exit(1)

console.log('Proyecto destino: ' + environment.config.projectId)

if (!args.includes('--local')) {
  const result = spawnSync(
    process.execPath,
    [
      '--use-system-ca',
      path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'),
      'projects:list',
      '--json',
      '--non-interactive',
    ],
    { cwd: root, encoding: 'utf8', timeout: 45000, maxBuffer: 4 * 1024 * 1024 },
  )

  let projects
  try {
    const jsonStart = result.stdout.indexOf('{')
    projects = JSON.parse(result.stdout.slice(jsonStart)).result
  } catch {
    // El diagnóstico permanece resumido para no mostrar datos de la sesión.
  }

  check(
    result.status === 0 &&
      Array.isArray(projects) &&
      projects.some((project) => project.projectId === environment.config.projectId),
    'Sesión CLI con acceso al proyecto destino.',
  )

  if (failures) {
    console.log(
      'Ejecuta yarn firebase login y revisa permisos o conectividad; después repite esta comprobación.',
    )
  }
}

console.log('Esta comprobación no escribe datos ni despliega recursos.')
process.exitCode = failures ? 1 : 0
