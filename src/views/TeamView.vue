<script setup lang="ts">
const teamMembers = [
  {
    name: 'Sophie Martin',
    role: 'Porteuse de Projet',
    specialty: 'Infirmière DE',
    icon: '👩‍⚕️',
    bio: "À l'origine de l'idée, Sophie apporte son expertise terrain sur les défis quotidiens de l'administration médicamenteuse.",
  },
  {
    name: 'Lucas Bernard',
    role: 'Développeur',
    specialty: 'Fullstack JavaScript',
    icon: '💻',
    bio: 'En charge de transformer les concepts en une solution technique robuste et évolutive.',
  },
  {
    name: 'Léa Petit',
    role: 'Marketing / Com',
    specialty: 'Stratégie Digitale',
    icon: '📢',
    bio: "Assure la visibilité du projet et définit l'identité visuelle pour toucher les bons acteurs de santé.",
  },
  {
    name: 'Thomas Dubois',
    role: 'Designer UI/UX',
    specialty: 'Expérience Utilisateur',
    icon: '🎨',
    bio: "Conçoit une interface intuitive adaptée aux situations d'urgence et au stress du milieu hospitalier.",
  },
  {
    name: 'Dr. Julie Leroy',
    role: 'Pharmacienne',
    specialty: 'Pharmacie Hospitalière',
    icon: '💊',
    bio: 'Garante de la base de données scientifique et de la fiabilité des interactions médicamenteuses.',
  },
  {
    name: 'Dr. Marc Morel',
    role: 'Médecin',
    specialty: 'Réanimation',
    icon: '🩺',
    bio: "Apporte son regard clinique sur l'intégration du logiciel dans le protocole de soin médical.",
  },
  {
    name: 'Nicolas Faivre',
    role: 'Ingénieur Biomédical',
    specialty: 'Systèmes de Santé',
    icon: '⚙️',
    bio: 'Expert en intégration logicielle et conformité des dispositifs médicaux.',
  },
]
</script>

<template>
  <div class="team-page page-width">
    <header class="team-heading">
      <span class="eyebrow">Hacking Health · Défi n°4</span>
      <h1>Des regards différents.<br /><span>Un projet commun.</span></h1>
      <p>L’équipe réunie autour d’Herbal Nexus.</p>
    </header>
    <section class="team-grid" aria-label="Membres de l’équipe">
      <article
        v-for="(member, index) in teamMembers"
        :key="member.name"
        :class="['member', `member-${index % 4}`]"
      >
        <div class="member-avatar" aria-hidden="true">
          {{
            member.name
              .replace('Dr. ', '')
              .split(' ')
              .map((part) => part.charAt(0))
              .slice(0, 2)
              .join('')
          }}
        </div>
        <span class="member-role">{{ member.role }}</span>
        <h2>{{ member.name }}</h2>
        <p>{{ member.specialty }}</p>
      </article>
    </section>
  </div>
</template>
<style scoped>
.team-page {
  padding-top: 55px;
  padding-bottom: 20px;
}
.team-heading h1 {
  font-size: 48px;
  font-weight: 650;
  letter-spacing: -2px;
  line-height: 1.15;
  margin: 20px 0;
}
.team-heading h1 > span {
  color: var(--purple);
}
.team-heading > p {
  font-size: 14px;
  color: var(--muted);
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-top: 40px;
}
.member {
  background: #fff;
  border: 1px solid #ebe5f3;
  border-radius: 20px;
  padding: 25px;
  --avatar-bg: #eae1ff;
  --avatar-color: #7e5acc;
}
.member-1 {
  --avatar-bg: #ffe1ce;
  --avatar-color: #ce8050;
}
.member-2 {
  --avatar-bg: #e1edb9;
  --avatar-color: #819849;
}
.member-3 {
  --avatar-bg: #dceff0;
  --avatar-color: #62929d;
}
.member-avatar {
  display: grid;
  place-items: center;
  background: var(--avatar-bg);
  color: var(--avatar-color);
  width: 65px;
  height: 70px;
  border-radius: 20px;
  font-size: 20px;
  letter-spacing: -1px;
  font-weight: 600;
  margin-bottom: 25px;
  transform: rotate(-4deg);
}
.member-role {
  font-size: 9px;
  color: var(--avatar-color);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 650;
}
.member h2 {
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.5px;
  margin: 10px 0;
}
.member p {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 0;
}
@media (max-width: 1000px) {
  .team-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 700px) {
  .team-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .member {
    padding: 20px;
  }
  .team-heading h1 {
    font-size: 38px;
  }
  .team-page {
    padding-top: 35px;
  }
}
@media (max-width: 380px) {
  .team-grid {
    grid-template-columns: 1fr;
  }
}
</style>
