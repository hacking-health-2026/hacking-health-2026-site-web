<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { searchWorkbookProducts, type Drug } from '@/services/api'
import NexusIcon from '@/components/NexusIcon.vue'

const props = defineProps<{
  id: string
  selected: Drug | null
  label: string
  relatedTo: string[]
}>()
const emit = defineEmits<{ select: [drug: Drug | null] }>()
const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const query = ref(props.selected?.name ?? '')
const open = ref(false)
const activeIndex = ref(-1)
const results = computed(() =>
  searchWorkbookProducts(query.value === props.selected?.name ? '' : query.value, props.relatedTo),
)
const listId = computed(() => `${props.id}-options`)
const activeId = computed(() =>
  open.value && activeIndex.value >= 0 && results.value[activeIndex.value]
    ? `${props.id}-option-${results.value[activeIndex.value]!.id}`
    : undefined,
)

watch(
  () => props.selected,
  (drug, previous) => {
    if (drug) query.value = drug.name
    else if (query.value === previous?.name) query.value = ''
  },
)
function openMenu() {
  open.value = true
  activeIndex.value = -1
}
function onInput(event: Event) {
  query.value = (event.target as HTMLInputElement).value
  open.value = true
  activeIndex.value = -1
  if (props.selected) emit('select', null)
}
function select(drug: Drug) {
  emit('select', structuredClone(drug))
  query.value = drug.name
  open.value = false
  activeIndex.value = -1
}
function toggle() {
  if (open.value) open.value = false
  else {
    input.value?.focus()
    openMenu()
  }
}
async function move(direction: number) {
  open.value = true
  if (!results.value.length) return
  activeIndex.value =
    activeIndex.value < 0
      ? direction > 0
        ? 0
        : results.value.length - 1
      : (activeIndex.value + direction + results.value.length) % results.value.length
  await nextTick()
  if (activeId.value) document.getElementById(activeId.value)?.scrollIntoView({ block: 'nearest' })
}
function chooseActive(event: KeyboardEvent) {
  if (!open.value) return
  event.preventDefault()
  const product = results.value[Math.max(0, activeIndex.value)]
  if (product) select(product)
}
function closeOutside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}
function closeOnBlur(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node | null)) open.value = false
}
onMounted(() => document.addEventListener('pointerdown', closeOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside))
</script>

<template>
  <div ref="root" class="picker" @focusout="closeOnBlur">
    <label :for="id">{{ label }}</label>
    <div class="picker-input">
      <input
        :id="id"
        ref="input"
        :value="query"
        role="combobox"
        type="text"
        autocomplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        :aria-expanded="open && results.length > 0"
        :aria-controls="listId"
        :aria-activedescendant="activeId"
        :aria-describedby="`${id}-hint`"
        placeholder="Choisir ou rechercher un produit…"
        :title="selected?.name"
        @input="onInput"
        @focus="openMenu"
        @click="openMenu"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter="chooseActive"
        @keydown.esc.stop.prevent="open = false"
      />
      <button
        type="button"
        class="dropdown-toggle"
        :aria-label="`${open ? 'Fermer' : 'Ouvrir'} la liste ${label}`"
        :aria-expanded="open && results.length > 0"
        :aria-controls="listId"
        @click="toggle"
      >
        <NexusIcon name="chevron" :size="18" :class="{ rotated: open }" />
      </button>
    </div>
    <small :id="`${id}-hint`" class="hint">{{
      selected
        ? 'Produit du classeur sélectionné'
        : relatedTo.length
          ? 'Produits avec une interaction renseignée avec votre sélection'
          : 'Médicaments et compléments du fichier Excel uniquement'
    }}</small>
    <div v-if="open && results.length" class="dropdown-panel">
      <div class="dropdown-heading">
        <NexusIcon name="book" :size="14" /><span>Produits du classeur</span
        ><strong>{{ results.length }}</strong>
      </div>
      <ul
        :id="listId"
        role="listbox"
        :aria-label="`Produits du classeur pour ${label}`"
        class="suggestions"
      >
        <li
          v-for="(drug, index) in results"
          :id="`${id}-option-${drug.id}`"
          :key="drug.id"
          role="option"
          :aria-selected="selected?.id === drug.id"
          :class="{ highlighted: index === activeIndex, chosen: selected?.id === drug.id }"
          @pointerdown.prevent
          @click="select(drug)"
        >
          <span class="option-icon"
            ><NexusIcon :name="drug.kind === 'medicine' ? 'pill' : 'leaf'" :size="16" /></span
          ><span class="option-text"
            ><strong>{{ drug.name }}</strong
            ><small>{{ drug.active_substance || drug.declared_ingredients }}</small></span
          ><span class="option-kind">{{
            drug.display_kind || (drug.kind === 'medicine' ? 'Médicament' : 'Complément')
          }}</span
          ><NexusIcon v-if="selected?.id === drug.id" name="check" :size="16" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.picker {
  position: relative;
  display: grid;
  gap: 4px;
  min-width: 0;
}
.picker:has(.dropdown-panel) {
  z-index: 25;
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
.picker-input {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
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
  color: #93849e;
  line-height: 1.6;
}
.dropdown-toggle {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  background: #ffffffa8;
  border: 1px solid #dfd5ed;
  color: #785b9b;
  border-radius: 9px;
}
.dropdown-toggle:hover {
  background: #eee6fa;
}
.dropdown-toggle svg {
  transition: transform 0.2s;
}
.dropdown-toggle .rotated {
  transform: rotate(180deg);
}
.dropdown-panel {
  position: absolute;
  left: -10px;
  right: -10px;
  top: calc(100% + 8px);
  background: white;
  border: 1px solid #ddd2eb;
  box-shadow: 0 15px 40px #3c245b24;
  border-radius: 14px;
  overflow: hidden;
  z-index: 40;
}
.dropdown-heading {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 12px 14px;
  font-size: 10px;
  font-weight: 700;
  color: #8a70a8;
  border-bottom: 1px solid #f0eaf7;
  background: #fcfaff;
}
.dropdown-heading strong {
  margin-left: auto;
  font-size: 10px;
  background: #ede5f7;
  padding: 3px 7px;
  border-radius: 20px;
}
.suggestions {
  padding: 5px;
  margin: 0;
  list-style: none;
  max-height: 310px;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #cbb8df transparent;
}
.suggestions li {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 9px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
}
.suggestions li:hover,
.suggestions li.highlighted {
  background: #f1eafb;
  border-color: #e0d0f0;
}
.suggestions li.chosen {
  background: #f5f1fb;
}
.option-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: #f0eafa;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #9670be;
}
.option-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.option-text strong {
  font-size: 12px;
  line-height: 1.4;
  font-weight: 650;
  color: #50415f;
}
.option-text small {
  font-size: 10px;
  line-height: 1.5;
  color: #9b8da7;
  overflow-wrap: anywhere;
}
.option-kind {
  font-size: 9px;
  line-height: 1.4;
  max-width: 85px;
  text-align: right;
  color: #8a7b97;
}
.suggestions li > svg {
  color: var(--purple);
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .dropdown-panel {
    left: 0;
    right: 0;
  }
  .suggestions {
    max-height: 260px;
  }
  .option-kind {
    display: none;
  }
  input {
    font-size: 15px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dropdown-toggle svg {
    transition: none;
  }
}
</style>
