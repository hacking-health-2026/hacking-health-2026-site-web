import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const dist = path.resolve(root, process.argv[2] || 'dist')
const html = readFileSync(path.join(dist, 'index.html'))
const router = readFileSync(path.join(root, 'src/router/index.ts'), 'utf8')
for (const [, route] of router.matchAll(/\bpath:\s*['"]([^'"]+)['"]/g)) {
  assert(
    /^\/[a-z0-9/-]*$/i.test(route) && !route.includes('..'),
    `Cannot emit static route: ${route}`,
  )
  if (route === '/') continue
  const directory = path.join(dist, route.slice(1))
  mkdirSync(directory, { recursive: true })
  writeFileSync(path.join(directory, 'index.html'), html)
  console.log(`Static route ${route}/ -> ${path.relative(root, directory)}/index.html`)
}
writeFileSync(path.join(dist, '404.html'), html)
