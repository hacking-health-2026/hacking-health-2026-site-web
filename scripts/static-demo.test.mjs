import test from 'node:test'
import assert from 'node:assert/strict'
import fixtures from './fixtures/static-demo-parity.json' with { type: 'json' }
import {
  assessStaticProducts,
  searchStaticProducts,
  staticProfileOptions,
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
  assert.equal(matches[0].id, 'SUP-029')
  matches[0].components[0].amount_mg = 999
  assert.equal(searchStaticProducts('melatonine')[0].components[0].amount_mg, 1)
  assert.ok(staticProfileOptions().conditions.includes('Grossesse'))
})
