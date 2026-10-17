import snapshot from '../data/static-demo.json' with { type: 'json' }
import { searchStaticProducts } from './staticDemo.ts'
import type { Intake, Profile, Drug } from './api'

type ShareInput = { profile: Profile; intakes: Intake[] }
const fail = (): never => {
  throw new Error(
    'Ce lien d’analyse est incomplet, invalide ou utilise une autre version du classeur.',
  )
}
const number = (
  value: unknown,
  min: number,
  max: number,
  nullable = false,
): value is number | null =>
  (nullable && value === null) ||
  (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max)

export function encodeAnalysis(input: ShareInput): string {
  const compact = {
    v: 1,
    a: snapshot.algorithm.version,
    s: snapshot.source.sha256.slice(0, 12),
    p: [input.profile.age, input.profile.weight_kg, input.profile.conditions],
    d: input.intakes.map((i) => [
      i.product_id,
      i.units_per_day,
      i.components.map((c) => c.amount_mg),
    ]),
  }
  const token = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(compact))))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
  decodeAnalysis(token)
  return token
}
export function decodeAnalysis(token: string): {
  products: { product: Drug; units: number }[]
  profile: Profile
} {
  if (token.length > 6000) return fail()
  let value
  try {
    value = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(atob(token.replaceAll('-', '+').replaceAll('_', '/')), (c) =>
          c.charCodeAt(0),
        ),
      ),
    )
  } catch {
    return fail()
  }
  if (
    value?.v !== 1 ||
    value.a !== snapshot.algorithm.version ||
    value.s !== snapshot.source.sha256.slice(0, 12) ||
    !Array.isArray(value.p) ||
    value.p.length !== 3 ||
    !number(value.p[0], 0, 120, true) ||
    !number(value.p[1], 1, 500, true) ||
    !Array.isArray(value.p[2]) ||
    value.p[2].length > 1 ||
    !value.p[2].every((c: unknown) => typeof c === 'string' && snapshot.conditions.includes(c)) ||
    !Array.isArray(value.d) ||
    value.d.length < 2 ||
    value.d.length > 5
  )
    return fail()
  const catalogue = searchStaticProducts('')
  const ids = new Set<string>()
  const products = value.d.map((entry: unknown) => {
    if (
      !Array.isArray(entry) ||
      entry.length !== 3 ||
      typeof entry[0] !== 'string' ||
      !number(entry[1], Number.MIN_VALUE, 100)
    )
      return fail()
    const product = catalogue.find((p) => p.id === entry[0])
    if (
      !product ||
      ids.has(product.id) ||
      !Array.isArray(entry[2]) ||
      entry[2].length !== product.components.length ||
      !entry[2].every((amount: unknown) => number(amount, Number.MIN_VALUE, 1000000, true))
    )
      return fail()
    ids.add(product.id)
    product.components.forEach((c, i) => {
      c.amount_mg = entry[2][i]
    })
    return { product, units: entry[1] as number }
  })
  const profile: Profile = { age: value.p[0], weight_kg: value.p[1], conditions: value.p[2] }
  return { products, profile }
}
