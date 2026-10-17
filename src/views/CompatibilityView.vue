<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import DrugPicker from '@/components/DrugPicker.vue'
import CompositionEditor from '@/components/CompositionEditor.vue'
import NexusIcon from '@/components/NexusIcon.vue'
import { useRoute } from 'vue-router'
import { alertLabels, alertColors, severityStatus } from '@/services/alerts'
import {
  assessDrugs,
  fetchProfileOptions,
  fetchScenarios,
  workbookUrl,
  type Assessment,
  type Drug,
  type Scenario,
  type Status,
} from '@/services/api'

const route = useRoute()
const currentStep = ref<1 | 2 | 3>(1)
const stageContent = ref<HTMLElement | null>(null)
const steps = [
  { id: 1, title: 'Sélection', description: 'Produits et profil' },
  { id: 2, title: 'Analyse', description: 'Comprendre les associations' },
  { id: 3, title: 'Résumé', description: 'Retenir l’essentiel' },
] as const
function goToStep(step: 1 | 2 | 3) {
  if (loading.value || (step > 1 && !result.value)) return
  currentStep.value = step
}
watch(currentStep, async () => {
  await nextTick()
  stageContent.value?.focus({ preventScroll: true })
  stageContent.value?.scrollIntoView({ block: 'start' })
})
const selectedScenario = ref('')
let nextId = 3
const rows = ref<{ id: number; drug: Drug | null; units: number }[]>([
  { id: 1, drug: null, units: 1 },
  { id: 2, drug: null, units: 1 },
])
const profile = reactive<{ age: number | null; weight_kg: number | null }>({
  age: 35,
  weight_kg: 70,
})
const condition = ref('')
const conditions = ref<string[]>([])
const scenarios = ref<Scenario[]>([])
const result = ref<Assessment | null>(null)
const error = ref('')
const loading = ref(false)
let controller: AbortController | undefined
const ready = computed(() => rows.value.every((row) => row.drug !== null) && !loading.value)
const reasons = computed(() => {
  if (!result.value || result.value.status === 'unknown') return []
  const assessment = result.value
  return [
    {
      label: 'Interaction identifiée',
      detail: 'Une règle du classeur correspond à cette association.',
    },
    {
      label: 'Règles croisées',
      detail:
        assessment.calculation.matched_rule_count > 1
          ? 'Plusieurs règles sont prises en compte.'
          : 'Une règle est prise en compte.',
    },
    {
      label: 'Âge du profil',
      detail:
        profile.age == null
          ? 'Âge non renseigné.'
          : assessment.calculation.steps[2]?.value
            ? 'Facteur de vigilance supplémentaire dans cette simulation.'
            : 'Âge renseigné, sans majoration dans cette simulation.',
    },
    {
      label: 'Poids du profil',
      detail:
        profile.weight_kg == null
          ? 'Poids non renseigné.'
          : assessment.calculation.steps[3]?.value
            ? 'Facteur de vigilance supplémentaire dans cette simulation.'
            : 'Poids renseigné, sans majoration dans cette simulation.',
    },
    {
      label: 'Quantités croisées',
      detail: assessment.quantity_coverage.calculated_relations
        ? 'Les quantités disponibles sont prises en compte.'
        : 'Quantités ou références insuffisantes pour une pondération.',
    },
  ]
})

function clearResult() {
  controller?.abort()
  loading.value = false
  result.value = null
  error.value = ''
  currentStep.value = 1
}
watch(
  rows,
  () => {
    clearResult()
    selectedScenario.value = ''
  },
  { deep: true, flush: 'sync' },
)
watch([profile, condition], clearResult, { deep: true, flush: 'sync' })

onMounted(async () => {
  try {
    const [examples, options] = await Promise.all([fetchScenarios(), fetchProfileOptions()])
    scenarios.value = examples
    conditions.value = options.conditions
    const initial = examples.find((example) => example.id === route.query.example)
    if (initial) await loadScenario(initial)
  } catch {
    error.value = 'Les exemples sont momentanément indisponibles. Réessayez dans un instant.'
  }
})

async function checkCompatibility() {
  result.value = null
  error.value = ''
  const drugs = rows.value.map((row) => row.drug).filter((drug): drug is Drug => drug !== null)
  if (
    drugs.length !== rows.value.length ||
    new Set(drugs.map((drug) => drug.id)).size !== drugs.length
  ) {
    error.value = 'Sélectionnez des produits différents dans les résultats du classeur.'
    return
  }
  if (
    rows.value.some(
      (row) =>
        !Number.isFinite(row.units) ||
        row.units <= 0 ||
        row.units > 100 ||
        row.drug?.components.some(
          (component) =>
            component.amount_mg !== null &&
            (!Number.isFinite(component.amount_mg) ||
              component.amount_mg <= 0 ||
              component.amount_mg > 1000000),
        ),
    )
  ) {
    error.value =
      'Renseignez des quantités positives : jusqu’à 100 unités par jour et 1 000 000 mg par ingrédient.'
    return
  }
  const active = new AbortController()
  controller?.abort()
  controller = active
  loading.value = true
  try {
    const response = await assessDrugs(
      drugs.map((drug) => drug.id),
      {
        age: profile.age === null || String(profile.age) === '' ? null : Number(profile.age),
        weight_kg:
          profile.weight_kg === null || String(profile.weight_kg) === ''
            ? null
            : Number(profile.weight_kg),
        conditions: condition.value ? [condition.value] : [],
      },
      active.signal,
      rows.value.map((row) => ({
        product_id: row.drug!.id,
        units_per_day: row.units,
        components: row.drug!.components.map((component) => ({
          component_id: component.id,
          amount_mg: component.amount_mg,
        })),
      })),
    )
    if (!active.signal.aborted) {
      result.value = response
      currentStep.value = 2
    }
  } catch (cause) {
    if (!active.signal.aborted) {
      currentStep.value = 1
      error.value =
        cause instanceof TypeError
          ? 'Backend inaccessible.'
          : cause instanceof Error
            ? cause.message
            : 'Analyse indisponible.'
    }
  } finally {
    if (!active.signal.aborted) loading.value = false
  }
}

async function loadScenario(scenario: Scenario) {
  rows.value = scenario.products.map((drug) => ({
    id: nextId++,
    drug: { ...drug, components: drug.components.map((component) => ({ ...component })) },
    units: 1,
  }))
  profile.age = scenario.profile.age
  profile.weight_kg = scenario.profile.weight_kg
  condition.value = scenario.profile.conditions[0] ?? ''
  selectedScenario.value = scenario.id
  await checkCompatibility()
}

async function seniorProfile() {
  profile.age = 72
  profile.weight_kg = 50
  await checkCompatibility()
}

