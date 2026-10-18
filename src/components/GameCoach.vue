<script setup lang="ts">
import { computed } from 'vue'
import NexusIcon from './NexusIcon.vue'
import type { GameCase } from '@/data/game'
const props = defineProps<{ component: GameCase; attempt: number }>()
const emit = defineEmits<{ dismiss: [] }>()
const mascotUrl = `${import.meta.env.BASE_URL}billy-mascot-transparent.png`
const cheers = [
  'Oups, les molécules s’emmêlent !',
  'Pas ce duo ! À toi de rejouer.',
  'Une autre piste ? Essaie encore !',
]
const cheer = computed(() => cheers[(props.attempt - 1) % cheers.length])
</script>
<template>
  <aside class="coach" role="status" aria-label="Un conseil de Billy">
    <img :src="mascotUrl" alt="Billy, la mascotte du labo" />
    <div class="coach-bubble">
      <button type="button" aria-label="Fermer la bulle de la mascotte" @click="emit('dismiss')">
        <NexusIcon name="close" :size="18" />
      </button>
      <strong>{{ cheer }}</strong>
      <p>
        Ce duo ne correspond à aucune des associations documentées pour cette partie. Essaie un
        autre composant !
      </p>
      <small>{{ component.ingredient }} : à retrouver dans {{ component.foundIn }}.</small>
    </div>
  </aside>
</template>
<style scoped>
.coach {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 720px;
  margin: 12px auto;
}
.coach img {
  width: 84px;
  height: 96px;
  object-fit: contain;
  flex-shrink: 0;
}
.coach-bubble {
  position: relative;
  flex: 1;
  padding: 16px 44px 16px 20px;
  border: 1px solid #efc391;
  background: #fff4e7;
  border-radius: 18px;
  color: #834c28;
  line-height: 1.5;
}
.coach-bubble::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 38px;
  width: 12px;
  height: 12px;
  border-left: 1px solid #efc391;
  border-bottom: 1px solid #efc391;
  background: #fff4e7;
  transform: rotate(45deg);
}
strong {
  display: block;
  font-size: 19px;
}
p {
  font-size: 17px;
  margin: 4px 0;
}
small {
  display: block;
  font-size: 14px;
}
button {
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  background: transparent;
  color: #834c28;
  border-radius: 50%;
  cursor: pointer;
}
button:focus-visible {
  outline: 2px solid #834c28;
}
@media (max-width: 600px) {
  .coach {
    gap: 8px;
  }
  .coach img {
    width: 56px;
    height: 76px;
  }
  .coach-bubble {
    padding: 12px 34px 12px 14px;
  }
  strong {
    font-size: 17px;
  }
  p {
    font-size: 16px;
  }
}
</style>
