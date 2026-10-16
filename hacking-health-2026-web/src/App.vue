<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <div class="logo">HackingHealth 2026</div>
      <div class="nav-links">
        <RouterLink to="/">Accueil</RouterLink>
        <RouterLink to="/compatibility">Vérifier</RouterLink>
        <RouterLink to="/team">Notre Équipe</RouterLink>
      </div>
    </div>
  </nav>

  <RouterView />
</template>

<style>
/* Global styles */
body { margin: 0; font-family: 'Inter', sans-serif; background-color: #f8f9fa; }
.navbar { background: #1d3557; color: white; padding: 1rem 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.navbar .container { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.logo { font-weight: bold; font-size: 1.2rem; }
.nav-links { display: flex; gap: 20px; }
.nav-links a { color: white; text-decoration: none; font-weight: 500; padding: 5px 0; border-bottom: 2px solid transparent; transition: border-color 0.2s; }
.nav-links a:hover { color: #a8dadc; }
.nav-links a.router-link-active { color: #a8dadc; border-bottom: 2px solid #a8dadc; }
</style>

