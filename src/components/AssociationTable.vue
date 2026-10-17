<script setup lang="ts">
import { computed } from 'vue'
import type { Assessment, Component } from '@/services/api'
import { alertLabels } from '@/services/alerts'
const props = defineProps<{ result: Assessment }>()
const amount = (component: Component) =>
  component.daily_mg == null
    ? 'Quantité inconnue'
    : `${component.daily_mg.toLocaleString('fr-FR', { maximumFractionDigits: 5 })} mg/j`
const associations = computed(() =>
  props.result.pairs.map((pair) => {
    const aIds = new Set(pair.drug_a.components.map((c) => c.id))
    const bIds = new Set(pair.drug_b.components.map((c) => c.id))
    const relations = props.result.ingredient_relations.filter(
      (r) =>
        (aIds.has(r.substance.id) && bIds.has(r.ingredient.id)) ||
        (bIds.has(r.substance.id) && aIds.has(r.ingredient.id)),
    )
    return { pair, relations }
  }),
)
</script>
<template>
  <div class="associations" aria-label="Relations entre produits">
    <section
      v-for="entry in associations"
      :key="`${entry.pair.drug_a.id}-${entry.pair.drug_b.id}`"
      class="association"
    >
      <header class="association-heading">
        <span :class="['alert', entry.pair.status]">{{ alertLabels[entry.pair.status] }}</span>
        <h3>Explications de l’analyse</h3>
      </header>
      <article v-for="relation in entry.relations" :key="relation.id" class="relation">
        <strong
          >{{ relation.substance.name }} <span class="link">↔</span>
          {{ relation.ingredient.name }}</strong
        >
        <small class="amounts"
          >{{ amount(relation.substance) }} ↔ {{ amount(relation.ingredient) }}</small
        >
        <p>{{ relation.mechanism }}</p>
        <p
          v-if="entry.pair.rules.find((r) => r.id === relation.rule_id)?.consequence"
          class="consequence"
        >
          {{ entry.pair.rules.find((r) => r.id === relation.rule_id)?.consequence }}
        </p>
        <small>{{ relation.rule_id }} · {{ relation.mapping_note }}</small>
      </article>
      <template v-if="!entry.relations.length">
        <article v-for="rule in entry.pair.rules" :key="rule.id" class="relation">
          <strong>{{ rule.ingredient }} ↔ {{ rule.target }}</strong>
          <p>{{ rule.mechanism }}</p>
          <p class="consequence">{{ rule.consequence }}</p>
          <small>{{ rule.id }} · {{ rule.reference.sheet }}, ligne {{ rule.reference.row }}</small>
        </article>
        <p v-if="!entry.pair.rules.length" class="missing">
          Aucune relation documentée dans les données disponibles.
        </p>
      </template>
    </section>
    <p class="notice">Une relation absente ne signifie pas une absence de danger.</p>
  </div>
</template>
<style scoped>
.associations {
  margin: 0 20px 24px;
}
.association {
  padding: 24px;
  border: 1px solid #e5def5;
  border-radius: 18px;
  font-size: 17px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
.association + .association {
  margin-top: 18px;
}
.association-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e8e2f2;
}
h3 {
  margin: 0;
  font-size: 22px;
  line-height: 1.4;
  color: #42374f;
}
.relation {
  margin-top: 18px;
}
.relation + .relation {
  border-top: 1px solid #e8e2f2;
  padding-top: 18px;
}
.relation strong {
  color: #42374f;
}
.link {
  color: #9472c5;
}
.amounts {
  margin-top: 5px;
  color: #796091;
}
p {
  margin: 12px 0;
}
.consequence {
  font-weight: 600;
}
small {
  display: block;
  color: #736b80;
  font-size: 13px;
}
.alert {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}
.critical {
  color: #a42538;
  background: #ffe1e6;
}
.watch {
  color: #8c4c12;
  background: #ffead0;
}
.low {
  color: #22684e;
  background: #def4e8;
}
.unknown {
  color: #5c5870;
  background: #efedf5;
}
.missing,
.notice {
  color: #736b80;
}
.notice {
  font-size: 15px;
  margin: 16px 0 0;
}
@media (max-width: 600px) {
  .associations {
    margin: 0 12px 16px;
  }
  .association {
    padding: 18px;
  }
  h3 {
    font-size: 20px;
  }
}
</style>
