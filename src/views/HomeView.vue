<script setup lang="ts">
import BillyMascot from '@/components/BillyMascot.vue'
import NexusIcon from '@/components/NexusIcon.vue'
import NexusFlower from '@/components/NexusFlower.vue'

const cases = [
  {
    id: 'millepertuis',
    tone: 'purple',
    year: '2000',
    type: 'Publication clinique',
    medicine: 'Ciclosporine',
    ingredient: 'Millepertuis',
    number: '2',
    unit: 'patients greffés du cœur',
    title: 'Un traitement antirejet mis en difficulté',
    observation:
      'Deux personnes greffées du cœur ont présenté un rejet aigu lors de la prise conjointe de ciclosporine et de millepertuis. Les auteurs attribuent ces rejets à une interaction entre les deux produits.',
    outcome: 'Rejets aigus de greffe rapportés',
    context:
      'Il s’agit de deux cas cliniques publiés dans The Lancet. Le millepertuis était utilisé comme préparation à base de plante. Ces observations ne permettent pas de calculer la fréquence de ce risque.',
    authors: 'Ruschitzka et al.',
    journal: 'The Lancet · 12 février 2000',
    source: 'https://doi.org/10.1016/S0140-6736(99)05467-7',
    citation: 'Acute heart transplant rejection due to Saint John’s wort',
  },
  {
    id: 'curcuma',
    tone: 'coral',
    year: '2018',
    type: 'Signal de pharmacovigilance',
    medicine: 'Warfarine',
    ingredient: 'Produit au curcuma',
    number: '> 10',
    unit: 'INR mesuré après l’ajout du produit',
    title: 'Un équilibre anticoagulant perturbé',
    observation:
      'Une personne sous warfarine, jusque-là stable, a vu son INR dépasser 10 quelques semaines après avoir commencé un produit contenant du curcuma. Le déclarant a suspecté une interaction.',
    outcome: 'Risque de saignement accru',
    context:
      'L’INR sert à surveiller l’effet anticoagulant. Le signal décrit une hausse de cette mesure, sans rapporter de saignement constaté. L’alerte de Medsafe concerne les produits au curcuma ou à la curcumine, pas le curcuma utilisé comme épice alimentaire.',
    authors: 'Medsafe / CARM',
    journal: 'Communication de sécurité · avril 2018',
    source: 'https://www.medsafe.govt.nz/safety/ews/2018/Turmeric.asp',
    citation: 'Beware turmeric/curcumin containing products can interact with warfarin',
  },
  {
    id: '5htp',
    tone: 'green',
    year: '2017',
    type: 'Publication clinique',
    medicine: 'Sertraline',
    ingredient: 'Complément de 5‑HTP',
    number: '1',
    unit: 'cas clinique chez un homme de 28 ans',
    title: 'Une complication nécessitant une chirurgie',
    observation:
      'Un homme prenant de la sertraline et plusieurs compléments, dont du 5‑HTP, a développé un syndrome sérotoninergique avec atteinte musculaire sévère. Un syndrome des loges a nécessité une chirurgie en urgence.',
    outcome: 'Récupération complète rapportée',
    context:
      'Les auteurs impliquent l’association sertraline–5‑HTP. D’autres traitements, de nombreux compléments et un effort physique étaient aussi présents ; les quantités réellement prises restaient incertaines. Ce cas ne permet donc pas d’isoler un effet dose-réponse.',
    authors: 'Patel & Marzella',
    journal: 'American Journal of Case Reports · 25 août 2017',
    source: 'https://amjcaserep.com/abstract/full/idArt/904375',
    citation:
      'Dietary Supplement-Drug Interaction-Induced Serotonin Syndrome Progressing to Acute Compartment Syndrome',
  },
]
</script>

