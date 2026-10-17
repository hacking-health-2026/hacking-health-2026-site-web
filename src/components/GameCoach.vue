<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import NexusIcon from './NexusIcon.vue'
import type { GameCase } from '@/data/game'

const props = defineProps<{ medicine: GameCase; component: GameCase; attempt: number }>()
const emit = defineEmits<{ dismiss: []; retry: [] }>()
const reveal = ref(false)
const mascotUrl = `${import.meta.env.BASE_URL}billy-mascot.png`
const severe = computed(() => props.medicine.severity === 'Rouge')
const popup = ref<HTMLDialogElement>()
const closeButton = ref<HTMLButtonElement>()
let previousFocus: HTMLElement | null = null
onMounted(() => {
  previousFocus = document.activeElement as HTMLElement | null
  popup.value?.showModal()
  closeButton.value?.focus({ preventScroll: true })
})
onBeforeUnmount(() => {
  popup.value?.close()
  previousFocus?.focus({ preventScroll: true })
})
const cheers = [
  'Oups, les molécules s’emmêlent !',
  'Presque ! On mène l’enquête ?',
  'Un détour, c’est aussi une découverte !',
  'Le labo n’a pas dit son dernier mot !',
]
const cheer = computed(() => cheers[(props.attempt - 1) % cheers.length])
</script>

<template>
  <dialog
    ref="popup"
    class="coach-popup"
    role="dialog"
    :class="{ severe }"
    @cancel.prevent="emit('dismiss')"
    aria-labelledby="coach-title"
    @keydown.esc.stop="emit('dismiss')"
  >
    <div class="coach-mascot">
      <img :src="mascotUrl" alt="La mascotte Billy, votre complice du labo" />
    </div>
    <div class="coach-bubble">
      <button
        ref="closeButton"
        class="coach-close"
        type="button"
        aria-label="Fermer la bulle de la mascotte"
        @click="emit('dismiss')"
      >
        <NexusIcon name="close" :size="18" />
      </button>
      <p class="coach-label">Votre complice du labo</p>
      <p class="coach-severity">
        <NexusIcon name="info" :size="15" />{{ severe ? 'Danger' : 'Risque modéré' }} · duo à
        retrouver
      </p>
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
        La couleur de cette bulle indique la gravité du duo à retrouver dans le classeur, pas celle
        du lien incorrect.
      </p>
    </div>
  </dialog>
</template>

<style scoped>
.coach-popup {
  --coach-color: #a64b11;
  --coach-tint: #fff0df;
  --coach-border: #f2bc82;
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(740px, calc(100vw - 32px));
  max-width: none;
  max-height: calc(100dvh - 32px);
  border: 2px solid var(--coach-border);
  border-radius: 28px;
  padding: 24px;
  background: #fffdf9;
  color: #493b35;
  overflow-y: auto;
  box-sizing: border-box;
  box-shadow: 0 25px 100px #2d17374d;
  animation: coach-enter 0.25s ease-out;
}
.coach-popup[open] {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  align-items: center;
  gap: 22px;
}
.coach-popup.severe {
  --coach-color: #b62c36;
  --coach-tint: #fff0ef;
  --coach-border: #eea2a5;
}
.coach-popup::backdrop {
  background: #24183066;
  backdrop-filter: blur(4px);
}
.coach-mascot {
  align-self: start;
  padding-top: 35px;
}
.coach-mascot img {
  width: 190px;
  height: 220px;
  object-fit: cover;
  object-position: center 72%;
  display: block;
  border-radius: 20px;
  background: white;
  animation: coach-sway 3s ease-in-out infinite;
}
.coach-bubble {
  min-width: 0;
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
  background: var(--coach-tint);
  color: var(--coach-color);
}
.coach-label {
  text-transform: uppercase;
  letter-spacing: 1.4px;
  font-size: 9px;
  color: #8d7569;
  font-weight: 700;
  margin: 0 25px 9px 0;
}
.coach-severity {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 750;
  color: var(--coach-color);
  background: var(--coach-tint);
  border-radius: 30px;
  padding: 7px 10px;
  margin: 0 0 12px;
}
h2 {
  font-size: 23px;
  line-height: 1.2;
  color: #493b35;
  margin: 0 12px 14px 0;
  letter-spacing: -0.5px;
}
.coach-message {
  font-size: 12px;
  line-height: 1.65;
  color: #6b5c57;
}
.coach-message p {
  margin: 0 0 12px;
}
.coach-discovery {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  background: var(--coach-tint);
  padding: 12px;
  border-radius: 13px;
  margin: 12px 0;
}
.coach-discovery svg {
  flex-shrink: 0;
  color: var(--coach-color);
  margin-top: 3px;
}
.coach-discovery p {
  margin: 0;
}
.coach-answer {
  background: var(--coach-tint);
  padding: 12px;
  border-radius: 13px;
  border-left: 3px solid var(--coach-color);
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
  background: var(--coach-tint);
  color: var(--coach-color);
}
.coach-retry {
  background: var(--coach-color);
  color: white;
  display: flex;
  align-items: center;
  gap: 7px;
}
.coach-note {
  font-size: 9px;
  line-height: 1.5;
  color: #8b7e79;
  margin: 13px 0 0;
}
button:focus-visible {
  outline: 3px solid var(--coach-color);
  outline-offset: 3px;
}
@keyframes coach-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes coach-sway {
  50% {
    transform: rotate(3deg);
  }
}
@media (max-width: 600px) {
  .coach-popup {
    padding: 20px;
  }
  .coach-popup[open] {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .coach-mascot {
    padding: 0;
    justify-self: center;
  }
  .coach-mascot img {
    width: 135px;
    height: 125px;
    object-position: center 65%;
  }
  h2 {
    font-size: 20px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .coach-popup,
  .coach-mascot img {
    animation: none;
  }
}
</style>
