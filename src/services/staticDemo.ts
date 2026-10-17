import snapshot from '../data/static-demo.json' with { type: 'json' }
import type {
  Assessment,
  Calculation,
  Component,
  Drug,
  IngredientRelation,
  Intake,
  Profile,
  Rule,
  Status,
} from './api'

type Resolved = Drug & { units_per_day: number }
type Edge = IngredientRelation & { medicine_id: string; botanical_id: string }
type Pair = Assessment['pairs'][number] & {
  ingredient_relations: Edge[]
  dangerous: boolean | null
}
type ProfileAlert = Assessment['profile_alerts'][number]
interface DemoData {
  products: Drug[]
  conditions: string[]
  pairs: Pair[]
  profile_alerts: Record<string, ProfileAlert[]>
  algorithm: Assessment['algorithm'] & {
    formula: string
    quantity_note: string
    coefficients: {
      Rouge: number
      Orange: number
      Vert: number
      per_additional_rule: number
      additional_rules_cap: number
      age_threshold: number
      age_bonus: number
      weight_threshold_kg: number
      weight_bonus: number
    }
    thresholds: { critical: number; watch: number }
  }
  source: Assessment['source']
  notice: string
}
const data = snapshot as unknown as DemoData
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replaceAll('œ', 'oe')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const round = (value: number, digits: number) => Number(value.toFixed(digits))
const invalid = (message: string): never => {
  throw new Error(message)
}
const validNumber = (value: number | null, min: number, max: number) =>
  value === null || (Number.isFinite(value) && value >= min && value <= max)

export function staticProfileOptions() {
  return { conditions: [...data.conditions] }
}
export function searchStaticProducts(query: string): Drug[] {
  const term = normalize(query)
  if (term.length < 2) return []
  return structuredClone(
    data.products.filter((p) =>
      normalize(
        [
          p.name,
          p.active_substance,
          p.declared_ingredients,
          ...p.components.map((c) => c.name),
        ].join(' '),
      ).includes(term),
    ),
  )
}

function calculate(
  rules: { id: string; severity: string }[],
  profile: Profile,
  quantityBonus = 0,
): Calculation & { simulated: true } {
  const unique = [...new Map(rules.map((rule) => [rule.id, rule])).values()]
  const formula = data.algorithm.formula
  if (!unique.length)
    return {
      score: null,
      simulated: true,
      status: 'unknown',
      formula,
      substitution: 'Aucune règle applicable : score non calculé.',
      steps: [],
      matched_rule_count: 0,
    }
  const c = data.algorithm.coefficients
  const severity = (value: string) =>
    value === 'Rouge'
      ? c.Rouge
      : value === 'Orange'
        ? c.Orange
        : value === 'Vert'
          ? c.Vert
          : invalid('Gravité inconnue dans les données de présentation.')
  const base = Math.max(...unique.map((rule) => severity(rule.severity)))
  const extra = Math.min(c.additional_rules_cap, (unique.length - 1) * c.per_additional_rule)
  const age = profile.age !== null && profile.age >= c.age_threshold ? c.age_bonus : 0
  const weight =
    profile.weight_kg !== null && profile.weight_kg < c.weight_threshold_kg ? c.weight_bonus : 0
  const score = Math.min(100, base + extra + age + weight + quantityBonus)
  const status: Status =
    score >= data.algorithm.thresholds.critical
      ? 'critical'
      : score >= data.algorithm.thresholds.watch
        ? 'watch'
        : 'low'
  return {
    score,
    simulated: true,
    status,
    formula,
    substitution: `min(100, ${base} + ${extra} + ${age} + ${weight}${quantityBonus ? ` + ${quantityBonus}` : ''}) = ${score}`,
    matched_rule_count: unique.length,
    steps: [
      {
        label: 'Base : gravité maximale du classeur',
        value: base,
        origin: 'Barème fictif : Rouge = 80, Orange = 45, Vert = 15',
      },
      {
        label: 'Règles supplémentaires',
        value: extra,
        origin: 'Coefficient fictif : +5 par règle après la première, maximum +15',
      },
      {
        label: 'Modificateur âge',
        value: age,
        origin: 'Coefficient fictif : +10 à partir de 65 ans',
      },
      { label: 'Modificateur poids', value: weight, origin: 'Coefficient fictif : +5 sous 55 kg' },
      { label: 'Quantités croisées', value: quantityBonus, origin: data.algorithm.quantity_note },
    ],
  }
}

function resolveProducts(ids: string[], intakes: Intake[]): Resolved[] {
  const selected = ids.map(
    (id) =>
      data.products.find((p) => p.id === id) ??
      invalid('Cette présentation prend en charge les quatre produits des deux exemples.'),
  )
  const seenProducts = new Set<string>()
  for (const intake of intakes) {
    const product =
      selected.find((p) => p.id === intake.product_id) ??
      invalid('Quantités reçues pour un produit inconnu.')
    if (seenProducts.has(intake.product_id))
      invalid('Quantités reçues pour un produit inconnu ou dupliqué.')
    seenProducts.add(intake.product_id)
    if (!validNumber(intake.units_per_day, Number.MIN_VALUE, 100))
      invalid(
        'Renseignez une quantité comprise entre 0 et 100 unités par jour, strictement positive.',
      )
    const seenComponents = new Set<string>()
    for (const component of intake.components) {
      if (
        !product.components.some((c) => c.id === component.component_id) ||
        seenComponents.has(component.component_id)
      )
        invalid('Principe actif inconnu ou dupliqué pour ce produit.')
      if (!validNumber(component.amount_mg, Number.MIN_VALUE, 1000000))
        invalid('Renseignez une quantité de principe actif positive ou laissez-la inconnue.')
      seenComponents.add(component.component_id)
    }
  }
  return selected.map((source) => {
    const product = structuredClone(source)
    const intake = intakes.find((i) => i.product_id === product.id)
    const units = intake?.units_per_day ?? 1
    return {
      ...product,
      units_per_day: units,
      components: product.components.map((component) => {
        const override = intake?.components.find((c) => c.component_id === component.id)
        const amount = override ? override.amount_mg : component.amount_mg
        return {
          ...component,
          amount_mg: amount,
          daily_mg: amount === null ? null : round(amount * units, 8),
          input_origin: override ? 'user' : component.quantity_origin,
        }
      }),
    }
  })
}