<template>
  <div class="home-page page-width">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="hero-copy">
        <span class="eyebrow">Médicaments & compléments alimentaires</span>
        <h1 id="home-title">Naturel ne veut<br />pas dire<br /><span>sans danger.</span></h1>
        <p>
          Une plante, un complément, un médicament.<br class="desktop-break" />
          Leurs effets peuvent se croiser dans le même organisme.
        </p>
        <BillyMascot :size="150" message="Un petit réflexe : vérifier avant d’associer !" />
        <div class="hero-actions">
          <a href="#cas-documentes" class="primary-button"
            >Voir les cas documentés <NexusIcon name="arrow"
          /></a>
          <RouterLink to="/utilisation" class="secondary-link"
            >Utiliser Herbal Nexus <NexusIcon name="arrow" :size="16"
          /></RouterLink>
        </div>
        <p class="hero-note">
          <NexusIcon name="book" :size="15" /> Publications cliniques et signalements de
          pharmacovigilance.
        </p>
      </div>
      <div
        class="hero-art"
        aria-label="Un médicament et un produit à base de plante peuvent interagir"
      >
        <span class="art-caption">UN MÊME ORGANISME.</span>
        <svg class="art-connections" viewBox="0 0 500 470" aria-hidden="true">
          <path
            d="M124 129C317 84 151 342 354 327M140 320C130 215 354 265 364 127"
            fill="none"
            stroke="#b4a2ee"
            stroke-width="2"
            stroke-dasharray="6 7"
          />
        </svg>
        <div class="floating-product art-medicine">
          <span class="product-symbol purple"><NexusIcon name="pill" :size="28" /></span>
          <div>
            <small>LE MÉDICAMENT</small><strong>Warfarine</strong><span>Anticoagulant</span>
          </div>
          <span class="mini-dot"></span>
        </div>
        <div class="art-core"><NexusFlower :size="94" /></div>
        <div class="floating-product art-plant">
          <span class="product-symbol green"><NexusIcon name="leaf" :size="29" /></span>
          <div>
            <small>LE PRODUIT À BASE DE PLANTE</small><strong>Curcuma</strong
            ><span>Une association à examiner</span>
          </div>
          <span class="mini-dot"></span>
        </div>
        <span class="art-star" aria-hidden="true">✳</span>
        <a href="#cas-curcuma" class="art-link"
          >Un cas signalé en 2018 <NexusIcon name="arrow" :size="17"
        /></a>
      </div>
    </section>

    <section id="cas-documentes" class="research-section" aria-labelledby="cases-title">
      <div class="section-intro">
        <div>
          <span class="eyebrow">Ce qui a été observé</span>
          <h2 id="cases-title">Des associations.<br /><span>Des conséquences réelles.</span></h2>
        </div>
        <p>
          Trois exemples issus de publications et d’un signalement officiel. Pour chaque cas,
          retrouvez les faits rapportés, leur contexte et la source originale.
        </p>
      </div>
      <div class="case-grid">
        <article
          v-for="(item, index) in cases"
          :id="`cas-${item.id}`"
          :key="item.id"
          :class="['case-card', `case-${item.tone}`]"
        >
          <div class="case-top">
            <span>{{ String(index + 1).padStart(2, '0') }} / {{ item.year }}</span
            ><span>{{ item.type }}</span>
          </div>
          <div class="case-association">
            <span><NexusIcon name="pill" :size="15" />{{ item.medicine }}</span
            ><b>+</b><span><NexusIcon name="leaf" :size="15" />{{ item.ingredient }}</span>
          </div>
          <div class="case-figure">
            <strong>{{ item.number }}</strong
            ><span>{{ item.unit }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p class="case-observation">{{ item.observation }}</p>
          <div class="case-outcome">
            <NexusIcon name="info" :size="17" /><span>{{ item.outcome }}</span>
          </div>
          <details class="case-context">
            <summary>
              En savoir plus sur le contexte <NexusIcon name="chevron" :size="16" />
            </summary>
            <p>{{ item.context }}</p>
          </details>
          <a
            :href="item.source"
            target="_blank"
            rel="noopener noreferrer"
            class="case-source"
            :aria-label="`Lire la source : ${item.citation}`"
          >
            <span
              ><strong>{{ item.authors }}</strong
              ><small>{{ item.journal }}</small></span
            ><NexusIcon name="arrow" :size="18" />
          </a>
        </article>
      </div>
      <div class="research-caption">
        <p>
          Ces cas décrivent des personnes et des situations précises. Ils ne permettent pas de
          déduire une fréquence de survenue ni un risque individuel.
        </p>
        <span>Sources consultées le 17 octobre 2026</span>
      </div>
    </section>

    <section class="bottom-invitation">
      <div>
        <span>Vos produits aussi méritent une vue d’ensemble.</span>
        <h2>À vous de choisir.</h2>
        <p>Retrouvez leurs ingrédients et les règles d’association disponibles.</p>
      </div>
      <RouterLink to="/utilisation" class="round-link" aria-label="Utiliser Herbal Nexus"
        ><NexusIcon name="arrow" :size="28"
      /></RouterLink>
      <NexusFlower class="invitation-flower" :size="150" />
    </section>
  </div>
</template>

<style scoped>
.hero-copy > .billy-guide {
  margin: 14px 0;
}
.home-hero {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 45px;
  align-items: center;
  padding: 68px 0 62px;
}
.hero-copy h1 {
  font-size: clamp(40px, 4.3vw, 63px);
  letter-spacing: -3px;
  font-weight: 650;
  line-height: 1.1;
  margin: 14px 0;
}
.hero-copy h1 > span {
  color: var(--purple);
}
.hero-copy > p {
  font-size: 20px;
  line-height: 1.8;
  color: #777480;
  margin-bottom: 27px;
}
.hero-actions {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}
.secondary-link {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 16px;
  color: var(--purple);
  font-weight: 600;
}
.hero-copy .hero-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 22px 0 0;
  font-size: 15px;
  line-height: 1.6;
}
.hero-note svg {
  flex-shrink: 0;
}
.hero-art {
  position: relative;
  min-height: 470px;
  border-radius: 36px;
  background: #ede8ff;
  overflow: hidden;
}
.art-caption {
  position: absolute;
  left: 30px;
  top: 29px;
  font-size: 15px;
  letter-spacing: 2px;
  font-weight: 700;
  color: #8974bd;
}
.art-connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.floating-product {
  position: absolute;
  background: #fff;
  border-radius: 19px;
  padding: 21px;
  display: flex;
  gap: 15px;
  align-items: center;
  box-shadow: 0 15px 26px #48316e12;
  min-width: 285px;
  z-index: 2;
}
.floating-product small {
  font-size: 14px;
  letter-spacing: 1.1px;
  font-weight: 700;
  color: var(--muted);
}
.floating-product strong {
  font-size: 19px;
  display: block;
  letter-spacing: -0.5px;
  margin: 4px 0;
}
.floating-product div > span {
  font-size: 15px;
  color: var(--muted);
}
.product-symbol {
  display: grid;
  place-items: center;
  width: 55px;
  height: 60px;
  border-radius: 14px;
  flex-shrink: 0;
}
.purple {
  background: #e9e1ff;
  color: var(--purple);
}
.green {
  background: var(--lime);
  color: #5c742f;
}
.art-medicine {
  left: 26px;
  top: 84px;
  transform: rotate(-7deg);
}
.art-plant {
  right: 24px;
  bottom: 91px;
  transform: rotate(6deg);
}
.mini-dot {
  margin-left: auto;
  width: 7px;
  height: 7px;
  background: var(--lime);
  border-radius: 50%;
}
.art-core {
  position: absolute;
  left: 48%;
  top: 43%;
  width: 113px;
  height: 113px;
  background: var(--coral);
  border-radius: 30px;
  transform: translate(-50%, -50%) rotate(9deg);
  display: grid;
  place-items: center;
  color: #ffdec2;
  --flower-center: var(--coral);
  box-shadow: 0 10px 24px #b3564030;
}
.art-link {
  display: flex;
  align-items: center;
  gap: 10px;
  position: absolute;
  bottom: 29px;
  left: 30px;
  font-size: 15px;
  font-weight: 650;
  color: #5e469b;
}
.art-star {
  position: absolute;
  font-size: 47px;
  color: var(--purple);
  right: 25px;
  top: 29px;
  transform: rotate(10deg);
}
.research-section {
  padding: 46px 0 48px;
  border-top: 1px solid var(--line);
  scroll-margin-top: 24px;
}
.section-intro {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 40px;
  margin-bottom: 30px;
}
.section-intro h2 {
  font-size: clamp(29px, 3vw, 39px);
  line-height: 1.2;
  letter-spacing: -1.4px;
  font-weight: 650;
  margin: 16px 0 0;
}
.section-intro h2 span {
  color: var(--purple);
}
.section-intro > p {
  max-width: 365px;
  font-size: 17px;
  line-height: 1.8;
  color: var(--muted);
  margin: 0 0 3px;
}
.case-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}
.case-card {
  --case-accent: #7155e8;
  --case-soft: #eee8ff;
  background: white;
  border: 1px solid #ece9e4;
  border-top: 4px solid var(--case-accent);
  border-radius: 22px;
  padding: 24px;
  scroll-margin-top: 24px;
}
.case-coral {
  --case-accent: #cf5736;
  --case-soft: #fff0e9;
}
.case-green {
  --case-accent: #5d792a;
  --case-soft: #eff5dd;
}
.case-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 15px;
  color: var(--muted);
}
.case-top > span:first-child {
  font-weight: 700;
  color: var(--case-accent);
  white-space: nowrap;
}
.case-top > span:last-child {
  text-align: right;
  line-height: 1.5;
}
.case-association {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  margin: 18px 0;
  font-size: 15px;
}
.case-association > span {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--case-soft);
  color: var(--case-accent);
}
.case-association b {
  font-weight: 400;
  color: var(--muted);
}
.case-figure {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 16px;
  background: var(--case-soft);
  border-radius: 14px;
  min-height: 0;
}
.case-figure strong {
  font-size: 34px;
  font-weight: 650;
  line-height: 1;
  letter-spacing: -2px;
  color: var(--case-accent);
  white-space: nowrap;
}
.case-figure > span {
  font-size: 16px;
  line-height: 1.6;
  max-width: 150px;
}
.case-card h3 {
  font-size: 21px;
  line-height: 1.35;
  letter-spacing: -0.6px;
  margin: 20px 0 12px;

  font-weight: 650;
}
.case-observation {
  font-size: 17px;
  line-height: 1.6;
  color: #686573;
  margin-bottom: 20px;
}
.case-outcome {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--case-accent);
  font-size: 15px;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}
