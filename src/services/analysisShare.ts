import snapshot from '../data/static-demo.json' with { type: 'json' }
import { searchStaticProducts } from './staticDemo.ts'
import type { Assessment, Intake, Profile, Drug } from './api'

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

const escape = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
export function analysisReport(result: Assessment, profile: Profile) {
  const labels = {
    critical: 'Danger',
    watch: 'Risque modéré',
    low: 'Risque faible',
    unknown: 'Informations insuffisantes',
  }
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Bilan Herbal Nexus</title><style>body{font:18px/1.6 Arial,sans-serif;max-width:850px;margin:40px auto;padding:20px;color:#292333}h1{font-size:34px}article{padding:20px;background:#f3effb;margin:15px 0;border-radius:16px}small{display:block;margin-top:30px}button{font:inherit;padding:10px}@media print{button{display:none}}</style><h1>Votre bilan Herbal Nexus</h1><h2>${labels[result.status]}</h2><p>Profil : ${escape(profile.age ?? 'Âge non renseigné')} ans · ${escape(profile.weight_kg ?? 'Poids non renseigné')} kg · ${escape(profile.conditions.join(', ') || 'Aucun état renseigné')}</p>${result.drugs.map((d) => `<article><h2>${escape(d.name)}</h2>${d.components.map((c) => `<p>${escape(c.name)} : ${escape(c.daily_mg ?? 'Quantité inconnue')}${c.daily_mg == null ? '' : ' mg/j'}</p>`).join('')}</article>`).join('')}<h2>Associations</h2>${result.pairs.map((p) => `<p><b>${escape(p.drug_a.name)} + ${escape(p.drug_b.name)} : ${labels[p.status]}</b></p>${p.rules.map((r) => `<p>${escape(r.mechanism)}. ${escape(r.consequence)}<br>Classeur : ${escape(r.reference.sheet)}, ligne ${r.reference.row} (${escape(r.id)})</p>`).join('')}`).join('')}${result.profile_alerts.map((a) => `<p><b>Alerte de profil : ${escape(a.condition)}</b> — ${escape(a.ingredient)} : ${escape(a.risk)}</p>`).join('')}<small>Prototype de présentation. Évaluation simulée, non validée pour un usage médical. Une interaction non détectée ne signifie pas une absence de danger. Source : ${escape(result.source.name)} · ${escape(result.source.sha256)} · moteur ${escape(result.algorithm.version)}.</small></html>`
}
