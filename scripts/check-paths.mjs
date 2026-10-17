import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(new URL('../package.json', import.meta.url))
const dist = path.resolve(root, process.argv[2] || 'dist')
const rawBase = process.argv[3] || process.env.VITE_BASE_PATH || '/'
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
const exactNames = new Set(tracked)
const extensions = ['', '.ts', '.js', '.vue', '.css', '/index.ts', '/index.js']
let imports = 0
let resources = 0
const sourceMappings = []

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
}

function localModule(specifier, parent) {
  const candidate = specifier.startsWith('@/')
    ? path.join(root, 'src', specifier.slice(2))
    : path.resolve(path.dirname(parent), specifier)
  const found = extensions
    .map((extension) => candidate + extension)
    .find((full) => existsSync(full) && statSync(full).isFile())
  assert(found, `Missing import ${specifier} in ${path.relative(root, parent)}`)
  const relative = path.relative(root, found).split(path.sep).join('/')
  assert(exactNames.has(relative), `Import casing or Git tracking mismatch: ${relative}`)
  sourceMappings.push([path.relative(root, parent), specifier, relative])
  imports++
}

for (const file of walk(path.join(root, 'src'))) {
  if (!/\.(vue|ts|js|css)$/.test(file)) continue
  const text = readFileSync(file, 'utf8')
  const pattern = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g
  for (const [, specifier] of text.matchAll(pattern)) {
    if (specifier.startsWith('.') || specifier.startsWith('@/')) localModule(specifier, file)
    else require.resolve(specifier)
  }
  // Literal template assets and CSS url() references; dynamic URLs are API data.
  for (const match of text.matchAll(/(?:(?<![:\w-])src=["']([^"']+)["']|url\(["']?([^\s)'"\]]+)["']?\))/g)) {
    const asset = match[1] || match[2]
    if (/^(https?:|data:|#)/.test(asset)) continue
    const full = asset.startsWith('/')
      ? path.join(root, 'public', asset.slice(1))
      : path.resolve(path.dirname(file), asset)
    assert(existsSync(full), `Missing source asset: ${asset} in ${file}`)
  }
}

const entry = readFileSync(path.join(root, 'index.html'), 'utf8')
assert(entry.includes('src="/src/main.ts"'), 'Vite source entry must point to src/main.ts')
assert(existsSync(path.join(root, 'src/main.ts')))
assert(existsSync(path.join(root, 'public/favicon.ico')))
const router = readFileSync(path.join(root, 'src/router/index.ts'), 'utf8')
assert(
  router.includes('createWebHistory(import.meta.env.BASE_URL)'),
  'Router must share Vite base path',
)
const routes = [...router.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
const knownRoutes = new Set(routes)
for (const file of walk(path.join(root, 'src')).filter((file) => file.endsWith('.vue'))) {
  const text = readFileSync(file, 'utf8')
  for (const [, route] of text.matchAll(/\bto=["'](\/[^"']*)["']/g)) {
    assert(knownRoutes.has(route), `Unknown router target ${route} in ${file}`)
  }
  const ids = new Set([...text.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]))
  if (text.includes(':id="`cas-${item.id}`"')) {
    for (const [, id] of text.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)) ids.add(`cas-${id}`)
  }
  for (const [, anchor] of text.matchAll(/href=["']#([^"']+)["']/g)) {
    assert(anchor === 'main-content' || ids.has(anchor), `Missing anchor #${anchor} in ${file}`)
  }
}

function builtResource(url, parent) {
  if (/^(https?:|data:|#|\/\/)/.test(url)) return
  const clean = decodeURIComponent(url.split(/[?#]/)[0])
  const target = clean.startsWith('/')
    ? (assert(clean.startsWith(base), `Wrong deployment prefix: ${url}; expected ${base}`),
      path.join(dist, clean.slice(base.length)))
    : path.resolve(path.dirname(parent), clean)
  const relative = path.relative(dist, target)
  assert(
    relative && !relative.startsWith('..') && !path.isAbsolute(relative),
    `Resource outside build: ${url}`,
  )
  assert(
    existsSync(target) && statSync(target).isFile(),
    `Missing built resource: ${url} -> ${target}`,
  )
  resources++
}

const htmlPath = path.join(dist, 'index.html')
assert(existsSync(htmlPath), `Build not found: ${htmlPath}`)
const html = readFileSync(htmlPath, 'utf8')
for (const route of routes.filter((route) => route !== '/')) {
  assert.equal(
    readFileSync(path.join(dist, route.slice(1), 'index.html'), 'utf8'),
    html,
    `Static route ${route} must contain the same application entry`,
  )
}
assert.equal(
  readFileSync(path.join(dist, '404.html'), 'utf8'),
  html,
  'Pages fallback must share the build entry',
)
assert(!html.includes('/src/main.ts'), 'Build must not point to uncompiled source')
for (const [, url] of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) builtResource(url, htmlPath)
for (const file of walk(dist).filter((file) => file.endsWith('.css'))) {
  for (const [, url] of readFileSync(file, 'utf8').matchAll(/url\(["']?([^\s)'"\]]+)["']?\)/g))
    builtResource(url, file)
}
for (const file of walk(path.join(root, 'public'))) {
  const relative = path.relative(path.join(root, 'public'), file)
  assert.deepEqual(
    readFileSync(path.join(dist, relative)),
    readFileSync(file),
    `Public file differs: ${relative}`,
  )
}

console.log(`OK: ${imports} local imports with exact Git casing; external modules resolved.`)
console.log(`OK: routes ${routes.join(', ')}; local links and anchors mapped.`)
console.log(`OK: ${resources} built resource references; public files identical; base ${base}.`)
if (process.env.PATH_AUDIT_VERBOSE === '1') {
  for (const mapping of sourceMappings) console.log(mapping.join(' -> '))
}
