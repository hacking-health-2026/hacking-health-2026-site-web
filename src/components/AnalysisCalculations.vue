<script setup lang="ts">
import { computed } from 'vue'
import type { Assessment } from '@/services/api'
import NexusIcon from './NexusIcon.vue'
const props = defineProps<{
  result: Assessment
  intakes: { product_id: string; units_per_day: number }[]
}>()
const number = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 8 })
const units = (id: string) => props.intakes.find((i) => i.product_id === id)?.units_per_day ?? 1
const rules = computed(() => [
  ...new Map(props.result.pairs.flatMap((p) => p.rules).map((r) => [r.id, r])).values(),
])
const sourceRule = (id: string) => rules.value.find((r) => r.id === id)
</script>
<template>
  <section class="calculation-details" aria-labelledby="math-title">
    <header>
      <span class="math-kicker">DE LA COMPOSITION À L’ASSOCIATION</span>
      <h3 id="math-title">Le calcul, pas à pas.</h3>
      <p>
        Les quantités sont calculées à partir des valeurs renseignées. Les relations proviennent du
        classeur importé.
      </p>
    </header>
    <article class="math-step daily-step">
      <span class="step-label">01 · Quantité journalière</span>
      <p class="math-definition">Quantité par unité × unités par jour</p>
      <div v-for="drug in result.drugs" :key="drug.id" class="dose-product">
        <h4>{{ drug.name }}</h4>
        <div v-for="component in drug.components" :key="component.id" class="dose-line">
          <span>{{ component.name }}</span>
          <strong v-if="component.amount_mg != null && component.daily_mg != null"
            >{{ number(component.amount_mg) }} mg × {{ number(units(drug.id)) }} =
            {{ number(component.daily_mg) }} mg/j</strong
          >
          <small v-else>Quantité absente : calcul non disponible.</small>
        </div>
      </div>
    </article>
    <article v-if="result.ingredient_relations.length" class="math-step exposure-step">
      <span class="step-label">02 · Rapport entre les quantités</span>
      <p class="math-definition">Racine carrée du produit des deux rapports à leur référence.</p>
      <div v-for="relation in result.ingredient_relations" :key="relation.id" class="exposure-line">
        <h4>
          {{ relation.substance.name }} <NexusIcon name="link" :size="17" />
          {{ relation.ingredient.name }}
        </h4>
        <template
          v-if="
            relation.quantity_complete &&
            relation.exposure_factor != null &&
            relation.substance.daily_mg != null &&
            relation.ingredient.daily_mg != null &&
            relation.substance.demo_reference_mg &&
            relation.ingredient.demo_reference_mg
          "
        >
          <p class="equation">
            √[({{ number(relation.substance.daily_mg) }} /
            {{ number(relation.substance.demo_reference_mg) }}) × ({{
              number(relation.ingredient.daily_mg)
            }}
            / {{ number(relation.ingredient.demo_reference_mg) }})]
          </p>
          <strong class="exposure-value"
            >{{ number(relation.exposure_factor) }} ×
            <span>la référence de présentation</span></strong
          >
        </template>
        <p v-else>Les quantités ou les références manquent : ce rapport n’est pas calculé.</p>
        <small v-if="sourceRule(relation.rule_id)"
          >{{ relation.rule_id }} · {{ sourceRule(relation.rule_id)!.reference.sheet }}, ligne
          {{ sourceRule(relation.rule_id)!.reference.row }}</small
        >
      </div>
      <p class="math-note">
        Formule exploratoire de démonstration. La référence correspond à une unité de présentation,
        pas à une dose thérapeutique. Ce rapport n’est pas une probabilité de complication et une
        valeur plus faible ne supprime pas une alerte.
      </p>
    </article>
    <article class="math-step relation-step">
      <span class="step-label">03 · Ce que disent les données</span>
      <div v-for="rule in rules" :key="rule.id" class="rule-explanation">
        <h4>{{ rule.ingredient }} + {{ rule.target }}</h4>
        <p>{{ rule.mechanism }}</p>
        <strong>{{ rule.consequence }}</strong>
        <small
          >{{ rule.id }} · {{ rule.reference.sheet }}, ligne {{ rule.reference.row }} · Gravité du
          classeur : {{ rule.severity }}</small
        >
      </div>
      <p v-if="!rules.length">
        Aucune relation de paire applicable dans le classeur : le calcul ne permet pas de conclure.
      </p>
    </article>
  </section>
</template>
<style scoped>
.calculation-details {
  margin-top: 22px;
  min-width: 0;
}
.math-kicker {
  color: #8a689d;
  letter-spacing: 1px;
  font-size: 13px;
  font-weight: 750;
}
h3 {
  font-size: 28px;
  margin: 10px 0;
  line-height: 1.25;
}
header p {
  font-size: 17px;
  color: #74657b;
  line-height: 1.55;
}
.math-step {
  margin-top: 16px;
  padding: 22px;
  border-radius: 18px;
  border: 1px solid #ded3f1;
  background: #f3eefe;
}
.step-label {
  font-size: 16px;
  font-weight: 750;
  color: #7150ad;
}
.math-definition {
  font-size: 18px;
  line-height: 1.5;
  margin: 10px 0 18px;
}
h4 {
  font-size: 18px;
  line-height: 1.4;
  margin: 0 0 10px;
}
.dose-product + .dose-product,
.exposure-line + .exposure-line,
.rule-explanation + .rule-explanation {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #30233b18;
}
.dose-line {
  display: grid;
  gap: 5px;
  margin-top: 12px;
  font-size: 17px;
}
.dose-line strong {
  font-size: 20px;
  color: #5b428b;
  overflow-wrap: anywhere;
}
.exposure-step {
  background: #fff2e4;
  border-color: #f0dac1;
}
.exposure-step .step-label {
  color: #9d602c;
}
.exposure-line h4 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.exposure-line p,
.rule-explanation p {
  font-size: 17px;
  line-height: 1.5;
}
.equation {
  background: #ffffffb8;
  border-radius: 12px;
  padding: 14px;
  font-size: 20px !important;
  font-weight: 650;
  overflow-wrap: anywhere;
}
.exposure-value {
  display: block;
  font-size: 27px;
  color: #9a5d24;
  margin-bottom: 9px;
}
.exposure-value span {
  font-size: 16px;
  font-weight: 500;
}
small {
  display: block;
  font-size: 13px;
  line-height: 1.6;
  color: #786675;
}
.math-note {
  font-size: 14px;
  line-height: 1.6;
  margin: 18px 0 0;
  color: #806c5b;
}
.relation-step {
  background: #eaf4f1;
  border-color: #cee5dd;
}
.relation-step .step-label {
  color: #3b7868;
}
.rule-explanation {
  margin-top: 16px;
}
.rule-explanation strong {
  display: block;
  font-size: 17px;
  margin-bottom: 10px;
}
@media (max-width: 600px) {
  .math-step {
    padding: 17px;
  }
  h3 {
    font-size: 25px;
  }
  .equation {
    font-size: 18px !important;
  }
}
</style>
