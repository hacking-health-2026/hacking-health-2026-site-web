export interface Drug {
  id: string
  name: string
  kind: 'medicine' | 'supplement' | 'ingredient'
  active_substance?: string
  drug_class?: string
  declared_ingredients?: string
}
export type Status = 'critical' | 'watch' | 'unknown'
export interface Profile { age: number | null; weight_kg: number | null; conditions: string[] }
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
  profile_alerts: { id: string; ingredient: string; condition: string; severity: string; risk: string; reference: Rule['reference'] }[]
  coverage: { total_pairs: number; classified_pairs: number; unknown_pairs: number }
  algorithm: { version: string; coefficient_origin: string; units: string }
  source: { name: string; sha256: string; imported_at: string; workbook_url: string }
  notice: string
}
export interface Scenario { id: string; title: string; description: string; products: Drug[]; profile: Profile }

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}/api${path}`, options)
  if (!response.ok) throw new Error(`La requête a échoué (${response.status}). Vérifiez les produits du classeur et réessayez.`)
  return response.json() as Promise<T>
}

export function searchDrugs(query: string, signal: AbortSignal) {
  return request<Drug[]>(`/drugs?q=${encodeURIComponent(query)}`, { signal })
}
export function assessDrugs(drugIds: string[], profile: Profile, signal: AbortSignal) {
  return request<Assessment>('/assess', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drug_ids: drugIds, profile }), signal })
}
export function fetchScenarios() { return request<Scenario[]>('/scenarios') }
export function fetchProfileOptions() { return request<{ conditions: string[] }>('/profile-options') }
export function workbookUrl(path: string) { return `${baseUrl}${path}` }
