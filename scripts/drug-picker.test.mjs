import test, { after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { parse, compileScript } from '@vue/compiler-sfc'
import ts from 'typescript'
import { Window } from 'happy-dom'

// Component/event regression tests, not emulation of a physical iPhone browser.
const window = new Window({ url: 'https://example.test/' })
for (const key of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'SVGElement']) {
  Object.defineProperty(globalThis, key, {
    value: key === 'window' ? window : window[key],
    configurable: true,
  })
}
const { createApp, h, reactive, nextTick } = await import('vue')
const root = fileURLToPath(new URL('../', import.meta.url))
const temporaryRoot = path.join(root, 'node_modules/.tmp')
mkdirSync(temporaryRoot, { recursive: true })
const temporary = mkdtempSync(path.join(temporaryRoot, 'drug-picker-test-'))
let source = readFileSync(path.join(root, 'src/components/DrugPicker.vue'), 'utf8')
source = source
  .replace(
    "import { searchWorkbookProducts, type Drug } from '@/services/api'",
    `import { searchRelatedProducts as searchWorkbookProducts } from '${pathToFileURL(path.join(root, 'src/services/staticDemo.ts')).href}'`,
  )
  .replace(
    "import NexusIcon from '@/components/NexusIcon.vue'",
    'const NexusIcon = { render: () => null }',
  )
const { descriptor } = parse(source)
const compiled = compileScript(descriptor, { id: 'picker-regression', inlineTemplate: true })
const javascript = ts.transpileModule(compiled.content, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const modulePath = path.join(temporary, 'DrugPicker.mjs')
writeFileSync(modulePath, javascript)
const { default: DrugPicker } = await import(pathToFileURL(modulePath).href)
let cleanup
afterEach(() => cleanup?.())
after(async () => {
  await window.happyDOM.abort()
  window.close()
  assert.equal(path.dirname(temporary), temporaryRoot)
  rmSync(temporary, { recursive: true, force: true })
})

function mountPicker(initial = {}) {
  const state = reactive({ selected: null, relatedTo: [], ...initial })
  const emitted = []
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({
    render: () =>
      h(DrugPicker, {
        id: 'test-product',
        label: 'Produit 1',
        selected: state.selected,
        relatedTo: state.relatedTo,
        onSelect: (drug) => {
          emitted.push(drug)
          state.selected = drug
        },
      }),
  })
  app.config.errorHandler = (error) => {
    throw error
  }
  app.mount(host)
  const input = host.querySelector('input')
  const options = () => [...host.querySelectorAll('[role="option"]')]
  const type = async (text) => {
    input.value = text
    input.dispatchEvent(new window.Event('input', { bubbles: true }))
    await nextTick()
  }
  cleanup = () => {
    app.unmount()
    host.remove()
    cleanup = undefined
  }
  return { state, emitted, host, input, options, type }
}

for (const pointerType of ['touch', 'pen', 'mouse']) {
  test(`${pointerType}: selection survives focusout with a null destination before click`, async () => {
    const picker = mountPicker()
    await picker.type('Leeloo')
    const option = picker.options()[0]
    assert.ok(option)
    assert.equal(option.tagName, 'BUTTON')
    assert.equal(option.type, 'button')
    const down = new window.PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType,
    })
    option.dispatchEvent(down)
    assert.equal(down.defaultPrevented, false, 'scrolling and touch clicks must not be cancelled')
    picker.input.dispatchEvent(
      new window.FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
    )
    await nextTick()
    assert.equal(picker.options().length, 1, 'option must still exist until activation')
    option.dispatchEvent(new window.PointerEvent('pointerup', { bubbles: true, pointerType }))
    option.click()
    await nextTick()
    assert.equal(picker.state.selected.id, 'MED-005')
    assert.equal(picker.input.value, 'Leeloo Gé')
    assert.equal(picker.emitted.length, 1)
    assert.equal(picker.options().length, 0)
    picker.state.selected.components[0].amount_mg = 999
    await picker.type('Leeloo')
    picker.options()[0].click()
    await nextTick()
    assert.equal(
      picker.state.selected.components[0].amount_mg,
      0.1,
      'each selection owns its composition',
    )
  })
}

test('a touch scroll and pointer cancellation do not select a product', async () => {
  const picker = mountPicker()
  await picker.type('')
  const option = picker.options()[0]
  for (const event of ['pointerdown', 'pointermove', 'pointercancel']) {
    option.dispatchEvent(
      new window.PointerEvent(event, { pointerType: 'touch', bubbles: true, cancelable: true }),
    )
  }
  await nextTick()
  assert.equal(picker.state.selected, null)
  assert.equal(picker.emitted.length, 0)
  assert.ok(picker.options().length > 0)
})

