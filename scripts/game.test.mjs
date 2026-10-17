import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clearIncorrectPairs,
  connectPair,
  createGame,
  gamePool,
  shuffle,
} from '../src/data/game.ts'

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

function seeded(seed) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
}

test('rounds contain five dataset pairs with a unique, unambiguous solution', () => {
  const signatures = new Set()
  let previous = []
  for (let seed = 1; seed <= 200; seed++) {
    const round = createGame(previous, seeded(seed))
    assert.equal(round.length, 5)
    assert.equal(new Set(round.map((c) => c.active)).size, 5)
    assert.equal(new Set(round.map((c) => c.ingredient)).size, 5)
    for (const item of round) {
      assert.deepEqual(
        item,
        gamePool.find((c) => c.id === item.id),
      )
      assert.ok(item.foundIn && item.explanation && item.source)
      for (const other of round.filter((c) => c.id !== item.id)) {
        assert.ok(
          !gamePool.some(
            (c) => c.medicineId === item.medicineId && c.ingredient === other.ingredient,
          ),
        )
      }
    }
    const signature = round
      .map((c) => c.id)
      .sort()
      .join('|')
    assert.notEqual(
      signature,
      previous
        .map((c) => c.id)
        .sort()
        .join('|'),
    )
    signatures.add(signature)
    previous = round
  }
  assert.ok(signatures.size > 100)
})

test('replay changes associations even with the same random sequence', () => {
  const first = createGame([], seeded(7))
  const next = createGame(first, seeded(7))
  assert.notDeepEqual(first.map((c) => c.id).sort(), next.map((c) => c.id).sort())
  const original = [0, 1, 2, 3, 4]
  assert.deepEqual([...shuffle(original, seeded(9))].sort(), original)
  assert.deepEqual(original, [0, 1, 2, 3, 4])
})