function setQuantity(drug: Drug, id: string, amount: number | null) {
  const component = drug.components.find((component) => component.id === id)
  if (component) component.amount_mg = amount
}
function selectProduct(rowId: number, drug: Drug | null) {
  const row = rows.value.find((row) => row.id === rowId)
  if (row) {
    row.drug = drug
    row.units = 1
  }
}
async function doubleQuantities() {
  for (const row of rows.value) row.units = Math.min(100, row.units * 2)
  await checkCompatibility()
}
function amountLabel(value: number | null | undefined) {
  return value == null
    ? 'Quantité inconnue'
    : `${value.toLocaleString('fr-FR', { maximumFractionDigits: 5 })} mg/j`
}

function cellLabel(cell: { status: Status } | null | undefined) {
  return alertLabels[cell?.status ?? 'unknown']
}
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div class="explorer page-width">
    <header class="usage-heading">
      <h1>Reliez les informations, repérez les associations et comprenez le niveau d’alerte.</h1>
      <p>Une interaction non détectée ne signifie pas une absence de danger.</p>
    </header>
    <div class="utilization-layout">
      <aside class="usage-sidebar" aria-label="Étapes d’utilisation">
        <span class="sidebar-title">UTILISATION</span>
        <ol class="usage-steps">
          <li v-for="step in steps" :key="step.id">
            <button
              type="button"
              :class="{
                active: currentStep === step.id,
                completed: result && currentStep > step.id,
              }"
              :aria-current="currentStep === step.id ? 'step' : undefined"
              :disabled="loading || (step.id > 1 && !result)"
              @click="goToStep(step.id)"
            >
              <span class="step-number"
                ><NexusIcon
                  v-if="result && currentStep > step.id"
                  name="check"
                  :size="17"
                /><template v-else>{{ step.id }}</template></span
              >
              <span
                ><strong>{{ step.title }}</strong
                ><small>{{ step.description }}</small></span
              >
            </button>
          </li>
        </ol>
        <RouterLink to="/" class="sidebar-home"
          ><NexusIcon name="book" :size="16" /> Comprendre le projet</RouterLink
        >
      </aside>
      <div
        ref="stageContent"
        class="stage-content"
        tabindex="-1"
        :aria-label="`Étape ${currentStep} : ${steps[currentStep - 1]?.title}`"
      >
        <div v-if="currentStep > 1 && result" class="stage-actions">
          <button type="button" @click="goToStep(1)">Modifier la sélection</button>
          <button v-if="currentStep === 2" type="button" class="stage-next" @click="goToStep(3)">
            Voir le résumé <NexusIcon name="arrow" :size="17" />
          </button>
          <button v-else type="button" class="stage-next" @click="goToStep(2)">
            Revoir l’analyse <NexusIcon name="arrow" :size="17" />
          </button>
        </div>
        <section v-if="loading && currentStep > 1" class="stage-loading" role="status">
          Analyse en cours…
        </section>
        <section v-if="currentStep === 1" class="selection-panel" aria-label="Produits et profil">
          <div class="panel-heading">
            <div>
              <span class="section-kicker">VOTRE SÉLECTION</span>
              <h2>Qu’est-ce qu’on associe ?</h2>
            </div>
            <span class="selection-count"
              >{{ rows.filter((row) => row.drug).length }}<span>/ 5</span></span
            >
          </div>
          <section class="example-strip" aria-label="Exemples d’associations">
            <div class="example-buttons">
              <button
                v-for="(scenario, index) in scenarios"
                :key="scenario.id"
                type="button"
                :disabled="loading"
                :class="['example-button', { active: selectedScenario === scenario.id }]"
                @click="loadScenario(scenario)"
              >
                <span class="example-number">0{{ index + 1 }}</span
                >{{ scenario.title }}<NexusIcon name="arrow" :size="16" />
              </button>
            </div>
          </section>

          <form @submit.prevent="checkCompatibility">
            <div class="product-list">
              <div
                v-for="(row, index) in rows"
                :key="row.id"
                :class="['product-entry', `product-${index % 3}`]"
              >
                <div class="product-entry-top">
                  <span class="product-index"
                    ><NexusIcon
                      :name="
                        row.drug?.kind === 'medicine' || (!row.drug && index === 0)
                          ? 'pill'
                          : 'leaf'
                      "
                      :size="18" /></span
                  ><span>{{
                    row.drug?.display_kind ??
                    (row.drug
                      ? row.drug.kind === 'medicine'
                        ? 'Médicament'
                        : row.drug.kind === 'supplement'
                          ? 'Complément'
                          : 'Ingrédient'
                      : `Produit ${index + 1}`)
                  }}</span
                  ><button
                    v-if="rows.length > 2"
                    type="button"
                    class="remove-product"
                    :aria-label="`Retirer le produit ${index + 1}`"
                    @click="rows.splice(index, 1)"
                  >
                    <NexusIcon name="close" :size="15" /></button
                  ><NexusIcon v-else-if="row.drug" name="check" :size="15" class="entry-check" />
                </div>
                <DrugPicker
                  :id="`drug-${row.id}`"
                  :selected="row.drug"
                  :label="`Produit ${index + 1}`"
                  @select="selectProduct(row.id, $event)"
                />
                <CompositionEditor
                  v-if="row.drug"
                  :drug="row.drug"
                  :units="row.units"
                  @quantity="(id, amount) => setQuantity(row.drug!, id, amount)"
                  @units="row.units = $event"
                />
              </div>
            </div>
            <button
              type="button"
              :disabled="rows.length >= 5"
              class="add-product"
              @click="rows.push({ id: nextId++, drug: null, units: 1 })"
            >
              <NexusIcon name="plus" :size="16" /> Ajouter un produit
              <span>Jusqu’à 5 produits</span>
            </button>

            <details class="profile-panel">
              <summary>
                <span class="profile-symbol"><NexusIcon name="user" :size="17" /></span
                ><span
                  >Votre profil<small
                    >{{ profile.age ?? '—' }} ans · {{ profile.weight_kg ?? '—' }} kg{{
                      condition ? ` · ${condition}` : ''
                    }}</small
                  ></span
                ><NexusIcon name="chevron" :size="16" class="profile-chevron" />
              </summary>
              <div class="profile-fields">
                <label
                  >Âge <span>ans</span
                  ><input
                    v-model.number="profile.age"
                    aria-label="Âge (ans)"
                    type="number"
                    min="18"
                    max="110" /></label
                ><label
                  >Poids <span>kg</span
                  ><input
                    v-model.number="profile.weight_kg"
                    aria-label="Poids (kg)"
                    type="number"
                    min="30"
                    max="250"
                    step="0.1" /></label
                ><label class="condition-field"
                  >État du profil<select v-model="condition" aria-label="État du profil">
                    <option value="">Aucun sélectionné</option>
                    <option v-for="value in conditions" :key="value" :value="value">
                      {{ value }}
                    </option>
                  </select></label
                >
              </div>
            </details>

            <p v-if="error" role="alert" class="error-message">
              <NexusIcon name="info" :size="17" />{{ error }}
            </p>
            <button type="submit" :disabled="!ready" class="analyse-button">
              <NexusIcon v-if="loading" name="spark" :size="19" class="loading-icon" /><span>{{
                loading ? 'Analyse en cours…' : 'Analyser cette association'
              }}</span
              ><NexusIcon name="arrow" :size="20" />
            </button>
          </form>
        </section>

        <section
          v-if="currentStep === 2 && result"
          :class="['insight-panel', result?.status ?? 'empty']"
          aria-label="Résultat de l’association"
          aria-live="polite"
          :aria-busy="loading"
        >
          <div class="insight-heading">
            <span><NexusIcon name="scan" :size="18" /> ANALYSE DES ASSOCIATIONS</span
            ><span class="complete-badge"><span></span> Analyse terminée</span>
          </div>

          <div class="result-overview" :key="result.status">
            <div class="alert-symbol" aria-hidden="true">
              <NexusIcon :name="result.status === 'low' ? 'check' : 'info'" :size="48" />
            </div>
            <div class="result-summary">
              <span class="status-tag"><span></span>{{ alertColors[result.status] }}</span>
              <h2>{{ alertLabels[result.status] }}</h2>
              <p>
                {{
                  result.status === 'unknown'
                    ? 'Les données disponibles ne permettent pas de classer cette association.'
                    : 'Ce niveau tient compte des règles identifiées, du profil et des quantités disponibles.'
                }}
              </p>
            </div>
          </div>
          <div class="alert-legend" aria-label="Les trois niveaux d’alerte">
            <span class="critical"><i></i>Rouge · Danger</span>
            <span class="watch"><i></i>Orange · Risque modéré</span>
            <span class="low"><i></i>Vert · Risque faible</span>
          </div>
          <div class="result-products">
            <span v-for="(drug, index) in result.drugs" :key="drug.id"
              ><NexusIcon :name="drug.kind === 'medicine' ? 'pill' : 'leaf'" :size="13" />{{
                drug.name
              }}<b v-if="index < result.drugs.length - 1">+</b></span
            >
          </div>
          <div class="result-metrics">
            <div>
              <strong>{{ result.drugs.length.toString().padStart(2, '0') }}</strong
              ><span>produits croisés</span>
            </div>
            <div>
              <strong
                >{{ result.coverage.classified_pairs
                }}<small> / {{ result.coverage.total_pairs }}</small></strong
              ><span>paires reconnues</span>
            </div>
            <div>
              <strong>{{
                result.calculation.matched_rule_count.toString().padStart(2, '0')
              }}</strong
              ><span>règles retenues</span>
            </div>
          </div>

          <div class="contribution-heading">
            <h3>
              {{
                result.status === 'unknown' ? 'Évaluation indisponible' : 'Pourquoi cette alerte ?'
              }}
            </h3>
            <span>Les éléments pris en compte.</span>
          </div>
          <div v-if="reasons.length" class="reasons-grid">
            <div
              v-for="(reason, index) in reasons"
              :key="reason.label"
              :class="['reason-tile', `reason-${index}`]"
            >
              <p>{{ reason.label }}</p>
              <small>{{ reason.detail }}</small>
            </div>
          </div>
          <p v-if="result.ingredient_relations.length" class="quantity-explanation">
            {{ result.quantity_coverage.calculated_relations }} /
            {{ result.quantity_coverage.total_relations }}
            relations avec quantités pondérées. Pondération simulée ; une quantité inférieure ne
            supprime pas l’alerte.
          </p>
          <button
            v-if="result.quantity_coverage.calculated_relations"
            type="button"
            class="try-profile quantity-compare"
            @click="doubleQuantities"
          >
            <span
              ><NexusIcon name="spark" :size="17" /><span
                >Variation des quantités<small>Comparer ×2 · simulation</small></span
              ></span
            >
            <NexusIcon name="arrow" :size="20" />
          </button>
          <div v-if="!result.calculation.steps.length" class="unknown-message">
            <NexusIcon name="info" :size="18" /> Une relation non reconnue reste inconnue.
          </div>
          <button
            v-if="result.calculation.steps.length"
            type="button"
            class="try-profile"
            @click="seniorProfile"
          >
            <span
              ><NexusIcon name="user" :size="17" /><span
                >Et avec un autre profil ?<small>Essayer 72 ans et 50 kg</small></span
              ></span
            ><NexusIcon name="arrow" :size="20" />
          </button>
        </section>
        <section v-if="currentStep === 2 && result" class="details-section">
          <details
            v-if="result.ingredient_relations.length"
            class="association-details ingredient-details"
            open
          >
            <summary>
              <span class="detail-icon lavender"><NexusIcon name="link" :size="20" /></span>
              <span
                >Les ingrédients en relation<small
                  >Quantités journalières et niveau d’alerte de chaque relation.</small
                ></span
              >
              <NexusIcon name="chevron" :size="18" class="details-chevron" />
            </summary>
            <div class="ingredient-edges">
              <article
                v-for="relation in result.ingredient_relations"
                :key="relation.id"
                class="ingredient-edge"
              >
                <div class="edge-pair">
                  <span
                    ><strong>{{ relation.substance.name }}</strong
                    ><small>{{ amountLabel(relation.substance.daily_mg) }}</small></span
                  >
                  <NexusIcon name="link" :size="20" />
                  <span
                    ><strong>{{ relation.ingredient.name }}</strong
                    ><small>{{ amountLabel(relation.ingredient.daily_mg) }}</small></span
                  >
                  <b :class="['edge-alert', relation.status]">{{ alertLabels[relation.status] }}</b>
                </div>
                <p>{{ relation.mechanism }}</p>
                <p class="edge-quantity">
                  {{
                    relation.quantity_complete
                      ? 'Quantités prises en compte dans l’évaluation simulée.'
                      : 'Quantités ou référence manquantes : pondération non calculée.'
                  }}
                </p>
                <small>{{ relation.rule_id }} · {{ relation.mapping_note }}</small>
              </article>
            </div>
          </details>
          <details class="association-details" open>
            <summary>
              <span class="detail-icon lavender"><NexusIcon name="link" :size="20" /></span
              ><span
                >Les associations, une par une<small
                  >Retrouvez le niveau d’alerte de chaque paire de produits.</small
                ></span
              ><NexusIcon name="chevron" :size="18" class="details-chevron" />
            </summary>
            <div class="matrix-wrap" tabindex="0" aria-label="Tableau des associations">
              <table>
                <caption>
                  Une relation absente ne permet pas de conclure à l’absence de danger.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Vos produits</th>
                    <th v-for="drug in result.drugs" :key="drug.id" scope="col">{{ drug.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(drug, i) in result.drugs" :key="drug.id">
                    <th scope="row">{{ drug.name }}</th>
                    <td v-for="(cell, j) in result.risk_matrix[i]" :key="j">
                      <span
                        :class="['matrix-cell', i === j ? 'diagonal' : (cell?.status ?? 'unknown')]"
                        >{{ i === j ? '—' : cellLabel(cell) }}</span
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>

          <details class="association-details source-details">
            <summary>
              <span class="detail-icon peach"><NexusIcon name="book" :size="20" /></span
              ><span
                >Quelles informations ont été utilisées ?<small
                  >Ingrédients, mécanismes décrits et provenance des règles.</small
                ></span
              ><span class="rule-count"
                >{{ result.calculation.matched_rule_count }}
                {{ result.calculation.matched_rule_count > 1 ? 'règles' : 'règle' }}</span
              ><NexusIcon name="chevron" :size="18" class="details-chevron" />
            </summary>
            <div class="source-content">
              <article
                v-for="pair in result.pairs"
                :key="`${pair.drug_a.id}-${pair.drug_b.id}`"
                class="pair-details"
              >
                <h3>{{ pair.drug_a.name }} <span>+</span> {{ pair.drug_b.name }}</h3>
                <p v-if="!pair.rules.length" class="muted">
                  Aucune règle correspondante. Aucune conclusion de sécurité.
                </p>
                <div v-for="rule in pair.rules" :key="rule.id" class="rule-card">
                  <div>
                    <strong>{{ rule.ingredient }}</strong
                    ><span :class="['rule-severity', severityStatus(rule.severity)]">{{
                      alertLabels[severityStatus(rule.severity)]
                    }}</span>
                  </div>
                  <p class="rule-target">{{ rule.target }}</p>
                  <p>{{ rule.mechanism }}</p>
                  <p><strong>Conséquence décrite :</strong> {{ rule.consequence }}</p>
                  <small
                    >{{ rule.reference.sheet }}!{{ rule.reference.range }} · Niveau indiqué :
                    {{ rule.evidence_level }} · {{ rule.source_label }} (référence non
                    vérifiée)</small
                  >
                </div>
              </article>
              <div v-if="result.profile_alerts.length" class="profile-alerts">
                <h3>Règles liées au profil</h3>
                <p v-for="alert in result.profile_alerts" :key="alert.id">
                  {{ alert.ingredient }} + {{ alert.condition }} : {{ alert.risk }} ({{
                    alertLabels[severityStatus(alert.severity)]
                  }}
                  dans le classeur).
                </p>
              </div>
              <a class="source-download" :href="workbookUrl(result.source.workbook_url)"
                ><NexusIcon name="book" :size="16" /> Consulter le classeur source
                <NexusIcon name="arrow" :size="15"
              /></a>
            </div>
          </details>
        </section>

        <section
          v-if="currentStep === 3 && result"
          :class="['summary-panel', result.status]"
          aria-labelledby="summary-title"
        >
          <span class="section-kicker">VOTRE RÉSUMÉ</span>
          <h2 id="summary-title">L’essentiel de votre association</h2>
          <div :class="['summary-alert', result.status]">
            <NexusIcon :name="result.status === 'low' ? 'check' : 'info'" :size="26" />{{
              alertLabels[result.status]
            }}
          </div>
          <p v-if="result.status === 'unknown'">
            Les données disponibles ne permettent pas de classer cette association.
          </p>
          <p v-else>
            Ce niveau repose sur les règles identifiées, le profil et les quantités disponibles.
          </p>
          <div class="summary-profile">
            <NexusIcon name="user" :size="18" /><span
              >{{ profile.age ?? 'Âge non renseigné' }}{{ profile.age == null ? '' : ' ans' }} ·
              {{ profile.weight_kg ?? 'Poids non renseigné'
              }}{{ profile.weight_kg == null ? '' : ' kg'
              }}{{ condition ? ` · ${condition}` : '' }}</span
            >
          </div>
          <ul class="summary-products">
            <li v-for="drug in result.drugs" :key="drug.id">
              <strong>{{ drug.name }}</strong
              ><span v-for="component in drug.components" :key="component.id"
                >{{ component.name }} · {{ amountLabel(component.daily_mg) }}</span
              >
            </li>
          </ul>
          <div class="summary-coverage">
            <strong
              >{{ result.coverage.classified_pairs }} /
              {{ result.coverage.total_pairs }} associations documentées dans les données
              disponibles</strong
            >
            <p v-if="result.coverage.unknown_pairs">
              {{ result.coverage.unknown_pairs }} association(s) sans données suffisantes.
              L’évaluation reste incomplète.
            </p>
          </div>
          <p class="summary-notice">
            Une interaction non détectée ne signifie pas une absence de danger. Ce prototype ne
            remplace pas l’avis d’un professionnel de santé.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alert-symbol {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 110px;
  height: 110px;
  border-radius: 28px;
  background: #ffffffa8;
  color: var(--accent);
  box-shadow: 0 8px 24px #25253108;
}
.alert-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 17px;
  border-top: 1px solid #2525310c;
  padding-top: 16px;
  margin: 20px 0;
}
.alert-legend > span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--muted);
}
.alert-legend i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #df5f47;
}
.alert-legend .watch i {
  background: #df9d29;
}
.alert-legend .low i {
  background: #548d41;
}
.insight-panel.low {
  --accent: #548d41;
  background: #eff6e8;
  border-color: #dcebcf;
}
.low .status-tag {
  background: #dfedcf;
  color: #426d31;
}
.matrix-cell.low,
.rule-severity.low,
.edge-alert.low {
  background: #e3efd7;
  color: #426d31;
}
.edge-alert {
  flex-shrink: 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.4;
  background: #f9e9c8;
  color: #835c13;
  text-align: center;
}
.edge-alert.critical {
  background: #ffe3df;
  color: #b33e3b;
}
.edge-alert.unknown {
  background: #ece7f3;
  color: #756284;
}
.reason-tile > small {
  display: block;
  font-size: 11px;
  line-height: 1.6;
  color: #625d6c;
}
@media (max-width: 600px) {
  .alert-symbol {
    width: 72px;
    height: 72px;
    border-radius: 21px;
  }
  .alert-symbol svg {
    width: 36px;
    height: 36px;
  }
  .alert-legend {
    gap: 10px;
  }
  .edge-alert {
    flex-shrink: 1;
    font-size: 11px;
  }
}
.quantity-explanation {
  font-size: 11px;
  line-height: 1.6;
  color: var(--muted);
  margin: 12px 0;
}
.reason-4 {
  grid-column: 1 / -1;
  background: #eee6fa;
  color: #7551a8;
}
.quantity-compare {
  margin-top: 12px;
}
.ingredient-details {
  margin-bottom: 16px;
}
.ingredient-edges {
  padding: 0 28px 24px;
  display: grid;
  gap: 12px;
}
.ingredient-edge {
  padding: 18px;
  border-radius: 16px;
  background: #f8f7fc;
  border: 1px solid #ece8f8;
}
.edge-pair {
  display: flex;
  align-items: center;
  gap: 20px;
}
.edge-pair > span {
  flex: 1;
}
.edge-pair strong {
  display: block;
  font-size: 14px;
}
.edge-pair small {
  display: block;
  font-size: 11px;
  margin-top: 5px;
  color: var(--muted);
}
.ingredient-edge p {
  font-size: 12px;
  line-height: 1.6;
  margin: 12px 0 6px;
}
.ingredient-edge > small {
  display: block;
  font-size: 10px;
  line-height: 1.5;
  color: var(--muted);
}
.edge-quantity {
  color: var(--purple);
}
@media (max-width: 600px) {
  .ingredient-edges {
    padding: 0 14px 16px;
  }
  .edge-pair {
    gap: 10px;
    flex-wrap: wrap;
  }
  .edge-pair strong {
    font-size: 12px;
  }
}
.explorer {
  padding-top: 42px;
}
.explorer-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}
.explorer-heading h1 {
  font-size: clamp(30px, 3vw, 43px);
  font-weight: 650;
  letter-spacing: -1.7px;
  margin: 14px 0 12px;
  line-height: 1.2;
}
.explorer-heading h1 > span {
  color: var(--purple);
  margin-left: 0.2em;
}
.explorer-heading p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}
.mobile-break {
  display: none;
}
.heading-flower {
  margin-right: 7px;
  transform: rotate(14deg);
  color: var(--coral);
  --flower-center: var(--cream);
}
.example-strip {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 12px 0 19px;
  border-bottom: 1px solid var(--line);
}
.example-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #817a8a;
  font-size: 11px;
  white-space: nowrap;
}
.example-label svg {
  color: var(--purple);
}
.example-buttons {
  display: flex;
  gap: 10px;
  flex: 1;
}
.example-button {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e4e0ec;
  background: #fff;
  border-radius: 12px;
  padding: 10px 13px;
  font-size: 11px;
  font-weight: 600;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.example-button > svg {
  margin-left: 7px;
  color: var(--purple);
}
.example-button:hover,
.example-button.active {
  background: #f0ebff;
  border-color: #a58de7;
}
.example-number {
  display: grid;
  place-items: center;
  background: var(--lavender);
  color: var(--purple);
  width: 24px;
  height: 24px;
  border-radius: 8px;
  font-size: 9px;
}
.example-button:nth-child(2) .example-number {
  background: #eef3d7;
  color: #738545;
}
.workspace {
  display: grid;
  grid-template-columns: minmax(330px, 0.85fr) minmax(0, 1.35fr);
  gap: 22px;
  align-items: start;
}
.selection-panel {
  border: 1px solid #eeece6;
  border-radius: 24px;
  background: #fff;
  box-shadow: var(--shadow);
  padding: 26px;
}
.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 23px;
}
.section-kicker {
  color: #9a95a4;
  font-size: 9px;
  letter-spacing: 1.5px;
  font-weight: 700;
}
.panel-heading h2 {
  font-size: 19px;
  letter-spacing: -0.6px;
  font-weight: 650;
  margin: 8px 0 0;
}
.selection-count {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f3f0fa;
  border-radius: 9px;
  padding: 9px 10px;
  color: var(--purple);
  font-size: 15px;
  font-weight: 700;
}
.selection-count > span {
  font-size: 10px;
  color: #aaa1be;
  font-weight: 500;
}
.product-list {
  display: grid;
  gap: 13px;
}
.product-entry {
  padding: 14px 15px 12px;
  background: #f6f3ff;
  border: 1px solid #eae4fb;
  border-radius: 14px;
}
.product-entry.product-1 {
  background: #f3f7e9;
  border-color: #e5edcf;
}
.product-entry.product-2 {
  background: #fff3ea;
  border-color: #f6e0d1;
}
.product-entry-top {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8872b7;
  font-size: 9px;
  letter-spacing: 0.5px;
  font-weight: 650;
  margin-bottom: 6px;
}
.product-1 .product-entry-top {
  color: #728346;
}
.product-2 .product-entry-top {
  color: #b87b51;
}
.product-index {
  display: grid;
  place-items: center;
}
.entry-check {
  margin-left: auto;
}
.remove-product {
  display: grid;
  place-items: center;
  margin-left: auto;
  background: #ffffff80;
  border: 0;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  color: #8a7e9c;
}
.product-substance {
  color: #8e849d;
  font-size: 9px;
  line-height: 1.6;
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}
.product-1 .product-substance {
  color: #87916d;
}
.add-product {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--purple);
  font-size: 11px;
  font-weight: 600;
  background: transparent;
  border: 0;
  width: 100%;
  padding: 16px 0;
}
.add-product > span {
  margin-left: auto;
  font-size: 9px;
  font-weight: 400;
  color: #aaa3b3;
}
.profile-panel {
  margin: 3px 0 18px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.profile-panel summary {
  display: flex;
  align-items: center;
  gap: 10px;
  list-style: none;
  cursor: pointer;
  padding: 15px 0;
  font-size: 12px;
  font-weight: 600;
}
.profile-panel summary::-webkit-details-marker {
  display: none;
}
.profile-symbol {
  display: grid;
  place-items: center;
  background: #f2f0f7;
  color: #898093;
  width: 32px;
  height: 32px;
  border-radius: 10px;
}
.profile-panel summary small {
  display: block;
  font-size: 9px;
  font-weight: 400;
  color: var(--muted);
  margin-top: 4px;
  line-height: 1.5;
}
.profile-chevron {
  margin-left: auto;
  color: #a19aa9;
  transition: transform 0.2s;
}
.profile-panel[open] .profile-chevron {
  transform: rotate(180deg);
}
.profile-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
  padding: 0 0 15px;
}
.profile-fields label {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 7px;
  font-size: 10px;
  font-weight: 650;
  color: #777080;
}
.profile-fields label > span {
  font-weight: 400;
  color: #aaa3b3;
}
.profile-fields input,
.profile-fields select {
  grid-column: 1 / -1;
  width: 100%;
  min-width: 0;
  background: #faf9fc;
  border: 1px solid #e5e0ec;
  border-radius: 9px;
  padding: 10px;
  color: var(--ink);
  font-size: 12px;
}
.condition-field {
  grid-column: 1 / -1;
}
.analyse-button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  background: var(--coral);
  color: #fff;
  border: 0;
  border-radius: 12px;
  padding: 16px 18px;
  font-size: 12px;
  font-weight: 650;
  box-shadow: 0 5px 15px #ed724222;
  transition:
    background 0.2s,
    transform 0.2s;
}
.analyse-button:hover:not(:disabled) {
  background: #ed613b;
  transform: translateY(-1px);
}
.analyse-button:disabled {
  background: #e9e4df;
  box-shadow: none;
  color: #aaa19b;
  opacity: 1;
}
.loading-icon {
  animation: spin 2s linear infinite;
}
.selection-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 8px;
  color: #a39ba9;
  margin: 13px 0 0;
  line-height: 1.6;
  text-align: center;
}
.error-message {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #a63f45;
  background: #fff0ef;
  border-radius: 9px;
  padding: 12px;
  line-height: 1.6;
}
.insight-panel {
  --accent: #d54d47;
  --ring-track: #f5d9ce;
  background: #fff0e9;
  border: 1px solid #f5e2d7;
  border-radius: 24px;
  padding: 24px 28px;
  overflow: hidden;
  min-height: 590px;
}
.insight-panel.empty {
  background: var(--lavender);
  border-color: #e5ddf6;
}
.insight-panel.watch {
  --accent: #d99b27;
  --ring-track: #f2e4bd;
  background: #fcf5e5;
  border-color: #eee4ca;
}
.insight-panel.unknown {
  --accent: #8e83a8;
  --ring-track: #e6e0ef;
  background: #f0edf6;
  border-color: #e5dfef;
}
.insight-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.insight-heading > span:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #97705f;
  font-size: 9px;
  letter-spacing: 1.1px;
  font-weight: 650;
}
.empty .insight-heading > span:first-child {
  color: #8b73b7;
}
.complete-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 8px;
  background: #ffffffaa;
  border-radius: 20px;
  padding: 6px 9px;
  color: #92736a;
  white-space: nowrap;
}
.complete-badge > span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #9ba65e;
}
.waiting-badge {
  font-size: 9px;
  color: #9b88bb;
  border: 1px solid #daceed;
  border-radius: 20px;
  padding: 6px 10px;
}
.empty-result {
  text-align: center;
  padding: 28px 0 0;
}
.connection-art {
  position: relative;
  max-width: 290px;
  height: 190px;
  margin: 0 auto;
}
.connection-art > svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.connection-art > span {
  position: absolute;
  display: grid;
  place-items: center;
}
.orbit-pill {
  background: #fff;
  color: var(--purple);
  width: 77px;
  height: 77px;
  border-radius: 23px;
  left: 15px;
  top: 22px;
  transform: rotate(-12deg);
  box-shadow: 0 8px 18px #50397f0d;
}
.orbit-leaf {
  background: var(--lime);
  color: #697e3a;
  width: 76px;
  height: 76px;
  right: 9px;
  bottom: 12px;
  border-radius: 23px;
  transform: rotate(10deg);
}
.orbit-flower {
  background: var(--coral);
  color: #ffe4b9;
  --flower-center: var(--coral);
  width: 91px;
  height: 91px;
  border-radius: 26px;
  left: 106px;
  top: 60px;
  transform: rotate(10deg);
  box-shadow: 0 6px 19px #bb6d5b12;
}
.orbit-spark {
  right: 40px;
  top: 13px;
  font-size: 29px;
  color: #b7a3e2;
}
.empty-result h2 {
  font-size: 35px;
  letter-spacing: -1.3px;
  line-height: 1.15;
  font-weight: 600;
  margin: 17px 0;
}
.empty-result h2 > span {
  color: var(--purple);
}
.empty-result > p {
  font-size: 12px;
  line-height: 1.8;
  color: #9684ad;
  margin-bottom: 22px;
}
.empty-tags {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.empty-tags > span {
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 9px;
  color: #937eaf;
  background: #ffffff66;
  border: 1px solid #e4daf5;
}
.empty-tip {
  display: flex;
  gap: 7px;
  justify-content: center;
  align-items: center;
  margin: 32px 0 0;
  padding-top: 20px;
  border-top: 1px solid #ded4f0;
  color: #9b87b8;
  font-size: 9px;
}
.result-overview {
  display: flex;
  align-items: center;
  gap: 26px;
  margin: 24px 0 19px;
  animation: enter 0.4s ease-out;
}
.result-summary {
  min-width: 0;
}
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 650;
  color: #b15f47;
  background: #ffe0d3;
  border-radius: 20px;
  padding: 5px 9px;
}
.status-tag > span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}
.watch .status-tag {
  background: #f8e8b8;
  color: #a97723;
}
.unknown .status-tag {
  background: #e2d9ee;
  color: #8b72a5;
}
.result-summary h2 {
  font-size: 29px;
  font-weight: 650;
  letter-spacing: -1px;
  margin: 11px 0;
  line-height: 1.15;
}
.result-summary p {
  font-size: 12px;
  color: #8b7569;
  line-height: 1.8;
  margin: 0;
  max-width: 240px;
}
.result-products {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 17px;
  border-bottom: 1px solid #eacfbc77;
}
.result-products > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #9c7c6e;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.result-products b {
  font-size: 12px;
  font-weight: 400;
  color: #c29f8c;
  margin: 0 4px;
}
.result-metrics {
  display: flex;
  justify-content: space-around;
  background: #ffffff75;
  border-radius: 12px;
  padding: 14px 0;
  margin: 17px 0 20px;
}
.result-metrics > div {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  border-right: 1px solid #eadbd3;
}
.result-metrics > div:last-child {
  border: 0;
}
.result-metrics strong {
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.7px;
}
.result-metrics strong small {
  font-size: 12px;
  color: #baa79d;
  font-weight: 400;
}
.result-metrics > div > span {
  font-size: 10px;
  color: #8e7c72;
}
.contribution-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.contribution-heading h3 {
  font-size: 14px;
  font-weight: 650;
  margin: 0;
}
.contribution-heading > span {
  font-size: 8px;
  color: #b59f91;
}
.reasons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}
.reason-tile {
  background: #f1ebff;
  border: 1px solid #ede4fb;
  border-radius: 12px;
  padding: 12px;
  --point-color: #8e6ee5;
  --point-track: #eee8fb;
}
.reason-tile > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.reason-tile > div:first-child > span {
  font-size: 8px;
  color: #baa9d1;
}
.reason-tile strong {
  font-size: 20px;
  color: var(--point-color);
  font-weight: 600;
  letter-spacing: -0.8px;
}
.reason-tile p {
  font-size: 11px;
  color: #74627f;
  margin: 7px 0 10px;
}
.reason-1 {
  background: #fff0e3;
  --point-color: #dd8b61;
  --point-track: #fae9dd;
  border-color: #f2dfd0;
}
.reason-1 p,
.reason-1 > div:first-child > span {
  color: #b49a83;
}
.reason-2 {
  background: #eef5d9;
  --point-color: #83a142;
  --point-track: #eaf1d7;
  border-color: #e0e9ca;
}
.reason-2 p,
.reason-2 > div:first-child > span {
  color: #9ca982;
}
.reason-3 {
  background: #e6f2f4;
  --point-color: #579faf;
  --point-track: #e1f0f4;
  border-color: #d8e9ed;
}
.reason-3 p,
.reason-3 > div:first-child > span {
  color: #90adb3;
}
.try-profile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  border-top: 1px solid #eacfbc77;
  padding: 15px 0 0;
  margin-top: 17px;
  color: #a57e69;
}
.try-profile > span {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 9px;
  font-weight: 600;
}
.try-profile small {
  display: block;
  font-size: 8px;
  font-weight: 400;
  margin-top: 4px;
  color: #b49a88;
}
.unknown-message {
  display: flex;
  gap: 9px;
  font-size: 12px;
  padding: 20px 0;
  color: #84768c;
}
.details-section {
  margin-top: 25px;
  display: grid;
  gap: 12px;
}
.association-details {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 18px;
  overflow: hidden;
}
.association-details summary {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 19px 23px;
  list-style: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}
