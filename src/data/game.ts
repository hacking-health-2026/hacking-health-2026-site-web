import dataset from './static-demo.json' with { type: 'json' }

export type GameId = string
export interface GameCase {
  id: GameId
  medicineId: string
  ruleId: string
  medicine: string
  active: string
  role: string
  ingredient: string
  clue: string
  foundIn: string
  explanation: string
  source: string
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
const products = new Map(dataset.products.map((product) => [product.id, product]))
const cases = new Map<string, GameCase>()
for (const pair of dataset.pairs) {
  const a = products.get(pair.product_a_id)!
  const b = products.get(pair.product_b_id)!
  const [medicine, supplement] = a.kind === 'medicine' ? [a, b] : [b, a]
  for (const rule of pair.rules) {
    const id = `${medicine.id}-${rule.id}`
    const existing = cases.get(id)
    if (existing) {
      if (!existing.foundIn.split(' · ').includes(supplement.name))
        existing.foundIn += ` · ${supplement.name}`
      continue
    }
    cases.set(id, {
      id,
      medicineId: medicine.id,
      ruleId: rule.id,
      medicine: medicine.name,
      active: medicine.active_substance || medicine.name,
      role: medicine.drug_class || '',
      ingredient: rule.ingredient,
      clue: `${rule.mechanism}. Conséquence indiquée : ${rule.consequence}.`,
      foundIn: supplement.name,
      explanation: `${rule.mechanism}. ${rule.consequence}.`,
      source: `Classeur · ${rule.reference.sheet}, ligne ${rule.reference.row} · ${rule.source_label} (référence du classeur non vérifiée)`,
    })
  }
}
export const gamePool: GameCase[] = [...cases.values()]
const related = new Set(gamePool.map((item) => `${item.medicineId}|${normalize(item.ingredient)}`))

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

/** Choose an induced matching: five distinct samples and components, no ambiguous cross-links. */
export function createGame(previous: readonly GameCase[] = [], random = Math.random): GameCase[] {
  const candidates = shuffle(gamePool, random)
  const signature = (items: readonly GameCase[]) =>
    items
      .map((item) => item.id)
      .sort()
      .join('|')
  const previousSignature = signature(previous)
  function choose(chosen: GameCase[], start: number): GameCase[] | undefined {
    if (chosen.length === 5) return signature(chosen) !== previousSignature ? chosen : undefined
    for (let i = start; i < candidates.length; i++) {
      const item = candidates[i]!
      if (
        chosen.some(
          (other) =>
            normalize(other.active) === normalize(item.active) ||
            normalize(other.ingredient) === normalize(item.ingredient) ||
            related.has(`${other.medicineId}|${normalize(item.ingredient)}`) ||
            related.has(`${item.medicineId}|${normalize(other.ingredient)}`),
        )
      )
        continue
      const result = choose([...chosen, item], i + 1)
      if (result) return result
    }
  }
  const result = choose([], 0)
  if (!result) throw new Error('Le classeur ne permet pas de créer cinq associations distinctes.')
  return result.map((item) => ({ ...item }))
}

/** A new selection dismisses failed attempts while keeping solved pairs. */
export function clearIncorrectPairs(pairs: Partial<Record<GameId, GameId>>) {
  return Object.fromEntries(
    Object.entries(pairs).filter(([medicine, ingredient]) => medicine === ingredient),
  ) as Partial<Record<GameId, GameId>>
}

/** An ingredient has at most one connection. Reconnecting frees the old card. */
export function connectPair(
  pairs: Partial<Record<GameId, GameId>>,
  medicine: GameId,
  ingredient: GameId,
) {
  const next = { ...pairs }
  for (const key of Object.keys(next) as GameId[]) {
    if (next[key] === ingredient) delete next[key]
  }
  next[medicine] = ingredient
  return next
}
