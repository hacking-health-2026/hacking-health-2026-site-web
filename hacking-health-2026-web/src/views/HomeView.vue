<script setup lang="ts">
</script>

<template>
  <div class="home-container">
    <header class="header">
      <div class="container">
        <h1>Herbal Nexus · Hacking Health 2026</h1>
        <p class="subtitle">Démonstration simulée des interactions plantes et médicaments</p>
      </div>
    </header>

    <main class="main-content">
      <section class="hero">
        <div class="container">
          <div class="hero-card">
            <h2>Explorez un scénario de démonstration</h2>
            <p>
              Sélectionnez un médicament et un complément du classeur Herbal Nexus.
              Le prototype retrouve leurs ingrédients et leurs classes, puis applique un calcul fictif dont chaque étape est visible.
            </p>
            <p>
              <strong>Mode démo :</strong> les scores et les modificateurs de profil sont inventés pour le hackathon.
              Les références du classeur ne sont pas vérifiées. Aucun usage médical.
            </p>
            <div class="cta-group">
              <RouterLink to="/compatibility" class="btn-primary">Ouvrir la démonstration</RouterLink>
              <a class="btn-secondary" href="/api/source/workbook">Consulter le classeur</a>
            </div>
          </div>
        </div>
      </section>

      <section class="features container">
        <div class="feature-grid">
          <div class="feature-item">
            <div class="icon">🧪</div>
            <h3>Matrice des interactions</h3>
            <p>Comparez jusqu'à cinq produits du classeur et visualisez les relations reconnues.</p>
          </div>
          <div class="feature-item">
            <div class="icon">⏱️</div>
            <h3>Calcul visible</h3>
            <p>Suivez le barème fictif et faites varier l'âge et le poids du profil de démonstration.</p>
          </div>
          <div class="feature-item">
            <div class="icon">🛡️</div>
            <h3>Scénarios prêts à présenter</h3>
            <p>Deux exemples préconfigurés avec les règles et les cellules du classeur utilisées.</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container">
        <p>&copy; 2026 Hacking Health Besançon - Équipe Défi n°4</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home-container {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #2c3e50;
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  background-color: #ffffff;
  padding: 2rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header h1 {
  margin: 0;
  color: #e63946;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
}

.subtitle {
  margin: 0.5rem 0 0;
  font-size: 1.1rem;
  color: #457b9d;
  font-weight: 500;
}

.hero {
  padding: 4rem 0;
  background: linear-gradient(135deg, #f1faee 0%, #a8dadc 100%);
  flex-grow: 1;
  display: flex;
  align-items: center;
}

.hero-card {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  max-width: 800px;
  margin: 0 auto;
}

.hero-card h2 {
  font-size: 2.5rem;
  margin-top: 0;
  color: #1d3557;
  line-height: 1.2;
}

.hero-card p {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.cta-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-primary {
  text-decoration: none;
  background-color: #e63946;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.btn-primary:hover {
  background-color: #d62839;
  transform: translateY(-2px);
}

.btn-secondary {
  text-decoration: none;
  background-color: transparent;
  color: #1d3557;
  border: 2px solid #1d3557;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #1d3557;
  color: white;
}

.features {
  padding: 4rem 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-item {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  background: #f8f9fa;
  transition: transform 0.3s;
}

.feature-item:hover {
  transform: translateY(-5px);
}

.feature-item .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-item h3 {
  color: #1d3557;
  margin-bottom: 1rem;
}

.footer {
  padding: 2rem 0;
  background-color: #1d3557;
  color: white;
  text-align: center;
  margin-top: auto;
}

/* Responsiveness */
@media (max-width: 768px) {
  .hero-card {
    padding: 2rem;
  }
  
  .hero-card h2 {
    font-size: 1.8rem;
  }
  
  .cta-group {
    flex-direction: column;
  }
  
  .header {
    text-align: center;
  }
}
</style>
