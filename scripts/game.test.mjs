import test from 'node:test'
import assert from 'node:assert/strict'
import { clearIncorrectPairs, connectPair, gameCases } from '../src/data/game.ts'

test('selecting again clears failed connections and preserves solved pairs', () => {
  const pairs = { ciclosporine: 'ciclosporine', sertraline: 'levothyroxine', digoxine: 'digoxine' }
  assert.deepEqual(clearIncorrectPairs(pairs), {
    ciclosporine: 'ciclosporine',
    digoxine: 'digoxine',
  })
  assert.equal(pairs.sertraline, 'levothyroxine')
  assert.deepEqual(clearIncorrectPairs({}), {})
})

test('reassigning an ingredient frees its previous medicine without mutating state', () => {
  const previous = { ciclosporine: 'warfarine', sertraline: 'sertraline' }
  assert.deepEqual(connectPair(previous, 'sertraline', 'warfarine'), { sertraline: 'warfarine' })
  assert.deepEqual(previous, { ciclosporine: 'warfarine', sertraline: 'sertraline' })
})

test('changing one connection preserves all unrelated connections', () => {
  assert.deepEqual(
    connectPair(
      { ciclosporine: 'warfarine', sertraline: 'sertraline' },
      'ciclosporine',
      'ciclosporine',
    ),
    {
      ciclosporine: 'ciclosporine',
      sertraline: 'sertraline',
    },
  )
})

test('five distinct cases provide sourced ingredient discoveries', () => {
  assert.equal(gameCases.length, 5)
  assert.equal(new Set(gameCases.map((c) => c.id)).size, 5)
  assert.equal(new Set(gameCases.map((c) => c.ingredient)).size, 5)
  assert.deepEqual(new Set(gameCases.map((c) => c.risk)), new Set([true, false]))
  for (const item of gameCases) {
    assert.ok(item.foundIn && item.active)
    assert.equal(new URL(item.url).protocol, 'https:')
    assert.equal(new URL(item.originUrl).protocol, 'https:')
  }
})