.case-outcome svg {
  flex-shrink: 0;
}
.case-context {
  margin: 0 0 6px;
}
.case-context summary {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 0;
  cursor: pointer;
  font-size: 16px;
  list-style: none;
}
.case-context summary::-webkit-details-marker {
  display: none;
}
.case-context[open] summary svg {
  transform: rotate(180deg);
}
.case-context p {
  font-size: 16px;
  line-height: 1.8;
  color: var(--muted);
  margin-bottom: 18px;
}
.case-source {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  color: var(--case-accent);
}
.case-source strong {
  display: block;
  font-size: 16px;
  font-weight: 600;
}
.case-source small {
  display: block;
  font-size: 15px;
  color: var(--muted);
  line-height: 1.6;
  margin-top: 4px;
}
.case-source:hover strong {
  text-decoration: underline;
}
.research-caption {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 35px;
  margin-top: 21px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.8;
}
.research-caption p {
  max-width: 720px;
  margin: 0;
}
.research-caption > span {
  text-align: right;
  flex-shrink: 0;
  font-size: 15px;
}
.bottom-invitation {
  position: relative;
  display: flex;
  align-items: center;
  gap: 50px;
  justify-content: space-between;
  background: var(--lime);
  border-radius: 24px;
  padding: 33px 45px;
  overflow: hidden;
}
.bottom-invitation span {
  font-size: 16px;
  color: #5c6d34;
}
.bottom-invitation h2 {
  font-size: 38px;
  letter-spacing: -1.5px;
  margin: 10px 0;
  font-weight: 650;
}
.bottom-invitation p {
  font-size: 16px;
  line-height: 1.7;
  margin: 0;
  max-width: 350px;
  color: #5c6d34;
}
.round-link {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  min-width: 65px;
  height: 65px;
  background: var(--ink);
  color: white;
  border-radius: 50%;
  margin-right: 120px;
}
.invitation-flower {
  position: absolute;
  right: -23px;
  top: 6px;
  color: #bfd16d;
  --flower-center: var(--lime);
  transform: rotate(14deg);
}
@media (max-width: 1050px) {
  .home-hero {
    gap: 25px;
  }
  .hero-copy h1 {
    font-size: 46px;
    letter-spacing: -2px;
  }
  .hero-art {
    min-height: 440px;
  }
  .floating-product {
    min-width: 250px;
    padding: 16px;
  }
  .art-medicine {
    left: 15px;
  }
  .art-plant {
    right: 15px;
  }
  .case-grid {
    gap: 12px;
  }
  .case-card {
    padding: 18px;
  }
  .case-association {
    min-height: 0;
  }
  .case-figure {
    padding: 12px;
    gap: 10px;
  }
  .case-figure strong {
    font-size: 34px;
  }
  .case-observation {
    min-height: 0;
  }
}
@media (max-width: 760px) {
  .home-hero {
    grid-template-columns: 1fr;
    padding: 40px 0;
    gap: 35px;
  }
  .hero-copy h1 {
    font-size: clamp(39px, 8vw, 60px);
  }
  .hero-copy > p {
    font-size: 18px;
  }
  .hero-art {
    min-height: 410px;
  }
  .section-intro {
    display: block;
  }
  .section-intro > p {
    margin-top: 20px;
    max-width: 550px;
  }
  .case-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .case-card {
    padding: 24px;
  }
  .case-association {
    min-height: 0;
  }
  .case-card h3,
  .case-observation {
    min-height: 0;
  }
  .research-caption {
    display: block;
  }
  .research-caption > span {
    display: block;
    text-align: left;
    margin-top: 10px;
  }
  .bottom-invitation {
    padding: 25px;
    gap: 20px;
  }
  .round-link {
    margin-right: 0;
    min-width: 52px;
    height: 52px;
  }
  .bottom-invitation h2 {
    font-size: 32px;
  }
  .invitation-flower {
    opacity: 0.3;
  }
}
</style>
