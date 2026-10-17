<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import NexusIcon from './NexusIcon.vue'
import type { GameCase } from '@/data/game'

const props = defineProps<{ medicine: GameCase; component: GameCase; attempt: number }>()
const emit = defineEmits<{ dismiss: []; retry: [] }>()
const reveal = ref(false)
const popup = ref<HTMLElement>()
const closeButton = ref<HTMLButtonElement>()
let previousFocus: HTMLElement | null = null
onMounted(() => {
  previousFocus = document.activeElement as HTMLElement | null
  closeButton.value?.focus({ preventScroll: true })
})
onBeforeUnmount(() => {
  if (popup.value?.contains(document.activeElement)) previousFocus?.focus({ preventScroll: true })
})
const cheers = [
  'Oups, mes pétales ont frémi !',
  'Presque ! On mène l’enquête ?',
  'Un détour, c’est aussi une découverte !',
  'Le labo n’a pas dit son dernier mot !',
]
const cheer = computed(() => cheers[(props.attempt - 1) % cheers.length])
</script>

<template>
  <aside
    ref="popup"
    class="coach-popup"
    role="dialog"
    aria-modal="false"
    aria-labelledby="coach-title"
    @keydown.esc.stop="emit('dismiss')"
  >
    <div class="coach-mascot" aria-hidden="true">
      <svg viewBox="0 0 140 145" fill="none">
        <ellipse cx="70" cy="135" rx="38" ry="6" fill="#7155e8" opacity=".12" />
        <path d="M69 99v29" stroke="#688754" stroke-width="8" stroke-linecap="round" />
        <path d="M66 119C39 122 35 102 40 99c20-3 30 9 26 20Z" fill="#a9cb79" />
        <path d="M74 124c26-1 31-17 25-22-19-2-29 12-25 22Z" fill="#bddb8e" />
        <g class="coach-flower">
          <path
            d="M70 19C84-3 107 9 104 29c24-4 37 20 19 35 20 16 8 40-15 37-3 24-31 29-40 9-19 17-43 1-34-20-25 1-34-26-13-38C6 32 24 11 44 22 47 2 66 1 70 19Z"
            fill="#9775ec"
          />
          <circle cx="70" cy="62" r="32" fill="#fff0b8" />
          <ellipse cx="57" cy="62" rx="3.5" ry="5" fill="#433455" />
          <ellipse cx="82" cy="62" rx="3.5" ry="5" fill="#433455" />
          <path d="M61 75q9 10 18 0" stroke="#433455" stroke-width="3" stroke-linecap="round" />
          <ellipse cx="48" cy="73" rx="6" ry="3.5" fill="#f7a898" />
          <ellipse cx="91" cy="73" rx="6" ry="3.5" fill="#f7a898" />
        </g>
        <path
          class="coach-wave"
          d="M111 86q18-12 15-28m0 0-6 2m6-2 4 5"
          stroke="#688754"
          stroke-width="5"
          stroke-linecap="round"
        />
        <path d="m17 9 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#edb546" />
      </svg>
      <span>Nexus</span>
    </div>
    <div class="coach-bubble">
      <button
        ref="closeButton"
        class="coach-close"
        type="button"
        aria-label="Fermer la bulle de Nexus"
        @click="emit('dismiss')"
      >
        <NexusIcon name="close" :size="18" />
      </button>
      <p class="coach-label">Votre complice du labo</p>
      <h2 id="coach-title">{{ cheer }}</h2>
      <div class="coach-message" aria-live="polite">
        <p>
          <b>{{ component.ingredient }}</b> ne correspond pas à l’indice de
          <b>{{ medicine.medicine }}</b> dans cette partie.
        </p>
        <div class="coach-discovery">
          <NexusIcon name="leaf" :size="19" />
          <p>
            <b>Petite découverte</b><br />Le classeur mentionne ce composant dans :
            {{ component.foundIn }}.
          </p>
        </div>
        <template v-if="reveal">
          <p class="coach-answer">
            <b>Le duo à retrouver : {{ medicine.medicine }} + {{ medicine.ingredient }}.</b><br />{{
              medicine.explanation
            }}
          </p>
          <small>{{ medicine.source }}</small>
        </template>
        <p v-else class="coach-tip"><b>Pour votre prochain essai :</b> {{ medicine.clue }}</p>
      </div>
      <div class="coach-actions">
        <button v-if="!reveal" type="button" class="coach-hint" @click="reveal = true">
          Montre-moi le duo
        </button>
        <button type="button" class="coach-retry" @click="emit('retry')">
          Je retente ! <NexusIcon name="spark" :size="15" />
        </button>
      </div>
      <p class="coach-note">
        Ici, le rouge indique une réponse au jeu, pas une preuve d’absence d’interaction.
      </p>
    </div>
  </aside>
