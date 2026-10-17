<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
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
        ><NexusFlower :size="19" /> Herbal Nexus <span>· Besançon 2026</span></span
      >
      <p>Prototype de présentation · Évaluation simulée, non validée pour un usage médical.</p>
    </div>
  </footer>
</template>