function updateEdge(template: Edge, products: Resolved[], rules: Rule[], profile: Profile): Edge {
  const getComponent = (productId: string, componentId: string): Component =>
    products.find((p) => p.id === productId)?.components.find((c) => c.id === componentId) ??
    invalid('Composition absente des données de présentation.')
  const substance = getComponent(template.medicine_id, template.substance.id)
  const ingredient = getComponent(template.botanical_id, template.ingredient.id)
  const complete = [substance, ingredient].every(
    (c) => c.daily_mg != null && c.demo_reference_mg != null,
  )
  const factor = complete
    ? Math.sqrt(
        (substance.daily_mg! / substance.demo_reference_mg!) *
          (ingredient.daily_mg! / ingredient.demo_reference_mg!),
      )
    : null
  const bonus = factor === null ? 0 : Math.floor(Math.min(20, Math.max(0, (factor - 1) * 10)) + 0.5)
  const rule =
    rules.find((r) => r.id === template.rule_id) ??
    invalid('Règle absente des données de présentation.')
  const calculation = calculate([rule], profile, bonus)
  return {
    ...structuredClone(template),
    substance,
    ingredient,
    quantity_complete: complete,
    exposure_factor: factor === null ? null : round(factor, 3),
    quantity_points: bonus,
    score: calculation.score!,
    status: calculation.status,
  }
}

/** Same simulated arithmetic as Python v3, restricted to the four exported products. */
export function assessStaticProducts(
  ids: string[],
  profile: Profile,
  intakes: Intake[] = [],
): Assessment {
  if (ids.length < 2 || ids.length > data.products.length || new Set(ids).size !== ids.length)
    invalid('Sélectionnez entre deux et quatre produits différents parmi les exemples.')
  if (
    !validNumber(profile.age, 18, 110) ||
    (profile.age !== null && !Number.isInteger(profile.age)) ||
    !validNumber(profile.weight_kg, 30, 250)
  )
    invalid('Renseignez un âge de 18 à 110 ans et un poids de 30 à 250 kg, ou laissez-les vides.')
  const allowedConditions = new Set(data.conditions.map(normalize))
  if (profile.conditions.some((value) => !allowedConditions.has(normalize(value))))
    invalid('Sélectionnez un état de profil proposé dans la liste.')
  const products = resolveProducts(ids, intakes)
  const pairs: Pair[] = []
  const riskMatrix: Assessment['risk_matrix'] = products.map(() => products.map(() => null))
  const rules: Rule[] = []
  const relations: Edge[] = []
  for (let i = 0; i < products.length; i++)
    for (let j = i + 1; j < products.length; j++) {
      const a = products[i]!,
        b = products[j]!
      const template =
        data.pairs.find(
          (p) =>
            [p.drug_a.id, p.drug_b.id].includes(a.id) && [p.drug_a.id, p.drug_b.id].includes(b.id),
        ) ?? invalid('Association absente des données de présentation.')
      const edges = template.ingredient_relations.map((edge) =>
        updateEdge(edge, products, template.rules, profile),
      )
      const calculation = calculate(
        template.rules,
        profile,
        Math.max(0, ...edges.map((edge) => edge.quantity_points)),
      )
      pairs.push({
        ...structuredClone(template),
        drug_a: a,
        drug_b: b,
        ingredient_relations: edges,
        dangerous: calculation.score === null ? null : calculation.status === 'critical',
        status: calculation.status,
        calculation,
      })
      riskMatrix[i]![j] = riskMatrix[j]![i] = {
        score: calculation.score,
        status: calculation.status,
      }
      rules.push(...template.rules)
      relations.push(...edges)
    }
  const requested = new Set(profile.conditions.map(normalize))
  const profileAlerts = products.flatMap((product) =>
    (data.profile_alerts[product.id] ?? []).filter((rule) =>
      [...rule.condition.split('/'), rule.condition].some((value) =>
        requested.has(normalize(value)),
      ),
    ),
  )
  const overall = calculate(
    [...rules, ...profileAlerts],
    profile,
    Math.max(0, ...relations.map((edge) => edge.quantity_points)),
  )
  const classified = pairs.filter((pair) => pair.calculation.score !== null).length
  return {
    demo_mode: true,
    drugs: products,
    pairs,
    risk_matrix: riskMatrix,
    status: overall.status,
    calculation: overall,
    ingredient_relations: relations,
    profile_alerts: structuredClone(profileAlerts),
    quantity_coverage: {
      total_relations: relations.length,
      calculated_relations: relations.filter((edge) => edge.quantity_complete).length,
    },
    coverage: {
      total_pairs: pairs.length,
      classified_pairs: classified,
      unknown_pairs: pairs.length - classified,
    },
    algorithm: structuredClone(data.algorithm),
    source: structuredClone(data.source),
    notice: data.notice,
  }
}
