<script setup lang="ts">
</script>

<template>
  <div class="home-container">
    <header class="header">
      <div class="container">
        <h1>Hacking Health Besançon 2026</h1>
        <p class="subtitle">Défi n°4 : Sécurisation des mélanges de principes actifs</p>
      </div>
    </header>

    <main class="main-content">
      <section class="hero">
        <div class="container">
          <div class="hero-card">
            <h2>Quel mélange de principe actif ?</h2>
            <p>
              Dans le milieu hospitalier, l'administration simultanée de plusieurs médicaments est une pratique courante, mais complexe. 
              Certains principes actifs, lorsqu'ils sont mélangés, peuvent interagir de manière indésirable, perdant leur efficacité ou devenant toxiques.
            </p>
            <p>
              <strong>Notre mission :</strong> Développer un outil intuitif et rapide pour aider les soignants à vérifier la compatibilité des mélanges médicamenteux en un clin d'œil, garantissant ainsi la sécurité maximale des patients.
            </p>
            <div class="cta-group">
              <button class="btn-primary">En savoir plus</button>
              <button class="btn-secondary">Voir le prototype</button>
            </div>
          </div>
        </div>
      </section>

      <section class="features container">
        <div class="feature-grid">
          <div class="feature-item">
            <div class="icon">🧪</div>
            <h3>Analyse de Compatibilité</h3>
            <p>Vérification instantanée de la stabilité physico-chimique des mélanges.</p>
          </div>
          <div class="feature-item">
            <div class="icon">⏱️</div>
            <h3>Gain de Temps</h3>
            <p>Une interface pensée pour l'urgence et le quotidien des services de soins.</p>
          </div>
          <div class="feature-item">
            <div class="icon">🛡️</div>
            <h3>Sécurité Patient</h3>
            <p>Réduction drastique des risques d'erreurs médicamenteuses liées aux mélanges.</p>
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
