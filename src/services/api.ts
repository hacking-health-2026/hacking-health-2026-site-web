export interface Component {
  id: string
  name: string
  amount_mg: number | null
  daily_mg?: number | null
  demo_reference_mg: number | null
  basis: 'substance' | 'plant_extract' | 'declared_ingredient'
  quantity_origin: 'bdpm' | 'simulated' | 'missing'
}
export interface Drug {
  id: string
  name: string
  kind: 'medicine' | 'supplement' | 'ingredient'
  display_kind?: string | null
  active_substance?: string
  drug_class?: string
  declared_ingredients?: string
  components: Component[]
  unit_label: string
  formulation: string
  composition_note: string
  composition_simulated: boolean
  composition_source: { label: string; url: string; updated_at: string; accessed_at: string } | null
}
export interface Intake {
  product_id: string
  units_per_day: number
  components: { component_id: string; amount_mg: number | null }[]
}
export interface IngredientRelation {
  id: string
  rule_id: string
  substance: Component
  ingredient: Component
  quantity_complete: boolean
  quantity_points: number
  exposure_factor: number | null
  score: number
  status: Status
  mechanism: string
  mapping_note: string
}
export type Status = 'critical' | 'watch' | 'low' | 'unknown'
export interface Profile {
  age: number | null
  weight_kg: number | null
  conditions: string[]
}
export interface Calculation {
  score: number | null
  status: Status
  formula: string
  substitution: string
  matched_rule_count: number
  steps: { label: string; value: number; origin: string }[]
}
export interface Rule {
  id: string
  ingredient: string
  target: string
  severity: string
  mechanism: string
  consequence: string
  source_label: string
  evidence_level: string
  source_verified: false
  reference: { sheet: string; row: number; range: string }
}
export interface Assessment {
  demo_mode: true
  drugs: Drug[]
  pairs: { drug_a: Drug; drug_b: Drug; status: Status; rules: Rule[]; calculation: Calculation }[]
  risk_matrix: ({ score: number | null; status: Status } | null)[][]
  status: Status
  calculation: Calculation
  ingredient_relations: IngredientRelation[]
  quantity_coverage: { total_relations: number; calculated_relations: number }
  profile_alerts: {
    id: string
    ingredient: string
    condition: string
    severity: string
    risk: string
    reference: Rule['reference']
  }[]
  coverage: { total_pairs: number; classified_pairs: number; unknown_pairs: number }
  algorithm: { version: string; coefficient_origin: string; units: string }
  source: { name: string; sha256: string; imported_at: string; workbook_url: string }
  notice: string
}
export interface Scenario {
  id: string
  title: string
  description: string
  products: Drug[]
  profile: Profile
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}/api${path}`, options)
  if (!response.ok)
    throw new Error(
      `La requête a échoué (${response.status}). Vérifiez les produits du classeur et réessayez.`,
    )
  return response.json() as Promise<T>
}

export function searchDrugs(query: string, signal: AbortSignal) {
  return request<Drug[]>(`/drugs?q=${encodeURIComponent(query)}`, { signal })
}
export function assessDrugs(
  drugIds: string[],
  profile: Profile,
  signal: AbortSignal,
  intakes: Intake[] = [],
) {
  return request<Assessment>('/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drug_ids: drugIds, profile, intakes }),
    signal,
  })
}
export function fetchScenarios() {
  return request<Scenario[]>('/scenarios')
}
export function fetchProfileOptions() {
  return request<{ conditions: string[] }>('/profile-options')
}
export function workbookUrl(path: string) {
  return `${baseUrl}${path}`
}
