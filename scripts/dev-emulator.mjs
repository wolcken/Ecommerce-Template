import { spawn } from 'node:child_process'
const env={...process.env,VITE_DATA_SOURCE:'firebase',VITE_USE_FIREBASE_EMULATORS:'true',
 VITE_FIREBASE_API_KEY:'demo-key',VITE_FIREBASE_AUTH_DOMAIN:'demo-ecommerce-test.firebaseapp.com',
 VITE_FIREBASE_PROJECT_ID:'demo-ecommerce-test',VITE_FIREBASE_STORAGE_BUCKET:'demo-ecommerce-test.appspot.com',
 VITE_FIREBASE_MESSAGING_SENDER_ID:'123456',VITE_FIREBASE_APP_ID:'demo-app',VITE_FIREBASE_FUNCTIONS_REGION:'us-central1'}
const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5174','--strictPort'],{stdio:'inherit',env})
child.on('exit',code=>process.exitCode=code??1)
