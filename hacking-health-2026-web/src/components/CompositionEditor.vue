<script setup lang="ts">
import type { Drug } from '@/services/api'

const props = defineProps<{ drug: Drug; units: number }>()
const emit = defineEmits<{
  quantity: [id: string, amount: number | null]
  units: [value: number]
}>()
function updateAmount(id: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('quantity', id, value === '' ? null : Number(value))
}
function format(value: number) {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 5 })
}
</script>

<template>
  <div class="composition-editor">
    <div class="composition-heading">
      <strong>{{ drug.kind === 'medicine' ? 'Principes actifs' : 'Ingrédients déclarés' }}</strong>
      <span>mg / unité</span>
    </div>
    <div v-for="component in drug.components" :key="component.id" class="component-row">
      <label :for="`amount-${component.id}`">
        {{ component.name }}
        <small v-if="component.basis === 'plant_extract'">Masse d’extrait végétal</small>
        <small v-if="component.demo_reference_mg === null"
          >Référence quantitative non disponible</small
        >
        <small
          v-if="
            component.demo_reference_mg !== null &&
            component.amount_mg !== component.demo_reference_mg
          "
        >
          Valeur modifiée · initiale : {{ format(component.demo_reference_mg) }} mg
        </small>
      </label>
      <input
        :id="`amount-${component.id}`"
        type="number"
        min="0.000001"
        max="1000000"
        step="any"
        inputmode="decimal"
        :value="component.amount_mg"
        :aria-label="`${component.name} dans ${drug.name} en mg par unité`"
        placeholder="À préciser"
        @input="updateAmount(component.id, $event)"
      />
    </div>
    <label class="daily-units">
      <span
        >Quantité par jour <small>{{ drug.unit_label }}(s)</small></span
      >
      <input
        type="number"
        min="0.01"
        max="100"
        step="any"
        :aria-label="`Unités par jour de ${drug.name}`"
        :value="units"
        @input="emit('units', Number(($event.target as HTMLInputElement).value))"
      />
    </label>
    <p class="daily-total">
      <template v-for="(component, index) in drug.components" :key="component.id">
        <span v-if="index"> · </span>{{ component.name }} :
        {{
          component.amount_mg == null
            ? 'quantité inconnue'
            : `${format(component.amount_mg * props.units)} mg/j`
        }}
      </template>
    </p>
    <p class="composition-note">{{ drug.composition_note }}</p>
    <a
      v-if="drug.composition_source"
      :href="drug.composition_source.url"
      target="_blank"
      rel="noopener noreferrer"
      class="composition-source"
    >
      {{ drug.composition_source.label }} ↗
      <span>· {{ drug.formulation }} · RCP du {{ drug.composition_source.updated_at }}</span>
    </a>
  </div>
</template>

<style scoped>
.composition-editor {
  margin-top: 12px;
  border-top: 1px solid #25253112;
  padding-top: 12px;
}
.composition-heading {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  margin-bottom: 8px;
}
.composition-heading span {
  color: var(--muted);
  white-space: nowrap;
}
.component-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 7px 0;
}
.component-row label {
  flex: 1;
  font-size: 12px;
  line-height: 1.4;
}
.component-row small {
  display: block;
  color: var(--muted);
  font-size: 10px;
}
input {
  width: 91px;
  min-width: 0;
  border: 1px solid #25253115;
  border-radius: 8px;
  background: #ffffffc9;
  padding: 8px;
  color: var(--ink);
  font: inherit;
  font-size: 12px;
  text-align: right;
}
input:focus {
  outline: 2px solid var(--purple);
  outline-offset: 2px;
}
.daily-units {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
}
.daily-units small {
  display: block;
  font-size: 10px;
  font-weight: 400;
  color: var(--muted);
  margin-top: 3px;
}
.daily-total {
  font-size: 10px;
  line-height: 1.6;
  margin: 10px 0;
}
.composition-note {
  font-size: 10px;
  line-height: 1.5;
  color: var(--muted);
  margin: 8px 0;
}
.composition-source {
  display: block;
  font-size: 10px;
  color: var(--purple);
  line-height: 1.5;
}
.composition-source span {
  color: var(--muted);
}
</style>
