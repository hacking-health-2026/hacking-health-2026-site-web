<script setup lang="ts">
import BillyMascot from '@/components/BillyMascot.vue'
</script>

<template>
  <div class="contact-page page-width">
    <header>
      <span class="eyebrow">PARLONS DU PROJET</span>
      <h1>Gardons le lien<span>.</span></h1>
      <p>Une question, une idée ou l’envie de contribuer à Herbal Nexus ?</p>
    </header>
    <section class="contact-card" aria-labelledby="contact-name">
      <div class="contact-avatar" aria-hidden="true">CP</div>
      <div class="contact-info">
        <span class="contact-role">À l’origine d’Herbal Nexus</span>
        <h2 id="contact-name">Charlène Pernot</h2>
        <p>
          En reconversion professionnelle vers le domaine de la santé, Charlène porte le projet
          Herbal Nexus, présenté au Hacking Health de Besançon 2026.
        </p>
        <p>
          Son ambition : aider à repérer les interactions entre produits naturels et médicaments, et
          encourager le dialogue avec les professionnels de santé.
        </p>
        <p class="contact-email">
          <strong>E-mail :</strong>
          <a href="mailto:cpernot86@gmail.com">cpernot86@gmail.com</a>
        </p>
        <a
          class="primary-button"
          href="https://www.linkedin.com/in/charl%C3%A8ne-pernot/"
          target="_blank"
          rel="noopener noreferrer"
          >Retrouver Charlène sur LinkedIn ↗</a
        >
        <p class="source">
          Présentation issue de la
          <a
            href="https://fr.linkedin.com/posts/hacking-health-besancon_d%C3%A9fi-4-herbal-nexus-hh26-activity-7515881632533299201-9cTS"
            target="_blank"
            rel="noopener noreferrer"
            >publication de Hacking Health Besançon</a
          >.
        </p>
      </div>
      <BillyMascot :size="150" />
    </section>
  </div>
</template>

<style scoped>
.contact-page {
  padding-top: 64px;
  padding-bottom: 64px;
}
header {
  max-width: 790px;
  margin-bottom: 40px;
}
.eyebrow {
  color: #7155e8;
  font-weight: 750;
  letter-spacing: 2px;
  font-size: 14px;
}
h1 {
  font-size: clamp(40px, 6vw, 70px);
  line-height: 1.1;
  letter-spacing: -2px;
  margin: 18px 0;
}
h1 span {
  color: #7155e8;
}
header p {
  font-size: 22px;
  color: #746b80;
  line-height: 1.6;
}
.contact-card {
  display: flex;
  align-items: flex-start;
  gap: 28px;
  padding: 40px;
  border-radius: 28px;
  border: 1px solid #e0d5f3;
  background: linear-gradient(130deg, #f0eaff, #fff9ee);
}
.contact-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: #7155e8;
  color: white;
  font-size: 28px;
  font-weight: 750;
}
.contact-info {
  flex: 1;
  min-width: 0;
}
.contact-role {
  color: #7155e8;
  font-size: 16px;
  font-weight: 650;
}
h2 {
  font-size: 34px;
  margin: 8px 0 20px;
}
.contact-info p {
  font-size: 19px;
  line-height: 1.7;
  color: #62586d;
}
.primary-button {
  margin-top: 10px;
  text-decoration: none;
  text-align: center;
}
.contact-info .source {
  margin-top: 24px;
  font-size: 14px;
}
.source a {
  color: #6244a3;
}
.contact-email a {
  color: #6244a3;
  font-weight: 650;
  overflow-wrap: anywhere;
}
@media (max-width: 760px) {
  .contact-card {
    flex-wrap: wrap;
    padding: 24px;
    gap: 20px;
  }
  .contact-info {
    flex-basis: calc(100% - 110px);
  }
  .contact-card > :last-child {
    margin: 0 auto;
  }
}
@media (max-width: 440px) {
  .contact-info {
    flex-basis: 100%;
  }
  h2 {
    font-size: 30px;
  }
  .primary-button {
    font-size: 16px;
  }
}
</style>
