import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const inheritedPath = process.env.PATH ?? ''
const env = {...process.env}
for (const key of Object.keys(env)) if (key.toLowerCase() === 'path') delete env[key]
env.PATH = path.dirname(process.execPath) + path.delimiter + inheritedPath
const bundledJava = 'C:/Program Files/Android/Android Studio/jbr/bin'
if (!env.JAVA_HOME && existsSync(path.join(bundledJava,'java.exe'))) {
  env.JAVA_HOME=path.dirname(bundledJava)
  env.PATH=bundledJava+path.delimiter+(env.PATH??'')
}
const args = process.argv.includes('--start')
  ? ['emulators:start','--only','auth,firestore,functions','--project','demo-ecommerce-test']
  : ['emulators:exec','--only','auth,firestore,functions','--project','demo-ecommerce-test','node --test functions/tests/integration.test.mjs']
const child = spawn(process.execPath,['node_modules/firebase-tools/lib/bin/firebase.js',...args],{stdio:'inherit',env})
child.on('exit',code=>process.exitCode=code??1)