</template>

<style scoped>
.coach-popup {
  position: fixed;
  z-index: 80;
  bottom: 24px;
  right: 24px;
  width: min(440px, calc(100vw - 32px));
  animation: coach-enter 0.3s ease-out;
  filter: drop-shadow(0 15px 28px #39215a24);
}
.coach-mascot {
  position: absolute;
  width: 115px;
  height: 130px;
  top: -110px;
  left: 10px;
  pointer-events: none;
}
.coach-mascot svg {
  width: 100%;
  height: 100%;
}
.coach-mascot span {
  position: absolute;
  bottom: 0;
  left: 30px;
  border-radius: 20px;
  padding: 4px 12px;
  background: #7155e8;
  color: white;
  font-size: 10px;
  font-weight: 700;
}
.coach-flower {
  transform-origin: 70px 100px;
  animation: coach-sway 2.8s ease-in-out infinite;
}
.coach-wave {
  transform-origin: 111px 86px;
  animation: coach-wave 1.4s ease-in-out 2;
}
.coach-bubble {
  position: relative;
  border: 2px solid #d7c7f4;
  border-radius: 24px;
  background: #fffdf7;
  padding: 23px;
  max-height: min(560px, calc(100dvh - 160px));
  overflow-y: auto;
}
.coach-close {
  position: absolute;
  right: 12px;
  top: 12px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  background: #eee7fa;
  color: #7155e8;
}
.coach-label {
  text-transform: uppercase;
  letter-spacing: 1.4px;
  font-size: 9px;
  color: #9070b5;
  font-weight: 700;
  margin: 0 30px 8px 0;
}
h2 {
  font-size: 21px;
  line-height: 1.2;
  color: #49345e;
  margin: 0 16px 14px 0;
  letter-spacing: -0.5px;
}
.coach-message {
  font-size: 12px;
  line-height: 1.65;
  color: #6b5c78;
}
.coach-message p {
  margin: 0 0 12px;
}
.coach-discovery {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  background: #eef4df;
  padding: 12px;
  border-radius: 13px;
  margin: 12px 0;
}
.coach-discovery svg {
  flex-shrink: 0;
  color: #6b8850;
  margin-top: 3px;
}
.coach-discovery p {
  margin: 0;
}
.coach-answer {
  background: #f0eafb;
  padding: 12px;
  border-radius: 13px;
}
.coach-message small {
  display: block;
  font-size: 9px;
  line-height: 1.6;
}
.coach-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 16px;
}
.coach-actions button {
  font-size: 11px;
  font-weight: 700;
  padding: 11px 14px;
  border-radius: 12px;
  border: 0;
}
.coach-hint {
  background: #eee7fa;
  color: #7155e8;
}
.coach-retry {
  background: #7155e8;
  color: white;
  display: flex;
  align-items: center;
  gap: 7px;
}
.coach-note {
  font-size: 9px;
  line-height: 1.5;
  color: #8b7e94;
  margin: 13px 0 0;
}
button:focus-visible {
  outline: 3px solid #fb704b;
  outline-offset: 3px;
}
@keyframes coach-enter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes coach-sway {
  50% {
    transform: rotate(5deg);
  }
}
@keyframes coach-wave {
  50% {
    transform: rotate(-16deg);
  }
}
@media (max-width: 600px) {
  .coach-popup {
    bottom: 12px;
    right: 16px;
  }
  .coach-bubble {
    padding: 20px;
    max-height: calc(100dvh - 155px);
  }
  .coach-mascot {
    width: 95px;
    height: 108px;
    top: -90px;
  }
  h2 {
    font-size: 19px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .coach-popup,
  .coach-flower,
  .coach-wave {
    animation: none;
  }
}
</style>
