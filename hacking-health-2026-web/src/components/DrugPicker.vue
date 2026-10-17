<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { searchDrugs, type Drug } from '@/services/api'

const props = defineProps<{ id: string; selected: Drug | null; label: string }>()
const emit = defineEmits<{ select: [drug: Drug | null] }>()
const query = ref(props.selected?.name ?? '')
const results = ref<Drug[]>([])
const loading = ref(false)
const error = ref('')
const searched = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined

function cancel() {
  clearTimeout(timer)
  controller?.abort()
  loading.value = false
}

watch(() => props.selected, (drug) => {
  if (drug) query.value = drug.name
})

watch(query, (value) => {
  cancel()
  results.value = []
  error.value = ''
  searched.value = false
  if (props.selected?.name === value) return
  if (props.selected) emit('select', null)
  if (value.trim().length < 2) return
  timer = setTimeout(async () => {
    const active = new AbortController()
    controller = active
    loading.value = true
    try {
      const drugs = await searchDrugs(value.trim(), active.signal)
      if (!active.signal.aborted) {
        results.value = drugs
        searched.value = true
      }
    } catch {
      if (!active.signal.aborted) error.value = 'Recherche indisponible. Vérifiez que le backend est démarré.'
    } finally {
      if (!active.signal.aborted) loading.value = false
    }
  }, 200)
})

function select(drug: Drug) {
  cancel()
  emit('select', drug)
  query.value = drug.name
  results.value = []
  searched.value = false
}

onBeforeUnmount(cancel)
</script>

<template>
  <div class="picker">
    <label :for="id">{{ label }}</label>
    <input :id="id" v-model="query" type="search" autocomplete="off"
      placeholder="Ex. Leeloo, Millepertuis, Xanax…" :aria-describedby="`${id}-hint`" />
    <small :id="`${id}-hint`" class="hint">
      {{ selected ? `Sélectionné : ${selected.id}` : 'Recherchez une marque, un complément ou un ingrédient du classeur.' }}
    </small>
    <p v-if="loading" role="status">Recherche…</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <ul v-if="results.length" class="suggestions" :aria-label="`Résultats pour ${label}`">
      <li v-for="drug in results" :key="drug.id">
        <button type="button" @click="select(drug)">{{ drug.name }} <small>{{ drug.kind === 'medicine' ? 'Médicament' : drug.kind === 'supplement' ? 'Complément' : 'Ingrédient' }} · {{ drug.id }}</small></button>
      </li>
    </ul>
    <p v-else-if="searched && !selected" role="status" class="hint">Aucun produit trouvé dans le classeur de démonstration.</p>
  </div>
</template>

<style scoped>
.picker { display: grid; gap: .5rem; flex: 1; min-width: 0; }
label { font-weight: 650; color: #1d3557; }
input { box-sizing: border-box; width: 100%; padding: .85rem 1rem; border: 1px solid #a6b9c5; border-radius: 8px; font: inherit; background: #fafcfd; }
input:focus { outline: 3px solid #a8dadc; outline-offset: 1px; }
.hint { color: #566575; font-size: .82rem; line-height: 1.5; }
.error { color: #a9192c; }
.suggestions { list-style: none; margin: 0; padding: .3rem; border: 1px solid #a6b9c5; border-radius: 8px; max-height: 230px; overflow-y: auto; }
.suggestions button { border: 0; background: white; width: 100%; text-align: left; padding: .65rem; cursor: pointer; color: #1d3557; font: inherit; border-radius: 4px; }
.suggestions button:hover, .suggestions button:focus { background: #e5f3f3; }
.suggestions small { display: block; color: #566575; }
</style>
