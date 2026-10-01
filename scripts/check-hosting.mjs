import { readFile } from 'node:fs/promises'

const config = JSON.parse(await readFile('firebase.json', 'utf8'))
const configuredHeaders = config.hosting?.headers?.flatMap((rule) => rule.headers ?? []) ?? []
if (!configuredHeaders.some((header) => header.key === 'X-Content-Type-Options' && header.value === 'nosniff')) {
  throw new Error('firebase.json no contiene la cabecera nosniff.')
}

const origin = 'http://127.0.0.1:5000'
for (const route of ['/', '/mis-solicitudes', '/admin/solicitudes']) {
  const response = await fetch(origin + route)
  const body = await response.text()
  if (!response.ok || !body.includes('<div id="root"></div>')) {
    throw new Error(`Hosting no sirvió la SPA en ${route}.`)
  }
}

console.log('Hosting Emulator: SPA rewrites OK; security headers configured.')
