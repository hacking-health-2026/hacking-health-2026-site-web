<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import BillyMascot from '@/components/BillyMascot.vue'
import NexusFlower from '@/components/NexusFlower.vue'
import NexusIcon from '@/components/NexusIcon.vue'
</script>

<template>
  <a class="skip-link" href="#main-content">Aller au contenu</a>
  <header class="site-header">
    <div class="nav-wrap">
      <RouterLink class="brand" to="/" aria-label="Herbal Nexus, accueil"
        ><span class="brand-mark"><NexusFlower :size="31" /></span
        ><span
          >herbal<span class="brand-light">nexus</span><span class="brand-dot">.</span></span
        ></RouterLink
      >
      <nav class="main-nav" aria-label="Navigation principale">
        <RouterLink to="/" exact-active-class="nav-current">Accueil</RouterLink>
        <RouterLink to="/jeu" active-class="nav-current">Jeu</RouterLink>
        <RouterLink to="/contact" active-class="nav-current">Contact</RouterLink>
        <RouterLink to="/utilisation" active-class="nav-current" class="nav-use"
          >Utiliser <NexusIcon name="arrow" :size="16"
        /></RouterLink>
      </nav>
      <span class="event-tag"><span></span> Hacking Health 2026</span>
    </div>
  </header>
  <main id="main-content"><RouterView /></main>
  <footer class="site-footer">
    <div class="footer-inner">
      <span class="footer-signature"
        ><BillyMascot :size="70" /> Herbal Nexus <span>· Besançon 2026</span></span
      >
      <nav class="footer-contact" aria-label="Contact et réseaux sociaux">
        <RouterLink to="/contact">Contact</RouterLink>
        <a
          href="https://www.linkedin.com/in/charl%C3%A8ne-pernot/"
          target="_blank"
          rel="noopener noreferrer"
          >Charlène Pernot · LinkedIn ↗</a
        >
      </nav>
      <p>Prototype de présentation · Évaluation simulée, non validée pour un usage médical.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer-inner {
  flex-wrap: wrap;
}
.footer-contact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 22px;
}
.footer-contact a {
  color: #6244a3;
  font-weight: 650;
  text-decoration: none;
}
.footer-contact a:hover {
  text-decoration: underline;
}
@media (max-width: 420px) {
  .main-nav a {
    padding: 9px 10px;
    font-size: 15px;
  }
  .main-nav .nav-use {
    padding: 10px 11px;
  }
}
</style>
