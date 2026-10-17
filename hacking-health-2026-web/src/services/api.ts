export interface Drug { id: string; name: string }
export type Status = 'dangerous' | 'not_dangerous' | 'unknown'
export interface Pair {
  drug_a: Drug
  drug_b: Drug
  level: string | null
  dangerous: boolean | null
  status: Status
  evidence: { level: string; filename: string; url: string }[]
}
export interface Assessment {
  drugs: Drug[]
  pairs: Pair[]
  matrix: (boolean | null)[][]
  status: Status
  dangerous: boolean | null
  coverage: { total_pairs: number; classified_pairs: number; unknown_pairs: number; fraction: number }
  policy: { version: string }
  source: {
    source: string
    source_page: string
    source_release_date: string
    imported_at: string
    license: string
    terms_url: string
  }
  notice: string
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}/api${path}`, options)
  if (!response.ok) {
    if (response.status === 503) throw new Error('Données indisponibles. Importez le jeu DDInter sur le serveur.')
    throw new Error(`La requête a échoué (${response.status}). Vérifiez les ingrédients sélectionnés et réessayez.`)
  }
  return response.json() as Promise<T>
}

export function searchDrugs(query: string, signal: AbortSignal) {
  return request<Drug[]>(`/drugs?q=${encodeURIComponent(query)}`, { signal })
}

export function assessDrugs(drugIds: string[], signal: AbortSignal) {
  return request<Assessment>('/assess', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drug_ids: drugIds }), signal,
  })
}
