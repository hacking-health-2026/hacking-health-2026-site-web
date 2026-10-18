import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { parse, compileScript } from '@vue/compiler-sfc'
import ts from 'typescript'
import { Window } from 'happy-dom'

const window = new Window({ url: 'https://example.test/' })
for (const key of [
  'window',
  'document',
  'Node',
  'Element',
  'HTMLElement',
  'SVGElement',
  'ResizeObserver',
]) {
  Object.defineProperty(globalThis, key, {
    value: key === 'window' ? window : window[key],
    configurable: true,
  })
}
const { createApp, nextTick } = await import('vue')
const root = fileURLToPath(new URL('../', import.meta.url))
const temporaryRoot = path.join(root, 'node_modules/.tmp')
mkdirSync(temporaryRoot, { recursive: true })
const temporary = mkdtempSync(path.join(temporaryRoot, 'game-interaction-test-'))

function compile(relativePath, replacements = []) {
  let source = readFileSync(path.join(root, relativePath), 'utf8')
    .replace(
      "import NexusIcon from '@/components/NexusIcon.vue'",
      'const NexusIcon = { render: () => null }',
    )
    .replace("import NexusIcon from './NexusIcon.vue'", 'const NexusIcon = { render: () => null }')
    .replace(
      "import BillyMascot from '@/components/BillyMascot.vue'",
      'const BillyMascot = { render: () => null }',
    )
    .replace('import.meta.env.BASE_URL', "'/'")
  for (const [from, to] of replacements) source = source.replace(from, to)
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, {
    id: path.basename(relativePath),
    inlineTemplate: true,
  })
  const output = ts.transpileModule(compiled.content, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  const modulePath = path.join(temporary, `${path.basename(relativePath, '.vue')}.mjs`)
  writeFileSync(modulePath, output)
  return pathToFileURL(modulePath).href
}
const coachUrl = compile('src/components/GameCoach.vue')
const gameUrl = compile('src/views/GameView.vue', [
  ["from '@/data/game'", `from '${pathToFileURL(path.join(root, 'src/data/game.ts')).href}'`],
  ["import { workbookUrl } from '@/services/api'", 'const workbookUrl = path => path'],
  ["import GameCoach from '@/components/GameCoach.vue'", `import GameCoach from '${coachUrl}'`],
])
const { default: GameView } = await import(gameUrl)
after(async () => {
  await window.happyDOM.abort()
  window.close()
  assert.equal(path.dirname(temporary), temporaryRoot)
  rmSync(temporary, { recursive: true, force: true })
})

test('mistakes keep the chosen sample active for retries; only solved cards are locked', async () => {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(GameView)
  app.config.errorHandler = (error) => {
    throw error
  }
  app.mount(host)
  const settle = async () => {
    await nextTick()
    await nextTick()
  }
  try {
    await settle()
    const samples = [...host.querySelectorAll('[data-medicine]')]
    const id = samples[0].getAttribute('data-medicine')
    const correctFruit = host.querySelector(`[data-component="${id}"]`)
    const wrongFruits = [...host.querySelectorAll('[data-component]')].filter(
      (el) => el !== correctFruit,
    )
    assert.equal(host.querySelectorAll('[aria-pressed="true"]').length, 0)
    samples[0].click()
    await settle()
    wrongFruits[0].click()
    await settle()
    assert.equal(samples[0].getAttribute('aria-pressed'), 'true')
    assert.equal(samples[0].disabled, false)
    assert.equal(wrongFruits[0].disabled, false)
    assert.equal(correctFruit.disabled, false)
    assert.equal(host.querySelectorAll('.sample-card.correct').length, 0)
    assert.equal(host.querySelectorAll('.wire-incorrect').length, 1)
    assert.match(host.querySelector('.coach').textContent, /Ce n’est pas la relation recherchée/)

    // The user can click another fruit immediately, without reselecting the sample.
    wrongFruits[1].click()
    await settle()
    assert.equal(samples[0].getAttribute('aria-pressed'), 'true')
    assert.equal(host.querySelectorAll('.sample-card.correct').length, 0)
    correctFruit.click()
    await settle()
    assert.equal(samples[0].disabled, true)
    assert.equal(correctFruit.disabled, true)
    assert.equal(host.querySelectorAll('.sample-card.correct').length, 1)
    assert.equal(host.querySelectorAll('.wire-incorrect').length, 0)
    assert.equal(host.querySelectorAll('[aria-pressed="true"]').length, 0)
    samples[1].click()
    await settle()
    assert.equal(samples[1].getAttribute('aria-pressed'), 'true')
    assert.equal(correctFruit.disabled, true, 'solved components cannot be reassigned')
    assert.ok(
      wrongFruits.some((el) => !el.disabled),
      'unsolved components stay available',
    )
  } finally {
    app.unmount()
    host.remove()
  }
})
