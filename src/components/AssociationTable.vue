<script setup lang="ts">
import { computed } from 'vue'
import type { Assessment, Component } from '@/services/api'
import { alertLabels } from '@/services/alerts'
const props = defineProps<{ result: Assessment }>()
const amount = (component: Component) =>
  component.daily_mg == null
    ? 'Quantité inconnue'
    : `${component.daily_mg.toLocaleString('fr-FR', { maximumFractionDigits: 5 })} mg/j`
const cells = computed(() =>
  props.result.drugs.map((a) =>
    props.result.drugs.map((b) => {
      if (a.id === b.id) return null
      const pair = props.result.pairs.find(
        (p) =>
          (p.drug_a.id === a.id && p.drug_b.id === b.id) ||
          (p.drug_a.id === b.id && p.drug_b.id === a.id),
      )
      const aIds = new Set(a.components.map((c) => c.id))
      const bIds = new Set(b.components.map((c) => c.id))
      const relations = props.result.ingredient_relations.filter(
        (r) =>
          (aIds.has(r.substance.id) && bIds.has(r.ingredient.id)) ||
          (bIds.has(r.substance.id) && aIds.has(r.ingredient.id)),
      )
      return { pair, relations }
    }),
  ),
)
</script>
<template>
  <div
    class="matrix-scroll"
    tabindex="0"
    role="region"
    aria-label="Tableau croisé des relations entre produits"
  >
    <table>
      <caption>
        Chaque case décrit la relation entre le produit de la ligne et celui de la colonne. Une
        relation absente ne signifie pas une absence de danger.
      </caption>
      <thead>
        <tr>
          <th scope="col" class="corner">Vos produits</th>
          <th v-for="drug in result.drugs" :key="drug.id" scope="col">{{ drug.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(drug, i) in result.drugs" :key="drug.id">
          <th scope="row">{{ drug.name }}</th>
          <td v-for="(other, j) in result.drugs" :key="other.id" :class="{ diagonal: i === j }">
            <span v-if="i === j" class="dash" aria-label="Même produit">—</span>
            <template v-else>
              <span :class="['alert', cells[i]?.[j]?.pair?.status ?? 'unknown']">{{
                alertLabels[cells[i]?.[j]?.pair?.status ?? 'unknown']
              }}</span>
              <article
                v-for="relation in cells[i]?.[j]?.relations"
                :key="relation.id"
                class="relation"
              >
                <strong
                  >{{ relation.substance.name }} <span class="link">↔</span>
                  {{ relation.ingredient.name }}</strong
                >
                <small class="amounts"
                  >{{ amount(relation.substance) }} ↔ {{ amount(relation.ingredient) }}</small
                >
                <p>{{ relation.mechanism }}</p>
                <p
                  v-if="
                    cells[i]?.[j]?.pair?.rules.find((r) => r.id === relation.rule_id)?.consequence
                  "
                  class="consequence"
                >
                  {{
                    cells[i]?.[j]?.pair?.rules.find((r) => r.id === relation.rule_id)?.consequence
                  }}
                </p>
                <small>{{ relation.rule_id }} · {{ relation.mapping_note }}</small>
              </article>
              <template v-if="!cells[i]?.[j]?.relations.length">
                <article v-for="rule in cells[i]?.[j]?.pair?.rules" :key="rule.id" class="relation">
                  <strong>{{ rule.ingredient }} ↔ {{ rule.target }}</strong>
                  <p>{{ rule.mechanism }}</p>
                  <p class="consequence">{{ rule.consequence }}</p>
                  <small
                    >{{ rule.id }} · {{ rule.reference.sheet }}, ligne
                    {{ rule.reference.row }}</small
                  >
                </article>
                <p v-if="!cells[i]?.[j]?.pair?.rules.length" class="missing">
                  Aucune relation documentée dans les données disponibles.
                </p>
              </template>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
.matrix-scroll {
  overflow-x: auto;
  margin: 0 20px 24px;
  border: 1px solid #e5def5;
  border-radius: 18px;
}
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 17px;
  line-height: 1.5;
}
caption {
  caption-side: bottom;
  text-align: left;
  padding: 16px 20px;
  font-size: 15px;
  color: #666079;
  background: #faf8ff;
}
th,
td {
  padding: 20px;
  border-right: 1px solid #e8e2f2;
  border-bottom: 1px solid #e8e2f2;
  vertical-align: top;
  overflow-wrap: anywhere;
}
th {
  background: #f0eaff;
  color: #554078;
  font-size: 17px;
  min-width: 145px;
}
tbody th {
  position: sticky;
  left: 0;
  z-index: 1;
  width: 170px;
  box-shadow: 2px 0 0 #e8e2f2;
}
td {
  min-width: 270px;
}
tr > :last-child {
  border-right: 0;
}
tbody tr:last-child > * {
  border-bottom: 0;
}
.diagonal {
  background: #faf8fd;
  text-align: center;
  vertical-align: middle;
}
.dash {
  color: #c0b5d4;
  font-size: 32px;
}
.relation {
  margin-top: 18px;
}
.relation + .relation {
  border-top: 1px solid #e8e2f2;
  padding-top: 16px;
}
.relation strong {
  display: block;
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
.missing {
  color: #736b80;
}
@media (max-width: 600px) {
  .matrix-scroll {
    margin: 0 12px 16px;
  }
  th,
  td {
    padding: 16px 14px;
  }
  tbody th {
    min-width: 115px;
    max-width: 135px;
  }
  td {
    min-width: 245px;
  }
}
</style>
