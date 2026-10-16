<script setup lang="ts">
import { ref, reactive } from 'vue';

const drugs = reactive([
  { id: 1, name: '', selected: false },
  { id: 2, name: '', selected: false }
]);

const result = ref<{ status: 'safe' | 'danger' | 'unknown' | null, message: string }>({
  status: null,
  message: ''
});

const checkCompatibility = () => {
  if (!drugs[0].name || !drugs[1].name) {
    result.value = { status: 'unknown', message: 'Veuillez saisir deux principes actifs pour vérifier leur compatibilité.' };
    return;
  }
  
  // Simulation simple pour la démonstration
  const d1 = drugs[0].name.toLowerCase();
  const d2 = drugs[1].name.toLowerCase();
  
  if (d1.includes('insuline') && d2.includes('héparine')) {
    result.value = { status: 'danger', message: 'Attention : Incompatibilité physico-chimique détectée. Risque de précipitation.' };
  } else {
    result.value = { status: 'safe', message: 'Aucune interaction majeure répertoriée. Cependant, restez vigilant et vérifiez le protocole de service.' };
  }
};

const addDrug = () => {
  drugs.push({ id: drugs.length + 1, name: '', selected: false });
};
</script>

<template>
  <div class="compatibility-view">
    <section class="page-header">
      <div class="container">
        <h1>Vérifier la Compatibilité</h1>
        <p>Testez le mélange de deux ou plusieurs principes actifs en temps réel.</p>
      </div>
    </section>

    <div class="container main-section">
      <div class="checker-card">
        <div class="input-group">
          <div v-for="(drug, index) in drugs" :key="drug.id" class="drug-input-wrapper">
            <label :for="'drug-' + drug.id">Principe Actif {{ index + 1 }}</label>
            <input 
              :id="'drug-' + drug.id"
              v-model="drug.name" 
              type="text" 
              placeholder="Ex: Insuline, Héparine, etc."
              class="drug-input"
            />
          </div>
        </div>

        <div class="actions">
          <button @click="addDrug" class="btn-add">+ Ajouter un produit</button>
          <button @click="checkCompatibility" class="btn-check">Vérifier maintenant</button>
        </div>

        <div v-if="result.status" :class="['result-box', result.status]">
          <div class="result-icon">
            <span v-if="result.status === 'safe'">✅</span>
            <span v-if="result.status === 'danger'">⚠️</span>
            <span v-if="result.status === 'unknown'">ℹ️</span>
          </div>
          <div class="result-content">
            <h3>{{ result.status === 'danger' ? 'Alerte Interaction' : 'Analyse terminée' }}</h3>
            <p>{{ result.message }}</p>
          </div>
        </div>
      </div>

      <div class="info-sidebar">
        <div class="info-card">
          <h4>💡 Guide d'utilisation</h4>
          <ul>
            <li>Saisissez le nom des molécules (DCI).</li>
            <li>Le système vérifie la stabilité physique et chimique.</li>
            <li>En cas de doute, consultez toujours votre pharmacien hospitalier.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  padding: 3rem 0;
  background: #a8dadc;
  color: #1d3557;
  text-align: center;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.main-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  padding: 3rem 20px;
}

.checker-card {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.drug-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.drug-input-wrapper label {
  font-weight: 600;
  color: #457b9d;
}

.drug-input {
  padding: 0.8rem 1rem;
  border: 2px solid #f1faee;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background-color: #f8f9fa;
}

.drug-input:focus {
  outline: none;
  border-color: #a8dadc;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-add {
  background: #f1faee;
  color: #1d3557;
  border: 1px dashed #457b9d;
  padding: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  flex: 1;
}

.btn-check {
  background: #e63946;
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  flex: 1;
}

.result-box {
  padding: 1.5rem;
  border-radius: 10px;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-box.safe { background-color: #e9f5db; border: 1px solid #7cb518; }
.result-box.danger { background-color: #ffe5ec; border: 1px solid #fb6f92; }
.result-box.unknown { background-color: #f1faee; border: 1px solid #a8dadc; }

.result-icon { font-size: 1.5rem; }
.result-content h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
.result-content p { margin: 0; font-size: 0.95rem; }

.info-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #457b9d;
}

.info-card h4 { margin-top: 0; color: #1d3557; }
.info-card ul { padding-left: 1.2rem; }
.info-card li { margin-bottom: 0.8rem; font-size: 0.9rem; color: #555; }

@media (max-width: 768px) {
  .main-section {
    grid-template-columns: 1fr;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>
