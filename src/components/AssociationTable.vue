<script setup lang="ts">
import { computed } from 'vue'
import type { Assessment, Component, IngredientRelation } from '@/services/api'
import { alertLabels } from '@/services/alerts'
const props = defineProps<{ result: Assessment }>()
const amount = (component: Component) =>
  component.daily_mg == null
    ? 'Quantité inconnue'
    : `${component.daily_mg.toLocaleString('fr-FR', { maximumFractionDigits: 5 })} mg/j`
const entries = computed(() =>
  props.result.pairs.flatMap<{
    pair: Assessment['pairs'][number]
    relation: IngredientRelation | null
  }>((pair) => {
    const ids = new Set([...pair.drug_a.components, ...pair.drug_b.components].map((c) => c.id))
    const relations = props.result.ingredient_relations.filter(
      (r) => ids.has(r.substance.id) && ids.has(r.ingredient.id),
    )
    return relations.length
      ? relations.map((relation) => ({ pair, relation }))
      : [{ pair, relation: null }]
  }),
)
</script>
<template>
  <div
    class="table-scroll"
    tabindex="0"
    role="region"
    aria-label="Associations et principes actifs"
  >
    <table>
      <caption>
        Une relation absente ne permet pas de conclure à l’absence de danger. Les quantités
        inconnues restent affichées comme telles.
      </caption>
      <thead>
        <tr>
          <th scope="col">Produits associés</th>
          <th scope="col">Principes actifs · quantité par jour</th>
          <th scope="col">Relation et explication</th>
          <th scope="col">Niveau d’alerte</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, index) in entries"
          :key="`${entry.pair.drug_a.id}-${entry.pair.drug_b.id}-${index}`"
        >
          <th scope="row">
            <strong>{{ entry.pair.drug_a.name }}</strong
            ><span class="plus">+</span><strong>{{ entry.pair.drug_b.name }}</strong>
          </th>
          <td>
            <template v-if="entry.relation">
              <div class="component">
                <strong>{{ entry.relation.substance.name }}</strong
                ><span>{{ amount(entry.relation.substance) }}</span>
              </div>
              <span class="connector" aria-label="en relation avec">↕</span>
              <div class="component">
                <strong>{{ entry.relation.ingredient.name }}</strong
                ><span>{{ amount(entry.relation.ingredient) }}</span>
              </div>
            </template>
            <template v-else>
              <div
                v-for="drug in [entry.pair.drug_a, entry.pair.drug_b]"
                :key="drug.id"
                class="fallback-product"
              >
                <div v-for="component in drug.components" :key="component.id" class="component">
                  <strong>{{ component.name }}</strong
                  ><span>{{ amount(component) }}</span>
                </div>
                <span v-if="!drug.components.length"
                  >Composition non renseignée pour {{ drug.name }}.</span
                >
              </div>
            </template>
          </td>
          <td>
            <template v-if="entry.relation">
              <p>{{ entry.relation.mechanism }}</p>
              <p
                v-if="entry.pair.rules.find((r) => r.id === entry.relation!.rule_id)?.consequence"
                class="consequence"
              >
                {{ entry.pair.rules.find((r) => r.id === entry.relation!.rule_id)?.consequence }}
              </p>
              <small>{{ entry.relation.rule_id }} · {{ entry.relation.mapping_note }}</small>
              <small class="quantity-note">{{
                entry.relation.quantity_complete
                  ? 'Quantités prises en compte dans l’évaluation simulée.'
                  : 'Quantités ou référence manquantes : pondération non calculée.'
              }}</small>
            </template>
            <template v-else-if="entry.pair.rules.length">
              <div v-for="rule in entry.pair.rules" :key="rule.id">
                <p>{{ rule.mechanism }}</p>
                <p class="consequence">{{ rule.consequence }}</p>
                <small
                  >{{ rule.id }} · {{ rule.reference.sheet }}, ligne {{ rule.reference.row }}</small
                >
              </div>
            </template>
            <p v-else>Aucune relation documentée pour cette paire dans les données disponibles.</p>
          </td>
          <td>
            <span :class="['alert', entry.relation?.status ?? entry.pair.status]">{{
              alertLabels[entry.relation?.status ?? entry.pair.status]
            }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
.table-scroll {
  overflow-x: auto;
  margin: 0 20px 24px;
  border: 1px solid #e5def5;
  border-radius: 18px;
}
table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  text-align: left;
  font-size: 17px;
  line-height: 1.55;
}
caption {
  caption-side: bottom;
  text-align: left;
  padding: 16px 20px;
  font-size: 15px;
  color: #666079;
  background: #faf8ff;
}
thead {
  background: #f0eaff;
  color: #554078;
}
th,
td {
  padding: 22px 18px;
  vertical-align: top;
  border-bottom: 1px solid #e8e2f2;
  overflow-wrap: anywhere;
}
thead th {
  font-size: 15px;
}
tbody th {
  width: 20%;
  font-size: 18px;
}
tbody td:nth-child(2) {
  width: 26%;
}
tbody td:nth-child(3) {
  width: 38%;
}
tbody tr:last-child > * {
  border-bottom: 0;
}
.plus,
.component span,
small {
  display: block;
}
.plus,
.connector {
  color: #8966c2;
}
.plus {
  margin: 6px 0;
}
.component span {
  color: #666079;
  font-size: 15px;
}
.connector {
  display: block;
  margin: 5px 0;
}
.fallback-product + .fallback-product {
  margin-top: 14px;
}
p {
  margin: 0 0 10px;
}
.consequence {
  font-weight: 600;
}
small {
  color: #666079;
  font-size: 13px;
}
.quantity-note {
  margin-top: 10px;
}
.alert {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
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
@media (max-width: 600px) {
  .table-scroll {
    margin: 0 12px 16px;
  }
  th,
  td {
    padding: 16px 14px;
  }
}
</style>
