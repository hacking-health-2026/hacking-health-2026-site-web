import test from 'node:test'
import assert from 'node:assert/strict'
import fixtures from './fixtures/static-demo-parity.json' with { type: 'json' }
import matrix from './fixtures/static-demo-matrix.json' with { type: 'json' }
import {
  assessStaticProducts,
  searchStaticProducts,
  staticProfileOptions,
  searchRelatedProducts,
} from '../src/services/staticDemo.ts'

for (const [index, fixture] of fixtures.entries()) {
  test(`browser simulation matches Python assessment ${index + 1}`, () => {
    const { drug_ids, profile, intakes } = fixture.input
    const result = assessStaticProducts(drug_ids, profile, intakes)
    for (const key of [
      'drugs',
      'pairs',
      'risk_matrix',
      'status',
      'calculation',
      'profile_alerts',
      'ingredient_relations',
      'quantity_coverage',
      'algorithm',
      'source',
      'notice',
    ]) {
      assert.deepEqual(result[key], fixture.expected[key], key)
    }
    assert.equal(result.coverage.total_pairs, fixture.expected.coverage.total_pairs)
    assert.equal(result.coverage.classified_pairs, fixture.expected.coverage.classified_pairs)
    assert.equal(result.coverage.unknown_pairs, fixture.expected.coverage.unknown_pairs)
  })
}

test('unknown products, duplicate IDs and invalid input are rejected', () => {
  const profile = { age: 35, weight_kg: 70, conditions: [] }
  assert.throws(() => assessStaticProducts(['UNKNOWN', 'MED-041'], profile))
  assert.throws(() => assessStaticProducts(['MED-041', 'MED-041'], profile))
  assert.throws(() => assessStaticProducts(['MED-041', 'SUP-029'], { ...profile, age: 200 }))
  assert.throws(() =>
    assessStaticProducts(['MED-041', 'SUP-029'], profile, [
      { product_id: 'MED-041', units_per_day: -1, components: [] },
    ]),
  )
  assert.throws(() =>
    assessStaticProducts(['MED-041', 'SUP-029'], profile, [
      {
        product_id: 'MED-041',
        units_per_day: 1,
        components: [{ component_id: 'INVENTED', amount_mg: 10 }],
      },
    ]),
  )
})

test('search is accent-insensitive and returned data cannot mutate the catalogue', () => {
  const matches = searchStaticProducts('melatonine')
  const supplement = matches.find((p) => p.id === 'SUP-029')
  assert.ok(supplement)
  supplement.components[0].amount_mg = 999
  assert.equal(
    searchStaticProducts('melatonine').find((p) => p.id === 'SUP-029').components[0].amount_mg,
    1,
  )
  assert.ok(staticProfileOptions().conditions.includes('Grossesse'))
})

test('dropdown catalogue contains only the 50 medicine and 50 supplement workbook rows', () => {
  const products = searchStaticProducts('')
  assert.equal(products.length, 100)
  assert.equal(products.filter((p) => p.kind === 'medicine').length, 50)
  assert.equal(products.filter((p) => p.kind === 'supplement').length, 50)
  assert.ok(products.every((p) => /^(MED|SUP)-\d+$/.test(p.id)))
  assert.equal(searchStaticProducts('not-a-real-product').length, 0)
})

test('all 4,950 workbook product pairs match the Python matrix, including unknown associations', () => {
  assert.equal(matrix.length, 4950)
  const profile = { age: null, weight_kg: null, conditions: [] }
  for (const fixture of matrix) {
    const result = assessStaticProducts(fixture.ids, profile)
    assert.equal(result.status, fixture.status, fixture.ids.join('+'))
    assert.equal(result.calculation.score, fixture.score)
    assert.deepEqual(
      result.pairs[0].rules.map((rule) => rule.id),
      fixture.rules,
    )
    assert.equal(result.ingredient_relations.length, fixture.relations)
  }
})

test('following choices contain exactly known interaction neighbours, in either direction', () => {
  const products = searchStaticProducts('')
  assert.equal(searchRelatedProducts('').length, 100)
  for (const product of products) {
    const expected = matrix
      .filter((p) => p.rules.length && p.ids.includes(product.id))
      .flatMap((p) => p.ids.filter((id) => id !== product.id))
      .sort()
    assert.deepEqual(
      searchRelatedProducts('', [product.id])
        .map((p) => p.id)
        .sort(),
      expected,
    )
  }
  const ids = ['MED-005', 'SUP-006']
  const expected = matrix
    .filter((p) => p.rules.length && p.ids.some((id) => ids.includes(id)))
    .flatMap((p) => p.ids)
    .filter((id) => !ids.includes(id))
  assert.deepEqual(
    searchRelatedProducts('', ids)
      .map((p) => p.id)
      .sort(),
    [...new Set(expected)].sort(),
  )
  assert.deepEqual(searchRelatedProducts('', ['UNKNOWN']), [])
  assert.deepEqual(searchRelatedProducts('not-a-real-product', ids), [])
})
