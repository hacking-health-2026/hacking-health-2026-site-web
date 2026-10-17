<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import DrugPicker from '@/components/DrugPicker.vue'
import { assessDrugs, fetchProfileOptions, fetchScenarios, workbookUrl, type Assessment, type Drug, type Scenario, type Status } from '@/services/api'

let nextId = 3
const rows = ref<{ id: number; drug: Drug | null }[]>([{ id: 1, drug: null }, { id: 2, drug: null }])
const profile = reactive<{ age: number | null; weight_kg: number | null }>({ age: 35, weight_kg: 70 })
const condition = ref('')
const conditions = ref<string[]>([])
const scenarios = ref<Scenario[]>([])
const result = ref<Assessment | null>(null)
const error = ref('')
const loading = ref(false)
let controller: AbortController | undefined
const ready = computed(() => rows.value.every(row => row.drug !== null) && !loading.value)
const titles: Record<Status, string> = {
  critical: 'Alerte rouge simulée', watch: 'Vigilance orange simulée', unknown: 'Aucune règle applicable dans cette démonstration',
}

function clearResult() {
  controller?.abort()
  loading.value = false
  result.value = null
  error.value = ''
}
watch(rows, clearResult, { deep: true, flush: 'sync' })
watch([profile, condition], clearResult, { deep: true, flush: 'sync' })

onMounted(async () => {
  try {
    const [examples, options] = await Promise.all([fetchScenarios(), fetchProfileOptions()])
    scenarios.value = examples
    conditions.value = options.conditions
  } catch { error.value = 'Les exemples sont indisponibles. Vérifiez que le backend de démonstration est démarré.' }
})

async function checkCompatibility() {
  result.value = null
  error.value = ''
  const drugs = rows.value.map(row => row.drug).filter((drug): drug is Drug => drug !== null)
  if (drugs.length !== rows.value.length || new Set(drugs.map(drug => drug.id)).size !== drugs.length) {
    error.value = 'Sélectionnez des produits différents dans les résultats du classeur.'
    return
  }
  const active = new AbortController()
  controller?.abort()
  controller = active
  loading.value = true
  try {
    const response = await assessDrugs(drugs.map(drug => drug.id), {
      age: profile.age === null || String(profile.age) === '' ? null : Number(profile.age),
      weight_kg: profile.weight_kg === null || String(profile.weight_kg) === '' ? null : Number(profile.weight_kg),
      conditions: condition.value ? [condition.value] : [],
    }, active.signal)
    if (!active.signal.aborted) result.value = response
  } catch (cause) {
    if (!active.signal.aborted) error.value = cause instanceof TypeError ? 'Backend inaccessible.'
      : cause instanceof Error ? cause.message : 'Simulation indisponible.'
  } finally {
    if (!active.signal.aborted) loading.value = false
  }
}

async function loadScenario(scenario: Scenario) {
  rows.value = scenario.products.map(drug => ({ id: nextId++, drug }))
  profile.age = scenario.profile.age
  profile.weight_kg = scenario.profile.weight_kg
  condition.value = scenario.profile.conditions[0] ?? ''
  await checkCompatibility()
}

async function seniorProfile() {
  profile.age = 72
  profile.weight_kg = 50
  await checkCompatibility()
}

