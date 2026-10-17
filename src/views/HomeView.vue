<script setup lang="ts">
import NexusIcon from '@/components/NexusIcon.vue'
import NexusFlower from '@/components/NexusFlower.vue'
</script>
<template>
  <div class="home-page page-width">
    <section class="home-hero">
      <div class="hero-copy">
        <span class="eyebrow">Plantes, compléments & médicaments</span>
        <h1>Les bons réflexes<br />commencent par<br /><span>une vue d’ensemble.</span></h1>
        <p>
          Vos produits ne vivent pas chacun de leur côté.<br class="desktop-break" />
          Explorez leurs associations, simplement.
        </p>
        <div class="hero-actions">
          <RouterLink to="/compatibility" class="primary-button"
            >Explorer mes produits <NexusIcon name="arrow" /></RouterLink
          ><span class="small-note">Deux exemples pour commencer.</span>
        </div>
        <div class="hero-tags">
          <span class="chip chip-purple"><NexusIcon name="pill" :size="14" /> Médicaments</span
          ><span class="chip chip-green"><NexusIcon name="leaf" :size="14" /> Plantes</span
          ><span class="chip chip-coral"><NexusIcon name="spark" :size="14" /> Compléments</span>
        </div>
      </div>
      <div
        class="hero-art"
        aria-label="Vue illustrée d’une association entre un médicament et une plante"
      >
        <span class="art-caption">TOUT EST CONNECTÉ.</span>
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
            <small>MON MÉDICAMENT</small><strong>Leeloo Gé</strong><span>Contraceptif</span>
          </div>
          <span class="mini-dot"></span>
        </div>
        <div class="art-core"><NexusFlower :size="94" /></div>
        <div class="floating-product art-plant">
          <span class="product-symbol green"><NexusIcon name="leaf" :size="29" /></span>
          <div>
            <small>MON COMPLÉMENT</small><strong>Millepertuis</strong
            ><span>Un ingrédient à explorer</span>
          </div>
          <span class="mini-dot"></span>
        </div>
        <span class="art-star star-one">✳</span><span class="art-star star-two">✳</span>
        <RouterLink
          :to="{ path: '/compatibility', query: { example: 'contraception' } }"
          class="art-link"
          >Découvrir cette association <NexusIcon name="arrow" :size="17"
        /></RouterLink>
      </div>
    </section>
    <section class="journey" aria-label="Le parcours Herbal Nexus">
      <div class="journey-intro">
        <span class="eyebrow">Moins de flou.</span>
        <h2>Trois étapes.<br />Une lecture plus claire.</h2>
      </div>
      <div class="journey-item">
        <span class="journey-number purple">01</span>
        <h3>Ajoutez vos produits</h3>
        <p>Médicament, complément ou plante : retrouvez-les par leur nom.</p>
      </div>
      <div class="journey-item">
        <span class="journey-number coral">02</span>
        <h3>Précisez votre profil</h3>
        <p>Faites varier l’âge, le poids et les éléments du profil.</p>
      </div>
      <div class="journey-item">
        <span class="journey-number green">03</span>
        <h3>Explorez les associations</h3>
        <p>Un score lisible, ses contributions et les règles utilisées.</p>
      </div>
    </section>
    <section class="bottom-invitation">
      <div>
        <span>Le premier pas, c’est de regarder ensemble.</span>
        <h2>On explore ?</h2>
      </div>
      <RouterLink to="/compatibility" class="round-link" aria-label="Ouvrir l’analyse"
        ><NexusIcon name="arrow" :size="28" /></RouterLink
      ><NexusFlower class="invitation-flower" :size="150" />
    </section>
  </div>
</template>
<style scoped>
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
  margin: 22px 0;
}
.hero-copy h1 > span {
  color: var(--purple);
}
.hero-copy > p {
  font-size: 16px;
  line-height: 1.8;
  color: #777480;
  margin-bottom: 27px;
}
.hero-actions {
  display: flex;
  gap: 17px;
  align-items: center;
}
.small-note {
  font-size: 10px;
  max-width: 110px;
  line-height: 1.6;
  color: var(--muted);
}
.hero-tags {
  display: flex;
  gap: 8px;
  margin-top: 28px;
  flex-wrap: wrap;
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
  font-size: 10px;
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
  font-size: 8px;
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
  font-size: 10px;
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
.coral {
  background: #ffe0cf;
  color: #d65a32;
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
  font-size: 11px;
  font-weight: 650;
  color: #5e469b;
}
.art-star {
  position: absolute;
  font-size: 47px;
  color: var(--purple);
}
.star-one {
  right: 25px;
  top: 29px;
  transform: rotate(10deg);
}
.star-two {
  left: 35px;
  bottom: 105px;
  font-size: 35px;
  color: #92ab53;
}
.journey {
  padding: 36px 0 47px;
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr 1fr;
  gap: 35px;
  border-top: 1px solid var(--line);
}
.journey-intro h2 {
  font-size: 23px;
  letter-spacing: -0.8px;
  line-height: 1.35;
  margin-top: 16px;
  font-weight: 650;
}
.journey-number {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  font-size: 11px;
  font-weight: 750;
  margin-bottom: 18px;
}
.journey-item h3 {
  font-size: 14px;
  margin-bottom: 9px;
  font-weight: 650;
}
.journey-item p {
  font-size: 12px;
  line-height: 1.8;
  color: var(--muted);
  max-width: 220px;
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
  font-size: 12px;
  color: #5c6d34;
}
.bottom-invitation h2 {
  font-size: 38px;
  letter-spacing: -1.5px;
  margin: 10px 0 0;
  font-weight: 650;
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
  .hero-actions {
    gap: 10px;
  }
  .small-note {
    display: none;
  }
  .journey {
    gap: 22px;
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
  .hero-art {
    min-height: 420px;
  }
  .hero-actions .small-note {
    display: block;
  }
  .journey {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .journey-intro {
    grid-column: 1 / -1;
  }
  .journey-intro h2 br {
    display: none;
  }
  .bottom-invitation {
    padding: 25px;
  }
  .round-link {
    margin-right: 40px;
    min-width: 52px;
    height: 52px;
  }
  .bottom-invitation h2 {
    font-size: 32px;
  }
  .invitation-flower {
    opacity: 0.5;
  }
}
</style>