.association-details summary::-webkit-details-marker {
  display: none;
}
.detail-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  flex-shrink: 0;
}
.lavender {
  background: var(--lavender);
  color: var(--purple);
}
.peach {
  background: #ffe9db;
  color: #cf8861;
}
.association-details summary small {
  display: block;
  color: #a59cab;
  font-size: 9px;
  font-weight: 400;
  margin-top: 5px;
}
.details-chevron {
  margin-left: auto;
  color: #b3a7bd;
  transition: transform 0.2s;
}
.association-details[open] .details-chevron {
  transform: rotate(180deg);
}
.rule-count {
  margin-left: auto;
  color: #a396ae;
  font-size: 9px;
  background: #f4f0f8;
  padding: 6px 9px;
  border-radius: 20px;
}
.rule-count + .details-chevron {
  margin-left: 6px;
}
.matrix-wrap {
  overflow: auto;
  padding: 0 23px 20px;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 10px;
}
caption {
  caption-side: bottom;
  text-align: left;
  font-size: 8px;
  color: #aba1b1;
  padding-top: 13px;
}
th,
td {
  padding: 13px 15px;
  border-bottom: 1px solid #f0edf3;
}
thead th {
  font-size: 9px;
  color: #a59baa;
  font-weight: 500;
}
tbody th {
  font-weight: 600;
}
td {
  text-align: center;
}
.matrix-cell {
  display: inline-block;
  border-radius: 7px;
  min-width: 80px;
  padding: 8px 10px;
  font-size: 9px;
}
.matrix-cell.critical,
.rule-severity.critical {
  background: #ffe4e1;
  color: #b53f3b;
}
.matrix-cell.watch,
.rule-severity.watch {
  background: #fcf0cf;
  color: #b68d38;
}
.matrix-cell.unknown {
  background: #eeebf4;
  color: #9484a4;
}
.matrix-cell.diagonal {
  color: #c8c1cc;
}
.source-content {
  padding: 0 23px 22px;
}
.pair-details {
  border-top: 1px solid #eee9f2;
  padding-top: 17px;
  margin-top: 9px;
}
.pair-details h3 {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 13px;
}
.pair-details h3 > span {
  color: #baaac7;
  margin: 0 7px;
}
.pair-details > p {
  font-size: 11px;
}
.rule-card {
  border: 1px solid #ece6f3;
  border-radius: 12px;
  padding: 17px;
  margin-bottom: 10px;
  font-size: 11px;
  line-height: 1.8;
  color: #82738f;
}
.rule-card > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--ink);
}
.rule-card p {
  margin: 7px 0;
}
.rule-target {
  color: #b2a1bf;
  font-size: 10px;
}
.rule-card small {
  display: block;
  font-size: 9px;
  color: #b09dbb;
}
.rule-severity {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 9px;
}
.profile-alerts {
  background: #fff2d3;
  border-radius: 12px;
  padding: 16px;
  font-size: 11px;
  line-height: 1.7;
}
.profile-alerts h3 {
  font-size: 12px;
}
.source-download {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--purple);
  font-size: 10px;
  margin-top: 15px;
}
.explore-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 0 0;
  color: #aaa1b5;
  font-size: 10px;
  gap: 15px;
}
.explore-bottom > span:first-child {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #877997;
}
.explore-bottom svg {
  color: #bfaee2;
}
@media (min-width: 1600px) {
  .selection-panel {
    padding: 30px;
  }
  .insight-panel {
    padding: 27px 36px;
  }
  .result-summary h2 {
    font-size: 34px;
  }
}
@media (max-width: 1100px) {
  .workspace {
    grid-template-columns: minmax(315px, 0.95fr) minmax(0, 1.15fr);
    gap: 16px;
  }
  .selection-panel {
    padding: 21px;
  }
  .insight-panel {
    padding: 23px 21px;
  }
  .result-overview {
    gap: 15px;
  }
  .result-summary h2 {
    font-size: 25px;
  }
  .example-strip {
    gap: 12px;
  }
  .example-label {
    font-size: 10px;
  }
  .example-button {
    font-size: 10px;
    gap: 7px;
    padding: 9px;
  }
  .contribution-heading > span {
    display: none;
  }
  .explorer-heading h1 {
    font-size: 36px;
  }
}
@media (max-width: 850px) {
  .example-strip {
    align-items: start;
    flex-direction: column;
  }
  .example-buttons {
    width: 100%;
  }
  .example-button {
    flex: 1;
    justify-content: space-between;
  }
  .workspace {
    grid-template-columns: 1fr 1.15fr;
  }
  .selection-panel {
    padding: 17px;
  }
  .panel-heading h2 {
    font-size: 17px;
  }
  .insight-panel {
    padding: 21px 17px;
  }
  .result-overview {
    flex-direction: column;
    align-items: center;
    gap: 18px;
    text-align: center;
  }
  .result-summary p {
    max-width: 280px;
  }
  .result-summary h2 {
    font-size: 28px;
  }
  .result-products {
    justify-content: center;
  }
  .insight-panel {
    min-height: 620px;
  }
  .heading-flower {
    display: none;
  }
}
@media (max-width: 680px) {
  .explorer {
    padding-top: 30px;
  }
  .explorer-heading h1 {
    font-size: 34px;
    letter-spacing: -1.5px;
  }
  .mobile-break {
    display: block;
  }
  .explorer-heading h1 > span {
    margin-left: 0;
  }
  .explorer-heading p {
    font-size: 12px;
    max-width: 290px;
  }
  .example-buttons {
    flex-direction: column;
    gap: 7px;
  }
  .example-button {
    padding: 10px 12px;
  }
  .example-button > svg {
    margin-left: auto;
  }
  .workspace {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .selection-panel {
    padding: 22px;
  }
  .insight-panel {
    padding: 24px;
    min-height: 530px;
  }
  .result-overview {
    flex-direction: row;
    text-align: left;
    gap: 20px;
  }
  .result-summary h2 {
    font-size: 27px;
  }
  .result-products {
    justify-content: start;
  }
  .result-summary p {
    font-size: 12px;
  }
  .association-details summary {
    padding: 16px;
    gap: 10px;
    font-size: 12px;
  }
  .association-details summary small {
    font-size: 8px;
    line-height: 1.6;
  }
  .matrix-wrap {
    padding: 0 12px 16px;
  }
  th,
  td {
    padding: 10px 9px;
  }
  .rule-count {
    display: none;
  }
  .source-content {
    padding: 0 16px 18px;
  }
  .explore-bottom > span:last-child {
    display: none;
  }
  .empty-result {
    padding-top: 24px;
  }
  .empty-result h2 {
    font-size: 34px;
  }
  .empty-tip {
    margin-top: 25px;
  }
  .details-section {
    margin-top: 18px;
  }
}
@media (max-width: 390px) {
  .result-overview {
    flex-direction: column;
    text-align: center;
  }
  .result-products {
    justify-content: center;
  }
  .insight-heading > span:first-child {
    font-size: 8px;
  }
  .complete-badge {
    font-size: 7px;
  }
}

/* Utilisation: one visible stage, a persistent step navigator. */
.explorer {
  padding-top: 0;
}
.usage-heading {
  padding: 36px 0 30px;
}
.usage-heading h1 {
  max-width: 1000px;
  margin: 0;
  font-size: clamp(26px, 2.6vw, 35px);
  line-height: 1.3;
  letter-spacing: -1.1px;
  font-weight: 650;
}
.usage-heading p {
  margin: 13px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
}
.utilization-layout {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 30px;
  align-items: start;
}
.usage-sidebar {
  position: sticky;
  top: 25px;
  padding: 22px 0;
}
.sidebar-title {
  display: block;
  font-size: 10px;
  letter-spacing: 1.6px;
  font-weight: 700;
  color: var(--muted);
  margin: 0 0 22px 14px;
}
.usage-steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 9px;
}
.usage-steps button {
  display: flex;
  gap: 13px;
  align-items: center;
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  padding: 15px 12px;
  border-radius: 14px;
  color: #77717f;
  background: transparent;
}
.usage-steps button.active {
  background: var(--lavender);
  border-color: #e1d8fb;
  color: var(--purple);
}
.usage-steps button:disabled {
  opacity: 0.55;
  cursor: default;
}
.usage-steps strong {
  display: block;
  font-size: 14px;
  font-weight: 650;
}
.usage-steps small {
  display: block;
  font-size: 10px;
  line-height: 1.6;
  margin-top: 3px;
}
.step-number {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 31px;
  height: 31px;
  background: #eeece8;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 650;
}
.active .step-number {
  color: white;
  background: var(--purple);
}
.completed .step-number {
  background: #e2edce;
  color: #587332;
}
.sidebar-home {
  display: flex;
  gap: 9px;
  align-items: center;
  border-top: 1px solid var(--line);
  margin-top: 24px;
  padding: 23px 12px 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.6;
}
.stage-content {
  min-width: 0;
  scroll-margin-top: 24px;
  outline: none;
}
.stage-content .selection-panel {
  width: 100%;
  padding: 28px;
}
.stage-content .example-strip {
  border: 0;
  margin: 0 0 24px;
  padding: 0;
  display: block;
}
.stage-content .example-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.stage-content .example-button {
  padding: 10px 12px;
  font-size: 10px;
  flex: 1;
}
.stage-content .product-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.stage-content .product-entry {
  min-width: 0;
}
.stage-content .profile-panel {
  margin-top: 8px;
}
.stage-content .analyse-button {
  max-width: 100%;
}
.stage-content .insight-panel {
  min-height: 0;
}
.stage-content .details-section {
  margin-top: 18px;
}
.stage-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.stage-actions button {
  border: 1px solid var(--line);
  border-radius: 11px;
  padding: 11px 15px;
  background: white;
  font-size: 12px;
  color: var(--muted);
}
.stage-actions .stage-next {
  display: flex;
  gap: 12px;
  align-items: center;
  background: var(--purple);
  border-color: var(--purple);
  color: white;
}
.stage-loading {
  padding: 48px;
  border-radius: 20px;
  background: var(--lavender);
  color: var(--purple);
  text-align: center;
}
.summary-panel {
  background: white;
  border: 1px solid var(--line);
  border-radius: 24px;
  padding: 32px;
}
.summary-panel h2 {
  margin: 14px 0 24px;
  font-size: 29px;
  letter-spacing: -0.8px;
  font-weight: 650;
}
.summary-alert {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  padding: 16px 20px;
  background: #f9ebca;
  color: #966718;
  font-size: 22px;
  font-weight: 650;
  margin-bottom: 14px;
}
.summary-alert.critical {
  background: #ffe4e1;
  color: #b53f3b;
}
.summary-alert.low {
  background: #e3efd7;
  color: #426d31;
}
.summary-alert.unknown {
  background: #ece7f3;
  color: #756284;
}
.summary-panel > p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}
.summary-profile {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: var(--muted);
  padding: 16px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  margin: 22px 0;
}
.summary-products {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.summary-products li {
  padding: 18px;
  background: #f6f3fe;
  border-radius: 14px;
}
.summary-products li:nth-child(even) {
  background: #f1f5e8;
}
.summary-products strong {
  display: block;
  font-size: 14px;
  margin-bottom: 10px;
}
.summary-products li > span {
  display: block;
  font-size: 11px;
  line-height: 1.8;
  color: var(--muted);
}
.summary-coverage {
  padding: 20px 0;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.7;
}
.summary-coverage strong {
  font-weight: 600;
}
.summary-coverage p {
  margin: 8px 0 0;
  color: var(--muted);
}
.summary-panel .summary-notice {
  margin-bottom: 0;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  font-size: 11px;
}
@media (max-width: 1000px) {
  .utilization-layout {
    grid-template-columns: 175px minmax(0, 1fr);
    gap: 18px;
  }
  .stage-content .product-list {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .utilization-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .usage-sidebar {
    position: static;
    padding: 0;
  }
  .sidebar-title,
  .sidebar-home {
    display: none;
  }
  .usage-steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }
  .usage-steps button {
    gap: 8px;
    padding: 12px 8px;
  }
  .usage-steps small {
    display: none;
  }
  .usage-steps strong {
    font-size: 12px;
  }
  .step-number {
    width: 25px;
    height: 25px;
    border-radius: 8px;
    font-size: 11px;
  }
  .stage-content .selection-panel {
    padding: 22px;
  }
  .stage-content .result-overview {
    flex-direction: row;
    text-align: left;
  }
  .usage-heading {
    padding: 26px 0 22px;
  }
  .usage-heading h1 {
    font-size: 27px;
  }
  .summary-panel {
    padding: 23px;
  }
  .summary-panel h2 {
    font-size: 25px;
  }
}
@media (max-width: 480px) {
  .stage-actions {
    align-items: stretch;
  }
  .stage-actions button {
    font-size: 10px;
    padding: 10px;
  }
  .stage-content .example-buttons {
    flex-direction: column;
  }
  .stage-content .reasons-grid,
  .summary-products {
    grid-template-columns: 1fr;
  }
  .stage-content .result-summary h2 {
    font-size: 25px;
  }
  .stage-content .contribution-heading > span {
    display: none;
  }
  .usage-heading h1 {
    font-size: 25px;
  }
}
</style>
