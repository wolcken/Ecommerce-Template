import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const firebase = path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js')
const result = spawnSync(
  process.execPath,
  [
    '--use-system-ca',
    firebase,
    'emulators:exec',
    '--only',
    'hosting',
    '--project',
    'demo-ecommerce-test',
    'node scripts/check-hosting.mjs',
  ],
  { cwd: root, stdio: 'inherit', env: process.env },
)
process.exitCode = result.status ?? 1
