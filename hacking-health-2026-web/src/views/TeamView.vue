<script setup lang="ts">
const teamMembers = [
  {
    name: "Sophie Martin",
    role: "Porteuse de Projet",
    specialty: "Infirmière DE",
    icon: "👩‍⚕️",
    bio: "À l'origine de l'idée, Sophie apporte son expertise terrain sur les défis quotidiens de l'administration médicamenteuse."
  },
  {
    name: "Lucas Bernard",
    role: "Développeur",
    specialty: "Fullstack JavaScript",
    icon: "💻",
    bio: "En charge de transformer les concepts en une solution technique robuste et évolutive."
  },
  {
    name: "Léa Petit",
    role: "Marketing / Com",
    specialty: "Stratégie Digitale",
    icon: "📢",
    bio: "Assure la visibilité du projet et définit l'identité visuelle pour toucher les bons acteurs de santé."
  },
  {
    name: "Thomas Dubois",
    role: "Designer UI/UX",
    specialty: "Expérience Utilisateur",
    icon: "🎨",
    bio: "Conçoit une interface intuitive adaptée aux situations d'urgence et au stress du milieu hospitalier."
  },
  {
    name: "Dr. Julie Leroy",
    role: "Pharmacienne",
    specialty: "Pharmacie Hospitalière",
    icon: "💊",
    bio: "Garante de la base de données scientifique et de la fiabilité des interactions médicamenteuses."
  },
  {
    name: "Dr. Marc Morel",
    role: "Médecin",
    specialty: "Réanimation",
    icon: "🩺",
    bio: "Apporte son regard clinique sur l'intégration du logiciel dans le protocole de soin médical."
  },
  {
    name: "Nicolas Faivre",
    role: "Ingénieur Biomédical",
    specialty: "Systèmes de Santé",
    icon: "⚙️",
    bio: "Expert en intégration logicielle et conformité des dispositifs médicaux."
  }
];
</script>

<template>
  <div class="team-view">
    <section class="team-header">
      <div class="container">
        <h1>L'Équipe Défi n°4</h1>
        <p>Une synergie de compétences pour la sécurité des patients.</p>
      </div>
    </section>

    <section class="team-grid container">
      <div v-for="member in teamMembers" :key="member.name" class="member-card">
        <div class="member-icon">{{ member.icon }}</div>
        <h3>{{ member.name }}</h3>
        <div class="member-role">{{ member.role }}</div>
        <div class="member-specialty">{{ member.specialty }}</div>
        <p class="member-bio">{{ member.bio }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.team-header {
  padding: 4rem 0;
  background: #1d3557;
  color: white;
  text-align: center;
  margin-bottom: 3rem;
}

.team-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding-bottom: 5rem;
}

.member-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
  border-top: 5px solid #e63946;
}

.member-card:hover {
  transform: translateY(-10px);
}

.member-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.member-card h3 {
  margin: 0.5rem 0;
  color: #1d3557;
}

.member-role {
  font-weight: bold;
  color: #e63946;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 1px;
}

.member-specialty {
  color: #457b9d;
  font-style: italic;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.member-bio {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .team-header h1 {
    font-size: 2rem;
  }
}
</style>