function cellLabel(cell: { status: Status; score: number | null } | null | undefined) {
  return cell?.score == null ? 'Inconnu' : `${cell.status === 'critical' ? 'Rouge' : 'Orange'} · ${cell.score}`
}
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div>
    <section class="page-header">
      <div class="container">
        <span class="eyebrow">HERBAL NEXUS · DÉMONSTRATION SIMULÉE</span>
        <h1>Explorer une association</h1>
        <p>Produits du classeur, règles explicables et calcul fictif pour le hackathon.</p>
      </div>
    </section>
    <div class="container main-section">
      <div class="checker-card">
        <div class="demo-banner"><strong>Mode démo — aucun usage médical.</strong> Les coefficients et les scores sont inventés. Aucun modèle n’est entraîné sur des observations de patients.</div>
        <div class="examples" aria-label="Exemples de démonstration">
          <button v-for="scenario in scenarios" :key="scenario.id" type="button" @click="loadScenario(scenario)">
            <strong>{{ scenario.title }}</strong><small>{{ scenario.description }}</small>
          </button>
        </div>
        <form @submit.prevent="checkCompatibility">
          <div class="input-group">
            <div v-for="(row, index) in rows" :key="row.id" class="drug-row">
              <div class="product-field">
                <DrugPicker :id="`drug-${row.id}`" :selected="row.drug" :label="`Produit ${index + 1}`" @select="row.drug = $event" />
                <p v-if="row.drug" class="product-detail">{{ row.drug.active_substance ?? row.drug.declared_ingredients ?? row.drug.name }}<br /><span v-if="row.drug.drug_class">Classe du classeur : {{ row.drug.drug_class }}</span></p>
              </div>
              <button v-if="rows.length > 2" type="button" class="remove" :aria-label="`Retirer le produit ${index + 1}`" @click="rows.splice(index, 1)">×</button>
            </div>
          </div>
          <fieldset class="profile">
            <legend>Profil fictif</legend>
            <label>Âge (ans)<input v-model.number="profile.age" type="number" min="18" max="110" /></label>
            <label>Poids (kg)<input v-model.number="profile.weight_kg" type="number" min="30" max="250" step="0.1" /></label>
            <label class="condition">État du profil<select v-model="condition"><option value="">Aucun sélectionné</option><option v-for="value in conditions" :key="value" :value="value">{{ value }}</option></select></label>
            <p>Âge et poids : modificateurs arbitraires de la démo. Ils ne figurent pas dans les données du classeur.</p>
          </fieldset>
          <div class="actions">
            <button type="button" :disabled="rows.length >= 5" class="btn-add" @click="rows.push({ id: nextId++, drug: null })">+ Ajouter un produit</button>
            <button type="submit" :disabled="!ready" class="btn-check">{{ loading ? 'Simulation…' : 'Lancer la simulation' }}</button>
          </div>
        </form>
        <p v-if="error" role="alert" class="error">{{ error }}</p>
        <section v-if="result" aria-live="polite" class="results">
          <div :class="['result-box', result.status]">
            <div class="score-heading"><h2>{{ titles[result.status] }}</h2><strong v-if="result.calculation.score !== null" class="score">{{ result.calculation.score }}<small>points / 100</small></strong></div>
            <p>{{ result.calculation.matched_rule_count }} règle(s) du classeur utilisée(s). {{ result.coverage.classified_pairs }} / {{ result.coverage.total_pairs }} paire(s) reconnue(s).</p>
          </div>

          <h2 class="section-title">Calcul de démonstration</h2>
          <div v-if="result.calculation.steps.length" class="calculation">
            <div v-for="step in result.calculation.steps" :key="step.label" class="step"><div><strong>{{ step.label }}</strong><small>{{ step.origin }}</small></div><b>+{{ step.value }}</b></div>
            <p>Seuils fictifs : orange de 1 à 59, rouge à partir de 60. Maximum : 100 points.</p>
            <button type="button" class="sensitivity" @click="seniorProfile">Essayer 72 ans et 50 kg</button>
          </div>

          <h2 class="section-title">Matrice simulée des produits</h2>
          <div class="table-scroll" tabindex="0" aria-label="Matrice simulée défilante">
            <table><caption>Scores par paire. Une relation non reconnue reste inconnue.</caption>
              <thead><tr><th scope="col">Produit</th><th v-for="drug in result.drugs" :key="drug.id" scope="col">{{ drug.name }}</th></tr></thead>
              <tbody><tr v-for="(drug, i) in result.drugs" :key="drug.id"><th scope="row">{{ drug.name }}</th><td v-for="(cell, j) in result.risk_matrix[i]" :key="j" :class="i === j ? 'diagonal' : cell?.status ?? 'unknown'">{{ i === j ? '—' : cellLabel(cell) }}</td></tr></tbody>
            </table>
          </div>

          <h2 class="section-title">Données du classeur utilisées</h2>
          <article v-for="pair in result.pairs" :key="`${pair.drug_a.id}-${pair.drug_b.id}`" class="pair">
            <h3>{{ pair.drug_a.name }} + {{ pair.drug_b.name }}</h3>
            <p v-if="!pair.rules.length">Aucune règle correspondante. Aucune conclusion de sécurité.</p>
            <div v-for="rule in pair.rules" :key="rule.id" class="rule">
              <div class="rule-heading"><strong>{{ rule.id }} · {{ rule.ingredient }}</strong><span :class="['badge', rule.severity === 'Rouge' ? 'critical' : 'watch']">{{ rule.severity }} dans le classeur</span></div>
              <p>{{ rule.target }}</p><p><strong>Mécanisme décrit :</strong> {{ rule.mechanism }}</p><p><strong>Conséquence décrite :</strong> {{ rule.consequence }}</p>
              <small>{{ rule.reference.sheet }}!{{ rule.reference.range }} · Niveau indiqué : {{ rule.evidence_level }} · Source mentionnée : {{ rule.source_label }} (non vérifiée)</small>
            </div>
          </article>
          <div v-if="result.profile_alerts.length" class="profile-alerts"><h3>Règles du classeur liées au profil</h3><p v-for="alert in result.profile_alerts" :key="alert.id">{{ alert.ingredient }} + {{ alert.condition }} : {{ alert.risk }} ({{ alert.severity }} dans le classeur, {{ alert.reference.sheet }}!{{ alert.reference.range }}).</p></div>
          <p class="source"><a :href="workbookUrl(result.source.workbook_url)">Télécharger le classeur source</a> · Empreinte : {{ result.source.sha256.slice(0, 12) }}… · Algorithme : {{ result.algorithm.version }}</p>
          <p class="notice">{{ result.notice }}</p>
        </section>
      </div>
      <aside class="info-card">
        <h2>Un calcul volontairement fictif</h2>
        <p>Le classeur fournit les produits, leurs ingrédients, les classes de médicaments et les règles d’interaction.</p>
        <p>La démo résout la marque vers sa classe, cherche les règles applicables, puis calcule un score avec un barème inventé.</p>
        <p><strong>Base :</strong> rouge = 80, orange = 45.<br /><strong>Règles supplémentaires :</strong> +5, au maximum +15.<br /><strong>Âge ≥ 65 ans :</strong> +10.<br /><strong>Poids &lt; 55 kg :</strong> +5.</p>
        <p>Les états du profil utilisent la feuille « États à risque ». Les noms de sources et les niveaux de preuve du classeur ne sont pas vérifiés.</p>
        <p>Les données DDInter sont archivées et ne participent à aucun résultat de cette démo.</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page-header { padding: 2.2rem 0; background: #a8dadc; color: #1d3557; text-align: center; }
.eyebrow { font-size: .75rem; letter-spacing: .1em; font-weight: 750; }
h1 { margin: .7rem 0; font-size: clamp(1.8rem, 4vw, 2.5rem); }
.page-header p { margin-bottom: 0; line-height: 1.6; }
.container { max-width: 1180px; margin: 0 auto; padding: 0 20px; }
.main-section { display: grid; grid-template-columns: minmax(0, 2.7fr) minmax(220px, 1fr); gap: 2rem; padding: 2rem 20px; align-items: start; }
.checker-card { min-width: 0; background: white; padding: 1.6rem; border-radius: 15px; box-shadow: 0 4px 20px #0000000d; }
.demo-banner { background: #fff3d5; border-left: 4px solid #b77b10; padding: 1rem; font-size: .88rem; color: #62490c; line-height: 1.6; }
.examples { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin: 1.3rem 0 1.7rem; }
.examples button { background: #edf6f7; border: 1px solid #9ec3c9; padding: 1rem; text-align: left; border-radius: 8px; cursor: pointer; color: #1d3557; font: inherit; }
.examples small { display: block; margin-top: .5rem; line-height: 1.5; }
.input-group { display: grid; gap: 1.3rem; margin-bottom: 1.5rem; }
.drug-row { display: flex; gap: .75rem; align-items: start; }
.product-field { flex: 1; min-width: 0; }
.product-detail { font-size: .82rem; line-height: 1.6; color: #566575; margin: .35rem 0 0; }
.remove { margin-top: 1.8rem; background: #fff0f2; color: #a9192c; border: 0; border-radius: 8px; padding: .5rem .8rem; font-size: 1.25rem; cursor: pointer; }
.profile { border: 1px solid #ccdbe2; border-radius: 8px; padding: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 0 0 1.5rem; }
.profile legend { color: #1d3557; font-weight: 650; padding: 0 .4rem; }
.profile label { display: grid; gap: .5rem; font-size: .88rem; color: #1d3557; }
.profile input, .profile select { font: inherit; padding: .7rem; border: 1px solid #a6b9c5; border-radius: 6px; background: white; min-width: 0; }
.profile .condition, .profile p { grid-column: 1 / -1; }
.profile p { font-size: .78rem; color: #657281; line-height: 1.6; margin: 0; }
.actions { display: flex; gap: 1rem; }
.actions button, .sensitivity { padding: .85rem; border-radius: 8px; cursor: pointer; font: inherit; }
.actions button { flex: 1; }
.btn-add { background: #f1faee; color: #1d3557; border: 1px dashed #457b9d; }
.btn-check { background: #cf2837; color: white; border: 0; font-weight: 650 !important; }
button:disabled { opacity: .5; cursor: not-allowed; }
.error { color: #a9192c; padding: 1rem; background: #fff0f2; border-radius: 8px; }
.results { margin-top: 2rem; }
.result-box { padding: 1.3rem; border-radius: 10px; line-height: 1.6; }
.score-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.result-box h2 { font-size: 1.2rem; margin: 0; }
.score { font-size: 2.2rem; line-height: 1.2; text-align: center; white-space: nowrap; }
.score small { display: block; font-size: .7rem; font-weight: 400; }
.result-box p:last-child { margin-bottom: 0; font-size: .83rem; }
.critical { background: #ffe7e9; color: #901a28; }
.watch { background: #fff1d4; color: #77500a; }
.unknown { background: #eaf0f4; color: #495d6e; }
.diagonal { background: #f1f4f6; color: #667583; }
.section-title { font-size: 1.1rem; margin: 1.7rem 0 1rem; color: #1d3557; }
.calculation { border: 1px solid #d7e1e6; border-radius: 8px; padding: 1rem; }
.step { display: flex; justify-content: space-between; gap: .7rem; padding: .65rem 0; border-bottom: 1px solid #e3e9ed; font-size: .86rem; }
.step small { display: block; color: #657281; line-height: 1.6; margin-top: .25rem; }
.calculation p { font-size: .8rem; color: #657281; line-height: 1.6; }
.sensitivity { background: #e8f2f4; border: 1px solid #a7c5cd; color: #1d3557; font-size: .85rem; }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .8rem; }
caption { text-align: left; font-size: .8rem; color: #566575; line-height: 1.6; padding-bottom: .7rem; }
th, td { padding: .8rem .65rem; border: 1px solid #d7e1e6; text-align: center; }
th { color: #1d3557; background: #f7fafb; }
tbody th { text-align: left; }
.pair { border-top: 1px solid #e1e8ed; padding: 1rem 0; font-size: .9rem; line-height: 1.6; overflow-wrap: anywhere; }
.pair h3 { font-size: .98rem; color: #1d3557; }
.rule { background: #f8fafb; border-radius: 8px; padding: 1rem; margin: .75rem 0; }
.rule-heading { display: flex; justify-content: space-between; gap: .5rem; flex-wrap: wrap; }
.rule p { margin: .6rem 0; }
.rule small { color: #566575; }
.badge { font-size: .72rem; border-radius: 20px; padding: .2rem .7rem; }
.profile-alerts { background: #fff1d4; padding: 1rem; border-radius: 8px; font-size: .86rem; line-height: 1.7; }
a { color: #285775; }
.source, .notice { font-size: .78rem; line-height: 1.7; color: #566575; }
.notice { background: #fff3d5; padding: .8rem; border-radius: 6px; }
.info-card { background: #edf3f5; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #457b9d; color: #384d5c; font-size: .88rem; line-height: 1.7; }
.info-card h2 { font-size: 1.05rem; color: #1d3557; margin-top: 0; }
@media (max-width: 800px) { .main-section { grid-template-columns: 1fr; gap: 1rem; } .checker-card { padding: 1.1rem; } }
@media (max-width: 480px) { .examples { grid-template-columns: 1fr; } .actions { flex-direction: column; } .score-heading { align-items: start; } }
</style>