test('a click without pointer events activates the native option', async () => {
  const picker = mountPicker()
  await picker.type('Xanax')
  picker.input.dispatchEvent(
    new window.FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
  )
  await nextTick()
  picker.options()[0].click()
  await nextTick()
  assert.equal(picker.state.selected.id, 'MED-041')
})

test('the dropdown arrow opens and closes without clearing the chosen product', async () => {
  const picker = mountPicker()
  const toggle = picker.host.querySelector('.dropdown-toggle')
  toggle.click()
  await nextTick()
  assert.equal(picker.input.getAttribute('aria-expanded'), 'true')
  await picker.type('Leeloo')
  picker.options()[0].click()
  await nextTick()
  toggle.click()
  await nextTick()
  assert.ok(picker.options().length > 0)
  assert.equal(picker.state.selected.id, 'MED-005')
  toggle.click()
  await nextTick()
  assert.equal(picker.options().length, 0)
  assert.equal(picker.input.value, 'Leeloo Gé')
})

test('keyboard arrows and Enter select, while Escape and Tab only close', async () => {
  const picker = mountPicker()
  await picker.type('Leeloo')
  picker.input.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
  )
  await nextTick()
  assert.ok(picker.input.getAttribute('aria-activedescendant'))
  picker.input.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  )
  await nextTick()
  assert.equal(picker.state.selected.id, 'MED-005')
  await picker.type('Xanax')
  picker.input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await nextTick()
  assert.equal(picker.options().length, 0)
  assert.equal(picker.state.selected, null)
  await picker.type('Xanax')
  picker.input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
  await nextTick()
  assert.equal(picker.options().length, 0)
  assert.equal(picker.state.selected, null)
})

test('Enter during text composition must not select a suggestion', async () => {
  const picker = mountPicker()
  await picker.type('Leeloo')
  picker.input.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
  )
  await nextTick()
  assert.equal(picker.state.selected, null)
})

test('outside activation closes the list and typing never selects an invented product', async () => {
  const picker = mountPicker()
  await picker.type('Leeloo')
  document.body.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true }))
  await nextTick()
  assert.equal(picker.options().length, 0)
  await picker.type('produit imaginaire 123')
  assert.equal(picker.options().length, 0)
  assert.equal(picker.state.selected, null)
  await picker.type('Leeloo')
  document.body.click()
  await nextTick()
  assert.equal(picker.options().length, 0)
})

test('the following picker keeps only workbook products related to the previous choice', async () => {
  const picker = mountPicker({ relatedTo: ['MED-005'] })
  await picker.type('Millepertuis')
  assert.ok(picker.options().length > 0)
  picker.options()[0].click()
  await nextTick()
  assert.equal(picker.state.selected.id, 'SUP-006')
  await picker.type('Leeloo')
  assert.equal(picker.options().length, 0)
})

test('no documented interaction displays an explanation and lets the user choose another catalogue product', async () => {
  const picker = mountPicker({ relatedTo: ['SUP-038'] })
  await picker.type('')
  assert.match(picker.host.querySelector('.no-relations').textContent, /Aucune correspondance/)
  assert.match(
    picker.host.querySelector('.no-relations').textContent,
    /sélectionner d’autres produits/,
  )
  assert.match(
    picker.host.querySelector('.no-relations').textContent,
    /ne signifie pas une absence de danger/,
  )
  assert.equal(
    picker.options().length,
    99,
    'the previous product is excluded from the full catalogue',
  )
  await picker.type('Aloe Vera jus à boire')
  assert.equal(picker.options().length, 0, 'the same product cannot be chosen twice')
  assert.ok(picker.host.querySelector('.no-results'))
  await picker.type('Leeloo')
  picker.options()[0].click()
  await nextTick()
  assert.equal(picker.state.selected.id, 'MED-005')
})

test('changing to a product with documented interactions restores the related-product filter', async () => {
  const picker = mountPicker({ relatedTo: ['SUP-038'] })
  await picker.type('Leeloo')
  assert.equal(picker.options().length, 1)
  picker.state.relatedTo = ['MED-005']
  await nextTick()
  assert.equal(picker.host.querySelector('.no-relations'), null)
  assert.equal(picker.options().length, 0)
  await picker.type('Millepertuis')
  assert.ok(picker.options().length > 0)
  assert.equal(picker.host.querySelector('.no-results'), null)
})
