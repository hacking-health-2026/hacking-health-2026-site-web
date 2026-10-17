<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import DrugPicker from '@/components/DrugPicker.vue'
import { assessDrugs, type Assessment, type Drug, type Status } from '@/services/api'

let nextId = 3
const rows = ref<{ id: number; drug: Drug | null }[]>([{ id: 1, drug: null }, { id: 2, drug: null }])
const result = ref<Assessment | null>(null)
const error = ref('')
const loading = ref(false)
let controller: AbortController | undefined
const ready = computed(() => rows.value.every(row => row.drug !== null) && !loading.value)
const titles: Record<Status, string> = {
  dangerous: 'Interaction potentiellement dangereuse détectée',
  not_dangerous: 'Pas d’alerte majeure dans les paires documentées',
  unknown: 'Données insuffisantes pour conclure',
}

watch(rows, () => {
  controller?.abort()
  loading.value = false
  result.value = null
  error.value = ''
}, { deep: true, flush: 'sync' })

async function checkCompatibility() {
  result.value = null
  error.value = ''
  const drugs = rows.value.map(row => row.drug).filter((drug): drug is Drug => drug !== null)
  if (drugs.length !== rows.value.length) {
    error.value = 'Choisissez chaque ingrédient dans les résultats de recherche.'
    return
  }
  if (new Set(drugs.map(drug => drug.id)).size !== drugs.length) {
    error.value = 'Sélectionnez des ingrédients différents. Le cumul des doses n’est pas évalué.'
    return
  }
  const active = new AbortController()
  controller?.abort()
  controller = active
  loading.value = true
  try {
    const response = await assessDrugs(drugs.map(drug => drug.id), active.signal)
    if (!active.signal.aborted) result.value = response
  } catch (cause) {
    if (!active.signal.aborted) error.value = cause instanceof TypeError
      ? 'Backend inaccessible. Vérifiez que le serveur est démarré.'
      : cause instanceof Error ? cause.message : 'Analyse indisponible.'
  } finally {
    if (!active.signal.aborted) loading.value = false
  }
}

function cellLabel(value: boolean | null) {
  return value === true ? 'Danger' : value === false ? 'Mineure' : 'Inconnu'
}

onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div class="compatibility-view">
    <section class="page-header">
      <div class="container">
        <span class="eyebrow">PROTOTYPE · DONNÉES DDINTER</span>
        <h1>Vérifier les interactions</h1>
        <p>Comparez 2 à 5 principes actifs et consultez chaque relation documentée.</p>
      </div>
    </section>

    <div class="container main-section">
      <div class="checker-card">
        <form @submit.prevent="checkCompatibility">
          <div class="input-group">
            <div v-for="(row, index) in rows" :key="row.id" class="drug-row">
              <DrugPicker :id="`drug-${row.id}`" :selected="row.drug" :label="`Principe actif ${index + 1}`"
                @select="row.drug = $event" />
              <button v-if="rows.length > 2" type="button" class="remove" :aria-label="`Retirer le principe actif ${index + 1}`"
                @click="rows.splice(index, 1)">×</button>
            </div>
          </div>
          <div class="actions">
            <button type="button" :disabled="rows.length >= 5" class="btn-add" @click="rows.push({ id: nextId++, drug: null })">+ Ajouter un ingrédient</button>
            <button type="submit" :disabled="!ready" class="btn-check">{{ loading ? 'Analyse…' : 'Vérifier maintenant' }}</button>
          </div>
        </form>

        <p v-if="error" role="alert" class="error">{{ error }}</p>
        <section v-if="result" aria-live="polite" class="results">
          <div :class="['result-box', result.status]">
            <h2>{{ titles[result.status] }}</h2>
            <p>{{ result.coverage.classified_pairs }} / {{ result.coverage.total_pairs }} paires classées · {{ result.coverage.unknown_pairs }} inconnue(s)</p>
            <p v-if="result.status === 'not_dangerous'">Les interactions trouvées sont classées mineures. Cela ne garantit pas la sécurité de l’association.</p>
            <p v-else-if="result.status === 'dangerous'">Au moins une interaction est classée modérée ou majeure. Faites vérifier cette association par un pharmacien.</p>
            <p v-else>Une relation absente ou inconnue ne permet pas de conclure à l’absence de danger.</p>
          </div>

          <h2 class="section-title">Matrice des relations</h2>
          <div class="table-scroll" tabindex="0" aria-label="Matrice défilante des interactions">
            <table>
              <caption>Danger = modérée ou majeure · Mineure = pas d’alerte majeure · Inconnu = non classable</caption>
              <thead><tr><th scope="col">Ingrédient</th><th v-for="drug in result.drugs" :key="drug.id" scope="col">{{ drug.name }}</th></tr></thead>
              <tbody>
                <tr v-for="(drug, i) in result.drugs" :key="drug.id">
                  <th scope="row">{{ drug.name }}</th>
                  <td v-for="(value, j) in result.matrix[i]" :key="j" :class="i === j ? 'diagonal' : value === true ? 'dangerous' : value === false ? 'not_dangerous' : 'unknown'">
                    {{ i === j ? '—' : cellLabel(value) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 class="section-title">Détail et provenance</h2>
          <article v-for="pair in result.pairs" :key="`${pair.drug_a.id}-${pair.drug_b.id}`" class="pair">
            <div class="pair-heading"><h3>{{ pair.drug_a.name }} + {{ pair.drug_b.name }}</h3><span :class="['badge', pair.status]">{{ pair.level ?? 'Non répertoriée' }}</span></div>
            <p v-if="!pair.evidence.length">Aucune relation trouvée dans les fichiers importés.</p>
            <details v-else><summary>Voir {{ pair.evidence.length }} ligne(s) source</summary>
              <ul><li v-for="evidence in pair.evidence" :key="`${evidence.filename}-${evidence.level}`"><a :href="evidence.url" target="_blank" rel="noopener noreferrer">{{ evidence.filename }}</a> · {{ evidence.level }}</li></ul>
              <small>Identifiants : {{ pair.drug_a.id }} / {{ pair.drug_b.id }}. Plusieurs fichiers peuvent reprendre la même relation.</small>
            </details>
          </article>
          <p class="source"><a :href="result.source.source_page" target="_blank" rel="noopener noreferrer">{{ result.source.source }}</a> · Version source : {{ result.source.source_release_date }} · Import : {{ new Date(result.source.imported_at).toLocaleDateString('fr-FR') }} · <a :href="result.source.terms_url" target="_blank" rel="noopener noreferrer">{{ result.source.license }}</a></p>
          <p class="notice">{{ result.notice }}</p>
        </section>
      </div>

      <aside class="info-sidebar">
        <div class="info-card">
          <h2>Comment ça marche ?</h2>
          <ol>
            <li>Recherchez un principe actif par son nom anglais.</li>
            <li>Sélectionnez un résultat pour chaque champ.</li>
            <li>Consultez la matrice et les lignes source.</li>
          </ol>
          <p><strong>Règle du PoC</strong><br />Major / Moderate → danger<br />Minor → pas d’alerte majeure<br />Absent / Unknown → inconnu</p>
          <p>Les noms de marque, huiles essentielles et compléments ne sont pas couverts de façon exhaustive.</p>
          <p>Ce prototype examine les interactions entre substances prises ensemble. Il ne vérifie pas la stabilité d’un mélange en seringue ou en perfusion.</p>
          <p>Les doses, le profil patient et les interactions à trois substances ou plus ne sont pas évalués.</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page-header { padding: 3rem 0; background: #a8dadc; color: #1d3557; text-align: center; }
.eyebrow { font-size: .75rem; letter-spacing: .13em; font-weight: 750; }
h1 { margin: .7rem 0; font-size: clamp(1.8rem, 4vw, 2.5rem); }
.page-header p { margin-bottom: 0; line-height: 1.6; }
.container { max-width: 1120px; margin: 0 auto; padding: 0 20px; }
.main-section { display: grid; grid-template-columns: minmax(0, 2.5fr) minmax(220px, 1fr); gap: 2rem; padding: 2.5rem 20px; align-items: start; }
.checker-card { min-width: 0; background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 4px 20px #0000000d; }
.input-group { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
.drug-row { display: flex; gap: .75rem; align-items: start; }
.remove { margin-top: 1.8rem; background: #fff0f2; color: #a9192c; border: 0; border-radius: 8px; padding: .5rem .8rem; font-size: 1.25rem; cursor: pointer; }
.actions { display: flex; gap: 1rem; }
.actions button { padding: .85rem; border-radius: 8px; cursor: pointer; flex: 1; font: inherit; }
.btn-add { background: #f1faee; color: #1d3557; border: 1px dashed #457b9d; }
.btn-check { background: #cf2837; color: white; border: 0; font-weight: 650 !important; }
button:disabled { opacity: .5; cursor: not-allowed; }
.error { color: #a9192c; padding: 1rem; background: #fff0f2; border-radius: 8px; }
.results { margin-top: 2rem; }
.result-box { padding: 1.3rem; border-radius: 10px; border: 1px solid #c9d5dc; line-height: 1.6; }
.result-box h2 { font-size: 1.15rem; margin-top: 0; }
.result-box p:last-child { margin-bottom: 0; }
.dangerous { background: #ffe7e9; color: #901a28; }
.not_dangerous { background: #edf6e6; color: #36551c; }
.unknown { background: #fff4dc; color: #70500d; }
.diagonal { background: #f1f4f6; color: #667583; }
.section-title { font-size: 1.1rem; margin: 1.7rem 0 1rem; color: #1d3557; }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .83rem; }
caption { text-align: left; font-size: .8rem; color: #566575; line-height: 1.6; padding-bottom: .7rem; }
th, td { padding: .8rem .65rem; border: 1px solid #d7e1e6; text-align: center; }
th { color: #1d3557; background: #f7fafb; }
tbody th { text-align: left; }
.pair { border-top: 1px solid #e1e8ed; padding: 1rem 0; font-size: .9rem; line-height: 1.6; overflow-wrap: anywhere; }
.pair-heading { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
.pair h3 { font-size: .95rem; margin: 0; color: #1d3557; }
.badge { font-size: .75rem; border-radius: 20px; padding: .2rem .7rem; white-space: nowrap; }
details { margin-top: .6rem; }
summary { cursor: pointer; color: #365c76; }
ul { padding-left: 1.2rem; }
a { color: #285775; }
.source, .notice { font-size: .78rem; line-height: 1.7; color: #566575; }
.notice { background: #f5f7f8; padding: .8rem; border-radius: 6px; }
.info-card { background: #edf3f5; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #457b9d; color: #384d5c; font-size: .9rem; line-height: 1.7; }
.info-card h2 { font-size: 1.05rem; color: #1d3557; margin-top: 0; }
.info-card ol { padding-left: 1.2rem; }
.info-card li { margin-bottom: .6rem; }
@media (max-width: 800px) { .main-section { grid-template-columns: 1fr; gap: 1rem; } .checker-card { padding: 1.25rem; } }
@media (max-width: 480px) { .actions { flex-direction: column; } .pair-heading { flex-wrap: wrap; } }
</style>
