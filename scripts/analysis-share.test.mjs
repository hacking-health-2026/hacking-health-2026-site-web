import test from 'node:test'
import assert from 'node:assert/strict'
import QRCode from 'qrcode'
import { analysisPdf } from '../src/services/analysisPdf.ts'
import { PDFDocument } from 'pdf-lib'
import fixtures from './fixtures/static-demo-parity.json' with { type: 'json' }
import { encodeAnalysis, decodeAnalysis } from '../src/services/analysisShare.ts'
import { assessStaticProducts } from '../src/services/staticDemo.ts'

test('shared analyses preserve products, quantities, profile and assessment', () => {
  for (const fixture of fixtures.filter(
    (f) => f.input.intakes && f.input.profile.conditions.length <= 1,
  )) {
    const input = {
      profile: fixture.input.profile,
      intakes: fixture.expected.drugs.map((d) => ({
        product_id: d.id,
        units_per_day: d.units_per_day,
        components: d.components.map((c) => ({ component_id: c.id, amount_mg: c.amount_mg })),
      })),
    }
    const token = encodeAnalysis(input)
    const restored = decodeAnalysis(token)
    const intakes = restored.products.map(({ product, units }) => ({
      product_id: product.id,
      units_per_day: units,
      components: product.components.map((c) => ({ component_id: c.id, amount_mg: c.amount_mg })),
    }))
    const result = assessStaticProducts(
      restored.products.map(({ product }) => product.id),
      restored.profile,
      intakes,
    )
    assert.equal(result.status, fixture.expected.status)
    assert.equal(result.calculation.score, fixture.expected.calculation.score)
    const quantities = (drugs) =>
      drugs.map((d) => ({
        id: d.id,
        units: d.units_per_day,
        components: d.components.map((c) => ({
          id: c.id,
          amount: c.amount_mg,
          daily: c.daily_mg,
          origin: c.quantity_origin,
        })),
      }))
    assert.deepEqual(quantities(result.drugs), quantities(fixture.expected.drugs))
    const qr = QRCode.create(
      `https://hacking-health-2026.github.io/hacking-health-2026-site-web/utilisation/#analyse=${token}`,
      { errorCorrectionLevel: 'M' },
    )
    assert.ok(qr.modules.size <= 177)
  }
})

test('invalid links, unknown product IDs, stale sources and invalid quantities fail closed', () => {
  for (const token of [
    'bad',
    '',
    'x'.repeat(6001),
    btoa(JSON.stringify({ v: 99 })),
    btoa(JSON.stringify({ v: 1, s: 'old', p: [30, 65, []], d: [] })),
  ])
    assert.throws(() => decodeAnalysis(token))
  const input = structuredClone(fixtures[0].input)
  input.intakes[0].product_id = 'NOT-IN-WORKBOOK'
  assert.throws(() => encodeAnalysis(input))
  input.intakes[0].product_id = input.intakes[1].product_id
  assert.throws(() => encodeAnalysis(input))
})

test('the downloaded report is a readable PDF for different profiles and quantities', async () => {
  for (const fixture of [fixtures[0], fixtures[9], fixtures.at(-1)]) {
    const bytes = await analysisPdf(fixture.expected, fixture.input.profile)
    assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-')
    const document = await PDFDocument.load(bytes)
    assert.ok(document.getPageCount() >= 1)
    assert.equal(document.getTitle(), 'Bilan Herbal Nexus')
    assert.ok(document.getSubject().includes(fixture.expected.status))
  }
})

test('products with missing quantities remain shareable and invalid quantities are rejected', () => {
  const input = {
    profile: { age: null, weight_kg: null, conditions: [] },
    intakes: fixtures[0].expected.drugs.map((d) => ({
      product_id: d.id,
      units_per_day: 1,
      components: d.components.map((c) => ({ component_id: c.id, amount_mg: null })),
    })),
  }
  assert.equal(decodeAnalysis(encodeAnalysis(input)).products.length, 2)
  input.intakes[0].components[0].amount_mg = -1
  assert.throws(() => encodeAnalysis(input))
  input.intakes[0].components[0].amount_mg = null
  input.intakes[0].units_per_day = 0
  assert.throws(() => encodeAnalysis(input))
})
