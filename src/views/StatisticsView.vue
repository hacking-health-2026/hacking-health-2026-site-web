<script setup lang="ts">
import NexusIcon from '@/components/NexusIcon.vue'
import { workbookStatistics } from '@/services/staticDemo'
import { workbookUrl } from '@/services/api'

const stats = workbookStatistics()
const number = (value: number) => value.toLocaleString('fr-FR')
const coverage = (stats.coverageRate * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
const levels = [
  { label: 'Danger', count: stats.counts.critical, color: 'red', icon: 'info' },
  { label: 'Risque modéré', count: stats.counts.watch, color: 'orange', icon: 'info' },
  { label: 'Risque faible', count: stats.counts.low, color: 'green', icon: 'check' },
]
const maxLevel = Math.max(1, ...levels.map((level) => level.count))
</script>

<template>
  <div class="stats-page page-width">
    <header class="stats-intro">
      <div>
        <p class="eyebrow">Les données, en toute transparence</p>
        <h1>Ce que l’on sait.<br /><span>Ce qu’il reste à explorer.</span></h1>
        <p>
          Une vue sur les associations couvertes par notre fichier Excel,<br class="wide-break" />
          et sur les limites des informations disponibles.
        </p>
      </div>
      <div class="catalogue-stamp">
        <NexusIcon name="book" :size="26" /><strong>{{ stats.productCount }}</strong
        ><span>produits dans le classeur</span>
      </div>
    </header>

    <section class="metric-grid" aria-label="Chiffres clés du catalogue">
      <article class="metric-card lavender">
        <NexusIcon name="link" :size="23" /><strong>{{ number(stats.coveredPairs) }}</strong>
        <h2>Associations couvertes</h2>
        <p>Au moins une règle applicable dans les données de notre prototype.</p>
      </article>
      <article class="metric-card cream">
        <NexusIcon name="info" :size="23" /><strong>{{ number(stats.unknownPairs) }}</strong>
        <h2>Informations insuffisantes</h2>
        <p>Aucune règle de paire applicable. Le niveau de risque ne peut pas être classé.</p>
      </article>
      <article class="metric-card lime">
        <NexusIcon name="spark" :size="23" /><strong>{{ number(stats.totalPairs) }}</strong>
        <h2>Paires possibles</h2>
        <p>
          {{ stats.medicines }} médicaments et {{ stats.supplements }} compléments, associés deux
          par deux.
        </p>
      </article>
    </section>

    <div class="stats-panels">
      <section class="coverage-panel" aria-labelledby="coverage-title">
        <p class="eyebrow">La couverture du catalogue</p>
        <h2 id="coverage-title">Un début de réponse,<br />pas une vue complète.</h2>
        <div
          class="coverage-donut"
          :style="{ '--coverage-angle': `${stats.coverageRate * 360}deg` }"
          role="img"
          :aria-label="`${coverage} % des paires possibles sont couvertes par une règle du prototype`"
        >
          <div>
            <strong>{{ coverage }}<span>%</span></strong
            ><small>des paires couvertes</small>
          </div>
        </div>
        <div class="coverage-key">
          <p>
            <i class="covered-dot"></i><span>Avec une règle applicable</span
            ><strong>{{ number(stats.coveredPairs) }}</strong>
          </p>
          <p>
            <i class="unknown-dot"></i><span>Sans règle de paire applicable</span
            ><strong>{{ number(stats.unknownPairs) }}</strong>
          </p>
        </div>
        <p class="chart-note">
          Ce pourcentage décrit la couverture de notre catalogue. Il ne mesure pas la probabilité
          d’une complication.
        </p>
      </section>

      <section class="levels-panel" aria-labelledby="levels-title">
        <p class="eyebrow">Les associations classées</p>
        <h2 id="levels-title">Trois niveaux d’alerte.</h2>
        <p class="panel-lead">
          Répartition des {{ stats.coveredPairs }} paires couvertes dans le calcul de base.
        </p>
        <div class="level-bars">
          <div v-for="level in levels" :key="level.label" class="level-row" :class="level.color">
            <div>
              <span><NexusIcon :name="level.icon" :size="16" />{{ level.label }}</span
              ><strong>{{ number(level.count) }}</strong>
            </div>
            <div class="bar-track" aria-hidden="true">
              <span :style="{ width: `${(level.count / maxLevel) * 100}%` }"></span>
            </div>
          </div>
        </div>
        <div class="baseline-note">
          <NexusIcon name="info" :size="18" />
          <p>
            Ces chiffres utilisent les quantités initiales, sans majoration liée à l’âge, au poids
            ou à un état du profil. Modifier ces paramètres peut changer le niveau d’alerte.
          </p>
        </div>
        <p class="chart-note">
          Il s’agit d’associations classées par le prototype, pas de nombres de patients ni
          d’événements médicaux observés.
        </p>
      </section>
    </div>

    <section class="limits-section" aria-labelledby="limits-title">
      <div class="limits-heading">
        <span class="limits-symbol"><NexusIcon name="scan" :size="30" /></span>
        <div>
          <p class="eyebrow">Pourquoi autant d’informations manquantes ?</p>
          <h2 id="limits-title">Aucune base ne peut<br />tout couvrir.</h2>
        </div>
      </div>
      <p class="limits-lead">
        On ne peut pas disposer d’observations fiables pour chaque combinaison de produits, à toutes
        les doses et pour chaque personne. Il faut distinguer ce qui est connu, ce qui reste
        incertain et ce que notre outil ne couvre pas.
      </p>
      <div class="limits-grid">
        <article>
          <span>01</span>
          <h3>Les combinaisons se multiplient</h3>
          <p>
            Avec seulement {{ stats.productCount }} produits, il existe déjà
            {{ number(stats.totalPairs) }} paires. Les prises de trois produits ou plus ajoutent
            encore des situations à étudier.
          </p>
        </article>
        <article>
          <span>02</span>
          <h3>Le contexte compte</h3>
          <p>
            La quantité, la composition d’un extrait, la durée de prise ou le profil de la personne
            peuvent changer la situation. Un résultat dans un contexte ne se transpose pas
            automatiquement à tous les autres.
          </p>
        </article>
        <article>
          <span>03</span>
          <h3>Les données ont des limites</h3>
          <p>
            Certaines associations sont peu étudiées, d’autres donnent des résultats incertains.
            Notre classeur et les règles de ce prototype ont aussi un périmètre limité, surtout
            médicament–complément.
          </p>
        </article>
      </div>
      <div class="unknown-message">
        <NexusIcon name="info" :size="22" />
        <p>
          <strong>« Informations insuffisantes » ne veut pas dire « sans danger ».</strong
          ><span
            >Cela signifie que les règles disponibles ne permettent pas de conclure. Ce n’est ni une
            alerte confirmée, ni une garantie de sécurité.</span
          >
        </p>
      </div>
      <a
        class="research-link"
        href="https://www.nccih.nih.gov/health/providers/digest/herb-drug-interactions-science"
        target="_blank"
        rel="noopener noreferrer"
        >Pour approfondir les incertitudes : synthèse du NCCIH sur les interactions
        plantes–médicaments <NexusIcon name="arrow" :size="15"
      /></a>
    </section>

    <details class="stats-method">
      <summary>
        Comment ces statistiques sont-elles obtenues ? <NexusIcon name="chevron" :size="17" />
      </summary>
      <div>
        <p>
          Source : <strong>{{ stats.source }}</strong
          >. Les {{ stats.productCount }} produits correspondent aux lignes des feuilles médicaments
          et compléments. Chaque paire de produits distincts est comptée une seule fois.
        </p>
        <p>
          Les chiffres sont recalculés depuis le catalogue et les règles exportées du moteur. Les
          paires médicament–médicament et complément–complément sont incluses dans le total, même si
          ce moteur ne dispose pas de règles pour les classer. Les alertes liées au profil ne sont
          pas incluses dans cette répartition de base.
        </p>
        <p>
          Les niveaux sont ceux d’une évaluation simulée, non validée cliniquement. Une règle de
          classe peut concerner plusieurs produits : {{ stats.coveredPairs }} paires ne
          correspondent donc pas à {{ stats.coveredPairs }} observations indépendantes.
        </p>
        <a :href="workbookUrl('/api/source/workbook')"
          >Consulter le classeur source <NexusIcon name="arrow" :size="14"
        /></a>
      </div>
    </details>
    <div class="stats-cta">
      <p>Explorez les liens disponibles,<br /><strong>gardez les incertitudes visibles.</strong></p>
      <RouterLink to="/utilisation"
        >Utiliser Herbal Nexus <NexusIcon name="arrow" :size="18"
      /></RouterLink>
    </div>
  </div>
</template>

<style scoped>
.stats-page {
  padding-top: 52px;
  padding-bottom: 65px;
}
.stats-intro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  margin-bottom: 35px;
}
.stats-intro h1 {
  font-size: clamp(36px, 4.3vw, 56px);
  letter-spacing: -2.6px;
  line-height: 1.1;
  margin-bottom: 20px;
}
.stats-intro h1 > span {
  color: var(--purple);
}
.stats-intro > div > p:last-child {
  color: #7a7285;
  font-size: 15px;
  line-height: 1.7;
  margin: 0;
}
.catalogue-stamp {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 190px;
  min-height: 185px;
  border-radius: 44% 40% 45% 36%;
  background: var(--lime);
  transform: rotate(5deg);
  gap: 9px;
}
.catalogue-stamp strong {
  font-size: 52px;
  line-height: 1;
  letter-spacing: -3px;
}
.catalogue-stamp > span {
  font-size: 11px;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 17px;
  margin-bottom: 24px;
}
.metric-card {
  border-radius: 20px;
  padding: 26px;
  border: 1px solid #e6e1eb;
}
.metric-card > svg {
  display: block;
  color: #86719c;
  margin-bottom: 19px;
}
.metric-card > strong {
  font-size: 47px;
  font-weight: 780;
  letter-spacing: -2px;
  line-height: 1.1;
  display: block;
  margin-bottom: 13px;
}
.metric-card h2 {
  font-size: 15px;
  margin-bottom: 10px;
  letter-spacing: -0.3px;
}
.metric-card p {
  font-size: 12px;
  line-height: 1.7;
  color: #7a7086;
  margin: 0;
}
.lavender {
  background: #eee8ff;
}
.cream {
  background: #fffaf1;
}
.lime {
  background: #eff4da;
}
.stats-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 38px;
}
.coverage-panel,
.levels-panel {
  padding: 31px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 24px;
}
.stats-panels h2 {
  font-size: 27px;
  letter-spacing: -0.9px;
  line-height: 1.25;
  margin-bottom: 18px;
}
.coverage-donut {
  width: 210px;
  height: 210px;
  border-radius: 50%;
  background: conic-gradient(var(--purple) var(--coverage-angle), #eee9f4 var(--coverage-angle));
  display: grid;
  place-items: center;
  margin: 29px auto;
}
.coverage-donut > div {
  width: 165px;
  height: 165px;
  border-radius: 50%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
}
.coverage-donut strong {
  font-size: 43px;
  letter-spacing: -2px;
}
.coverage-donut strong > span {
  font-size: 22px;
  margin-left: 3px;
  color: #9f8bb8;
}
.coverage-donut small {
  font-size: 11px;
  color: #96899f;
}
.coverage-key p {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  line-height: 1.6;
  color: #83738f;
  margin-bottom: 12px;
}
.coverage-key strong {
  margin-left: auto;
  color: var(--ink);
  font-size: 13px;
}
.coverage-key i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.covered-dot {
  background: var(--purple);
}
.unknown-dot {
  background: #e0d6ec;
}
.chart-note {
  font-size: 10px !important;
  color: #9a8ca4 !important;
  line-height: 1.7 !important;
  margin: 20px 0 0;
}
.panel-lead {
  font-size: 12px;
  color: #918299;
  line-height: 1.7;
}
.level-bars {
  display: grid;
  gap: 27px;
  margin: 35px 0;
}
.level-row > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.level-row > div > span:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 650;
}
.level-row strong {
  font-size: 26px;
  letter-spacing: -0.8px;
}
.red {
  color: #b94c48;
  --bar: #e58781;
}
.orange {
  color: #bd7942;
  --bar: #edb376;
}
.green {
  color: #518463;
  --bar: #81b394;
}
.bar-track {
  height: 9px;
  background: #f1edf4;
  border-radius: 20px;
  overflow: hidden;
}
.bar-track > span {
  display: block;
  height: 100%;
  background: var(--bar);
  border-radius: 20px;
}
.baseline-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 13px;
  background: #f6f3fb;
  padding: 16px;
  color: #8d7a9b;
}
.baseline-note > svg {
  flex-shrink: 0;
  margin-top: 2px;
}
.baseline-note p {
  font-size: 11px;
  line-height: 1.8;
  margin: 0;
}
.limits-section {
  background: #eee8ff77;
  border: 1px solid #e6ddf8;
  border-radius: 26px;
  padding: 34px;
}
.limits-heading {
  display: flex;
  align-items: center;
  gap: 20px;
}
.limits-symbol {
  width: 65px;
  height: 65px;
  background: var(--purple);
  color: var(--lime);
  display: grid;
  place-items: center;
  border-radius: 20px;
  transform: rotate(-8deg);
  flex-shrink: 0;
}
.limits-heading h2 {
  font-size: 34px;
  line-height: 1.12;
  letter-spacing: -1.3px;
  margin: 0;
}
.limits-heading .eyebrow {
  font-size: 9px;
  letter-spacing: 1.1px;
  margin-bottom: 10px;
}
.limits-lead {
  font-size: 14px;
  line-height: 1.9;
  color: #81718e;
  max-width: 840px;
  margin: 25px 0;
}
.limits-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 25px;
  margin: 30px 0;
}
.limits-grid article > span {
  font-size: 11px;
  font-weight: 750;
  color: #a28ac2;
}
.limits-grid h3 {
  font-size: 15px;
  margin: 12px 0 10px;
  line-height: 1.5;
}
.limits-grid p {
  font-size: 12px;
  line-height: 1.9;
  color: #85748f;
  margin: 0;
}
.unknown-message {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  background: #fffdf7;
  border: 1px solid #ded4ed;
  border-radius: 15px;
  padding: 21px;
  color: #6b5582;
}
.unknown-message > svg {
  flex-shrink: 0;
  margin-top: 1px;
}
.unknown-message p {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
}
.unknown-message p > span {
  display: block;
  font-size: 12px;
  color: #97839f;
  margin-top: 5px;
}
.research-link {
  font-size: 10px;
  line-height: 1.7;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--purple);
  margin-top: 20px;
}
.research-link:hover {
  text-decoration: underline;
}
.stats-method {
  border-bottom: 1px solid var(--line);
  margin-top: 20px;
  color: #81708f;
}
.stats-method summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  cursor: pointer;
  list-style: none;
  padding: 21px 0;
  font-size: 12px;
  font-weight: 650;
}
.stats-method summary::-webkit-details-marker {
  display: none;
}
.stats-method[open] summary > svg {
  transform: rotate(180deg);
}
.stats-method > div {
  padding-bottom: 20px;
  max-width: 900px;
}
.stats-method p {
  font-size: 12px;
  line-height: 1.9;
}
.stats-method a {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--purple);
}
.stats-cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}
.stats-cta p {
  font-size: 18px;
  line-height: 1.5;
  letter-spacing: -0.3px;
  margin: 0;
}
.stats-cta a {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--purple);
  color: white;
  border-radius: 13px;
  padding: 16px 23px;
  font-size: 13px;
  font-weight: 650;
}
.stats-cta a:hover {
  background: #6046cc;
}
@media (max-width: 900px) {
  .catalogue-stamp {
    width: 155px;
    min-height: 160px;
  }
  .metric-card {
    padding: 20px;
  }
  .metric-card > strong {
    font-size: 38px;
  }
  .metric-card h2 {
    font-size: 13px;
  }
  .stats-panels {
    gap: 16px;
  }
  .coverage-panel,
  .levels-panel {
    padding: 23px;
  }
  .stats-panels h2 {
    font-size: 24px;
  }
  .limits-section {
    padding: 27px;
  }
  .limits-grid {
    gap: 17px;
  }
  .limits-heading h2 {
    font-size: 30px;
  }
  .coverage-donut {
    width: 185px;
    height: 185px;
  }
  .coverage-donut > div {
    width: 145px;
    height: 145px;
  }
}
@media (max-width: 620px) {
  .stats-page {
    padding-top: 32px;
    padding-bottom: 40px;
  }
  .stats-intro h1 {
    font-size: 35px;
    letter-spacing: -1.6px;
  }
  .stats-intro > div > p:last-child {
    font-size: 12px;
  }
  .catalogue-stamp {
    display: none;
  }
  .wide-break {
    display: none;
  }
  .metric-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .metric-card {
    position: relative;
    padding: 22px 22px 22px 105px;
    min-height: 133px;
  }
  .metric-card > strong {
    position: absolute;
    left: 20px;
    top: 30px;
    font-size: 29px;
    letter-spacing: -1.3px;
  }
  .metric-card > svg {
    position: absolute;
    left: 24px;
    bottom: 25px;
    width: 17px;
    height: 17px;
    margin: 0;
  }
  .metric-card h2 {
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 7px;
  }
  .metric-card p {
    font-size: 11px;
  }
  .stats-panels {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .coverage-panel,
  .levels-panel {
    padding: 25px;
  }
  .limits-section {
    padding: 23px;
  }
  .limits-heading {
    align-items: flex-start;
    gap: 13px;
  }
  .limits-symbol {
    width: 39px;
    height: 39px;
    border-radius: 12px;
  }
  .limits-symbol svg {
    width: 21px;
  }
  .limits-heading h2 {
    font-size: 27px;
  }
  .limits-heading .eyebrow {
    font-size: 8px;
    line-height: 1.6;
    letter-spacing: 0.8px;
  }
  .limits-lead {
    font-size: 12px;
  }
  .limits-grid {
    grid-template-columns: 1fr;
    gap: 23px;
  }
  .limits-grid article {
    padding-bottom: 20px;
    border-bottom: 1px solid #dfd4ef;
  }
  .limits-grid h3 {
    margin: 8px 0;
  }
  .unknown-message {
    padding: 15px;
    gap: 9px;
  }
  .unknown-message p {
    font-size: 12px;
  }
  .unknown-message p > span {
    font-size: 11px;
  }
  .stats-cta {
    align-items: stretch;
    flex-direction: column;
  }
  .stats-cta p {
    font-size: 16px;
  }
  .stats-cta a {
    justify-content: center;
  }
  .chart-note {
    font-size: 10px !important;
  }
}
</style>
