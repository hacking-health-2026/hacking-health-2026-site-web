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

watch(
  () => props.selected,
  (drug) => {
    if (drug) query.value = drug.name
  },
)

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
      if (!active.signal.aborted)
        error.value = 'La recherche est momentanément indisponible. Réessayez dans un instant.'
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
    <input
      :id="id"
      v-model="query"
      type="search"
      autocomplete="off"
      placeholder="Rechercher un produit…"
      :title="selected?.name"
      :aria-describedby="`${id}-hint`"
    />
    <small :id="`${id}-hint`" class="hint">{{
      selected ? 'Produit identifié' : 'Une marque, une plante ou un complément'
    }}</small>
    <p v-if="loading" role="status">Recherche…</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <ul v-if="results.length" class="suggestions" :aria-label="`Résultats pour ${label}`">
      <li v-for="drug in results" :key="drug.id">
        <button type="button" @click="select(drug)">
          {{ drug.name }}
          <small>{{
            drug.kind === 'medicine'
              ? 'Médicament'
              : drug.kind === 'supplement'
                ? 'Complément'
                : 'Ingrédient'
          }}</small>
        </button>
      </li>
    </ul>
    <p v-else-if="searched && !selected" role="status" class="hint">
      Aucun produit trouvé dans le catalogue.
    </p>
  </div>
</template>

<style scoped>
.picker {
  position: relative;
  display: grid;
  gap: 4px;
  min-width: 0;
}
label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 6px 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.4;
  color: #4a3c63;
  border-radius: 4px;
}
input::placeholder {
  font-size: 13px;
  letter-spacing: 0;
  color: #b3a5c7;
  font-weight: 400;
}
input:focus {
  outline: 0;
  box-shadow: 0 2px 0 #b49add;
}
.hint {
  font-size: 10px;
  color: #aaa0b6;
  line-height: 1.6;
}
.error {
  font-size: 10px;
  line-height: 1.5;
  color: #a04645;
  margin: 5px 0;
}
.picker > p[role='status'] {
  font-size: 10px;
  color: #94819e;
  margin: 4px 0;
}
.suggestions {
  position: absolute;
  left: -8px;
  right: -8px;
  top: 100%;
  z-index: 30;
  list-style: none;
  margin: 7px 0 0;
  padding: 5px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e4daee;
  box-shadow: 0 14px 30px #38214f20;
  max-height: 240px;
  overflow-y: auto;
}
.suggestions li + li {
  border-top: 1px solid #f3eff7;
}
.suggestions button {
  display: block;
  background: transparent;
  border: 0;
  text-align: left;
  width: 100%;
  padding: 11px 10px;
  border-radius: 8px;
  color: #51425e;
  font: inherit;
  font-size: 12px;
}
.suggestions button:hover,
.suggestions button:focus-visible {
  background: #f3edff;
  outline: none;
}
.suggestions small {
  display: block;
  font-size: 9px;
  color: #b09cbd;
  margin-top: 4px;
}
</style>
