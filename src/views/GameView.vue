<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import NexusIcon from '@/components/NexusIcon.vue'
import { clearIncorrectPairs, connectPair, gameCases, type GameId } from '@/data/game'

const selected = ref<GameId>('ciclosporine')
const pairs = ref<Partial<Record<GameId, GameId>>>({})
const order = ref([3, 0, 4, 1, 2])
const lastAttempt = ref<{ medicine: GameId; ingredient: GameId }>()
const board = ref<HTMLElement>()
const wires = ref<
  { id: GameId; path: string; x1: number; y1: number; x2: number; y2: number; correct: boolean }[]
>([])
let resizeObserver: ResizeObserver | undefined

function measureWires() {
  if (!board.value) return
  const bounds = board.value.getBoundingClientRect()
  wires.value = gameCases.flatMap((item) => {
    const target = pairs.value[item.id]
    if (!target) return []
    const from = board
      .value!.querySelector<HTMLElement>(`[data-medicine="${item.id}"]`)
      ?.getBoundingClientRect()
    const to = board
      .value!.querySelector<HTMLElement>(`[data-ingredient="${target}"]`)
      ?.getBoundingClientRect()
    if (!from || !to) return []
    const x1 = from.right - bounds.left
    const y1 = from.top + from.height / 2 - bounds.top
    const x2 = to.left - bounds.left
    const y2 = to.top + to.height / 2 - bounds.top
    const bend = Math.max(18, (x2 - x1) * 0.6)
    return [
      {
        id: item.id,
        x1,
        y1,
        x2,
        y2,
        correct: item.id === target,
        path: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`,
      },
    ]
  })
}
watch(
  [pairs, order],
  async () => {
    await nextTick()
    measureWires()
  },
  { deep: true },
)
onMounted(() => {
  resizeObserver = new ResizeObserver(measureWires)
  if (board.value) resizeObserver.observe(board.value)
  window.addEventListener('resize', measureWires)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', measureWires)
})
const ingredients = computed(() => order.value.map((i) => gameCases[i]!))
const pairCount = computed(() => gameCases.filter((c) => pairs.value[c.id] === c.id).length)
const selectedCase = computed(() => gameCases.find((c) => c.id === selected.value)!)
const feedback = computed(() => {
  if (!lastAttempt.value) return undefined
  return {
    correct: lastAttempt.value.medicine === lastAttempt.value.ingredient,
    medicine: gameCases.find((c) => c.id === lastAttempt.value!.medicine)!,
    ingredient: gameCases.find((c) => c.id === lastAttempt.value!.ingredient)!,
  }
})
const ingredientName = (id?: GameId) => gameCases.find((c) => c.id === id)?.ingredient
const owner = (id: GameId) => gameCases.find((c) => pairs.value[c.id] === id)
const connectionState = (medicine: GameId) =>
  !pairs.value[medicine] ? '' : pairs.value[medicine] === medicine ? 'correct' : 'incorrect'
const ingredientState = (ingredient: GameId) => {
  const medicine = owner(ingredient)
  return medicine ? connectionState(medicine.id) : ''
}

function selectMedicine(id: GameId) {
  pairs.value = clearIncorrectPairs(pairs.value)
  lastAttempt.value = undefined
  selected.value = id
}
function link(id: GameId) {
  const medicine = selected.value
  pairs.value = connectPair(clearIncorrectPairs(pairs.value), medicine, id)
  lastAttempt.value = { medicine, ingredient: id }
  // Keep a failed attempt selected so it can be corrected immediately.
  if (medicine === id) {
    const remaining = gameCases.find((c) => pairs.value[c.id] !== c.id)
    if (remaining) selected.value = remaining.id
  }
}
function restart() {
  pairs.value = {}
  lastAttempt.value = undefined
  selected.value = 'ciclosporine'
  order.value = [...order.value.slice(1), order.value[0]!]
}
</script>

<template>
  <div class="game-page page-width">
    <header class="game-intro">
      <div>
        <p class="eyebrow">À vous de relier</p>
        <h1>Un duo.<br />À vous de faire le lien<span class="game-dot">.</span></h1>
        <p class="game-lead">
          Cinq duos à retrouver. Reliez les cartes à l’aide des indices<br class="desktop-break" />
          et découvrez où se cachent ces composants.
        </p>
      </div>
      <div class="game-emblem" aria-hidden="true">
        <NexusIcon name="pill" :size="45" /><span>+</span><NexusIcon name="leaf" :size="45" />
        <small>Reliez. Découvrez.<br /><strong>Retenez le bon réflexe.</strong></small>
      </div>
    </header>

    <section class="game-workspace">
      <header class="game-section-head">
        <div>
          <p class="eyebrow">Le jeu des associations</p>
          <h2>À vous de connecter !</h2>
        </div>
        <span class="game-counter" :class="{ complete: pairCount === 5 }" aria-live="polite"
          >{{ pairCount }} / 5 liens corrects</span
        >
      </header>
      <p class="game-instruction">
        Cliquez sur une carte à gauche, puis sur son ingrédient à droite. Faites apparaître les cinq
        liens verts !
      </p>
      <p class="game-legend">
        <span><i class="legend-green"></i> Bonne réponse</span
        ><span><i class="legend-red"></i> Lien à revoir</span
        ><small
          >Les couleurs indiquent la justesse du lien dans le jeu, pas la sécurité d’une
          association.</small
        >
      </p>

      <div class="board-toolbar">
        <span><NexusIcon name="link" :size="17" /> Connectez les cartes</span>
        <div class="level-dots" aria-hidden="true">
          <i v-for="n in 5" :key="n" :class="{ solved: n <= pairCount }"></i>
        </div>
      </div>
      <p class="selection-prompt" aria-live="polite">
        Carte sélectionnée : <strong>{{ selectedCase.medicine }}</strong
        ><span>Choisissez son ingrédient</span><NexusIcon name="arrow" :size="17" />
      </p>
      <div ref="board" class="matching-board">
        <svg class="connection-wires" aria-hidden="true">
          <g
            v-for="wire in wires"
            :key="wire.id"
            :class="wire.correct ? 'wire-correct' : 'wire-incorrect'"
          >
            <path class="wire-halo" :d="wire.path" />
            <path class="wire-line" :d="wire.path" />
            <circle :cx="wire.x1" :cy="wire.y1" r="5" />
            <circle :cx="wire.x2" :cy="wire.y2" r="5" />
          </g>
        </svg>
        <div class="match-column">
          <h3>
            <NexusIcon name="pill" :size="18" /> Les médicaments <span>Principe actif indiqué</span>
          </h3>
          <button
            v-for="(item, index) in gameCases"
            :key="item.id"
            :data-medicine="item.id"
            class="medicine-card"
            :class="[connectionState(item.id), { selected: selected === item.id }]"
            :aria-pressed="selected === item.id"
            @click="selectMedicine(item.id)"
          >
            <span class="card-number">0{{ index + 1 }}</span>
            <span class="card-body"
              ><strong>{{ item.medicine }}</strong
              ><small>{{ item.role }} · Actif : {{ item.active }}</small
              ><span class="card-clue">{{ item.clue }}</span>
              <span v-if="pairs[item.id]" class="connection-chip"
                ><NexusIcon
                  :name="connectionState(item.id) === 'correct' ? 'check' : 'close'"
                  :size="14"
                />{{ ingredientName(pairs[item.id]) }} ·
                {{ connectionState(item.id) === 'correct' ? 'Bon lien' : 'À revoir' }}</span
              > </span
            ><NexusIcon
              :name="
                !pairs[item.id]
                  ? 'plus'
                  : connectionState(item.id) === 'correct'
                    ? 'check'
                    : 'close'
              "
              :size="20"
            />
          </button>
        </div>
        <div class="match-column ingredients-column">
          <h3>
            <NexusIcon name="leaf" :size="18" /> Les ingrédients
            <span>À associer une seule fois</span>
          </h3>
          <button
            v-for="item in ingredients"
            :key="item.id"
            :data-ingredient="item.id"
            class="ingredient-card"
            :class="ingredientState(item.id)"
            :aria-label="`Relier ${item.ingredient} à ${selectedCase.medicine}`"
            @click="link(item.id)"
          >
            <span class="ingredient-symbol"
              ><NexusIcon :name="item.id === 'levothyroxine' ? 'spark' : 'leaf'" :size="23"
            /></span>
            <span class="card-body"
              ><strong>{{ item.ingredient }}</strong
              ><small>{{ item.ingredientNote }}</small>
              <span v-if="owner(item.id)" class="ingredient-owner"
                >{{ ingredientState(item.id) === 'correct' ? 'Bon lien' : 'Lien à revoir' }} ·
                {{ owner(item.id)?.medicine }}</span
              > </span
            ><NexusIcon
              :name="
                !owner(item.id)
                  ? 'plus'
                  : ingredientState(item.id) === 'correct'
                    ? 'check'
                    : 'close'
              "
              :size="18"
            />
          </button>
        </div>
      </div>
      <div
        v-if="feedback"
        class="instant-feedback"
        :class="feedback.correct ? 'correct' : 'incorrect'"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <NexusIcon :name="feedback.correct ? 'check' : 'close'" :size="23" />
        <div>
          <strong>{{ feedback.correct ? 'Bien joué !' : 'Pas ce lien-là, réessayez !' }}</strong>
          <p>
            {{ feedback.medicine.medicine }} + {{ feedback.ingredient.ingredient }} :
            {{
              feedback.correct
                ? 'ce lien correspond à l’indice.'
                : 'ce lien ne correspond pas à l’indice de cette fiche.'
            }}
          </p>
          <p class="found-in"><b>Où le trouver ?</b> {{ feedback.ingredient.foundIn }}</p>
          <a :href="feedback.ingredient.originUrl" target="_blank" rel="noopener noreferrer"
            >En savoir plus sur cet ingrédient <NexusIcon name="arrow" :size="13"
          /></a>
        </div>
      </div>

      <div v-if="pairCount === 5" class="game-complete" role="status">
        <NexusIcon name="spark" :size="25" />
        <div>
          <strong>Les cinq liens sont retrouvés. Bien joué !</strong>
          <p>Vous savez maintenant dans quels produits retrouver ces ingrédients.</p>
        </div>
      </div>
      <div class="game-actions">
        <p>Un clic pour relier, une explication pour retenir.</p>
        <button class="game-primary" @click="restart">
          Recommencer <NexusIcon name="spark" :size="18" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.game-page {
  padding-top: 56px;
  padding-bottom: 76px;
}
.game-intro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  margin-bottom: 40px;
}
.game-intro h1 {
  font-size: clamp(42px, 5vw, 66px);
  line-height: 1.06;
  letter-spacing: -3px;
  margin-bottom: 22px;
}
.game-dot {
  color: var(--coral);
  margin-left: 6px;
}
.game-lead {
  font-size: 17px;
  line-height: 1.6;
  color: #666471;
  margin-bottom: 0;
}
.game-emblem {
  width: 270px;
  min-height: 200px;
  flex-shrink: 0;
  background: var(--lime);
  border-radius: 42% 48% 38% 45%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 17px;
  flex-wrap: wrap;
  padding: 35px 26px;
  transform: rotate(5deg);
}
.game-emblem > span {
  font-size: 29px;
}
.game-emblem small {
  width: 100%;
  text-align: center;
  font-size: 14px;
  line-height: 1.6;
  transform: rotate(-5deg);
}
.game-workspace {
  background: white;
  border: 1px solid var(--line);
  border-radius: 28px;
  padding: 34px;
  box-shadow: var(--shadow);
}
.game-section-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}
.game-section-head h2 {
  font-size: 30px;
  letter-spacing: -1px;
  margin-bottom: 12px;
  max-width: 760px;
  scroll-margin-top: 25px;
}
.game-section-head h2:focus {
  outline: none;
}
.game-counter {
  white-space: nowrap;
  background: var(--lavender);
  color: #6348c7;
  font-size: 13px;
  padding: 10px 16px;
  border-radius: 30px;
  font-weight: 700;
}
.game-instruction {
  color: #6c6977;
  line-height: 1.65;
  font-size: 14px;
  margin-bottom: 28px;
  max-width: 800px;
}
.matching-board {
  display: grid;
  grid-template-columns: 1.12fr 1fr;
  gap: 32px;
}
.match-column h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  margin-bottom: 18px;
}
.match-column h3 > span {
  margin-left: auto;
  font-size: 11px;
  font-weight: 450;
  color: #817d89;
}
.medicine-card,
.ingredient-card {
  width: 100%;
  text-align: left;
  border: 1px solid #e8e5ef;
  border-radius: 17px;
  background: #fcfbfe;
  padding: 19px;
  display: flex;
  gap: 14px;
  align-items: center;
  color: var(--ink);
  transition:
    border-color 0.15s,
    background 0.15s;
  margin-bottom: 12px;
  min-height: 125px;
}
.medicine-card.selected {
  border-color: var(--purple);
  background: #f3efff;
  box-shadow: 0 0 0 2px #7155e81c;
}
.card-number {
  align-self: flex-start;
  flex-shrink: 0;
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  background: #ece6fb;
  color: #7155c3;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 750;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}
.card-body strong {
  font-size: 17px;
}
.card-body small {
  color: #6e697a;
  font-size: 11px;
  line-height: 1.5;
}
.card-clue {
  font-size: 12px;
  line-height: 1.5;
  color: #605b6c;
  margin-top: 3px;
}
.connection-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--purple);
  margin-top: 5px;
}
.selection-prompt {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--ink);
  color: white;
  padding: 13px 17px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 13px;
}
.selection-prompt svg {
  margin-left: auto;
}
.ingredient-card {
  background: #f7faec;
  border-color: #e6ecd3;
  min-height: 101px;
}
.ingredient-card:hover {
  border-color: #9bb347;
  background: #f0f6d9;
}
.ingredient-symbol {
  background: #e5efc4;
  color: #627936;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  flex-shrink: 0;
}
.ingredient-owner {
  font-size: 10px;
  line-height: 1.5;
  color: #73658d;
}
.game-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid var(--line);
  padding-top: 24px;
  margin-top: 26px;
}
.game-actions p {
  color: #716c7b;
  font-size: 12px;
  margin: 0;
}
.game-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 15px 21px;
  border-radius: 13px;
  font-weight: 650;
  font-size: 13px;
  border: 0;
  background: var(--purple);
  color: white;
}
.game-primary:hover:not(:disabled) {
  background: #5f43cc;
}
@media (max-width: 900px) {
  .game-emblem {
    width: 205px;
    min-height: 180px;
  }
  .game-workspace {
    padding: 25px;
  }
  .matching-board {
    gap: 18px;
  }
  .medicine-card,
  .ingredient-card {
    padding: 14px;
    gap: 9px;
  }
  .match-column h3 {
    flex-wrap: wrap;
  }
  .match-column h3 > span {
    width: 100%;
    margin: 0 0 0 26px;
  }
}
@media (max-width: 620px) {
  .game-primary {
    width: 100%;
  }
  .game-page {
    padding-top: 30px;
    padding-bottom: 40px;
  }
  .game-intro {
    margin-bottom: 27px;
  }
  .game-intro h1 {
    font-size: clamp(32px, 9vw, 42px);
    letter-spacing: -2px;
  }
  .game-emblem {
    display: none;
  }
  .game-lead {
    font-size: 14px;
  }
  .desktop-break {
    display: none;
  }
  .game-workspace {
    padding: 19px 15px;
    border-radius: 20px;
  }
  .game-section-head {
    align-items: flex-start;
    gap: 10px;
  }
  .game-section-head h2 {
    font-size: 25px;
  }
  .game-counter {
    padding: 8px 10px;
    font-size: 10px;
  }
  .game-instruction {
    font-size: 12px;
  }
  .matching-board {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .medicine-card {
    min-height: 115px;
  }
  .ingredient-card {
    min-height: 90px;
  }
  .match-column h3 > span {
    width: auto;
    margin-left: auto;
  }
  .game-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .game-actions p {
    text-align: center;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
    transition: none !important;
  }
}
.game-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin: -8px 0 25px;
  font-size: 12px;
  color: #655f6d;
}
.game-legend > span {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 650;
}
.game-legend i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.legend-green {
  background: #25824b;
}
.legend-red {
  background: #c14242;
}
.game-legend small {
  flex-basis: 100%;
  font-size: 11px;
  line-height: 1.5;
}
.instant-feedback {
  display: flex;
  gap: 13px;
  padding: 20px;
  border: 1px solid;
  border-radius: 16px;
  margin-bottom: 25px;
}
.instant-feedback > svg {
  flex-shrink: 0;
  margin-top: 1px;
}
.instant-feedback strong {
  font-size: 16px;
}
.instant-feedback p {
  font-size: 13px;
  line-height: 1.6;
  margin: 7px 0 0;
}
.instant-feedback .found-in {
  margin-top: 12px;
}
.instant-feedback a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  text-decoration: underline;
  margin-top: 12px;
}
.instant-feedback.correct,
.medicine-card.correct,
.ingredient-card.correct {
  background: #edf8ef;
  border-color: #55a36d;
  color: #205c36;
}
.instant-feedback.incorrect,
.medicine-card.incorrect,
.ingredient-card.incorrect {
  background: #fff1f0;
  border-color: #d77470;
  color: #943535;
}
.medicine-card.correct.selected {
  box-shadow: 0 0 0 3px #25824b25;
}
.medicine-card.incorrect.selected {
  box-shadow: 0 0 0 3px #c1424225;
}
.medicine-card.correct .connection-chip,
.ingredient-card.correct .ingredient-owner {
  color: #24733f;
}
.medicine-card.incorrect .connection-chip,
.ingredient-card.incorrect .ingredient-owner {
  color: #a13936;
}
.ingredient-discovery {
  font-size: 11px;
  line-height: 1.6;
  margin-top: 6px;
  color: #5b5661;
}
.ingredient-card.correct:hover {
  background: #e4f3e7;
  border-color: #25824b;
}
.ingredient-card.incorrect:hover {
  background: #ffe7e5;
  border-color: #b23c38;
}
.game-counter.complete {
  background: #e4f3e7;
  color: #24733f;
}
.game-complete {
  display: flex;
  gap: 14px;
  align-items: center;
  background: var(--lime);
  border-radius: 16px;
  padding: 22px;
  margin-top: 20px;
}
.game-complete p {
  font-size: 12px;
  line-height: 1.6;
  margin: 6px 0 0;
}
.game-complete svg {
  flex-shrink: 0;
}
@media (max-width: 620px) {
  .instant-feedback {
    padding: 15px;
    gap: 9px;
  }
  .instant-feedback p {
    font-size: 12px;
  }
  .game-counter {
    white-space: normal;
    max-width: 100px;
    text-align: center;
  }
  .selection-prompt {
    position: sticky;
    top: 8px;
    z-index: 1;
  }
}
.game-intro {
  margin-bottom: 28px;
}
.game-intro h1 {
  font-size: clamp(36px, 4.4vw, 58px);
}
.game-workspace {
  background: #fffefa;
  border: 2px solid #eee8fa;
}
.board-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 22px 0 14px;
  gap: 15px;
}
.board-toolbar > span {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  font-weight: 750;
  color: var(--purple);
}
.level-dots {
  display: flex;
  gap: 7px;
}
.level-dots i {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #e9e2f6;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #dfd5f1;
  transition: background 0.2s;
}
.level-dots i.solved {
  background: #36a362;
  box-shadow: 0 0 0 1px #36a362;
}
.selection-prompt {
  margin: 0 0 18px;
  background: #eee8ff;
  color: #5a429d;
  position: static;
}
.selection-prompt > span {
  margin-left: auto;
  font-size: 11px;
  font-weight: 450;
}
.selection-prompt svg {
  margin-left: 0;
}
.matching-board {
  position: relative;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 90px;
  padding: 20px 8px 8px;
  border-radius: 18px;
  background-image: radial-gradient(#c9bdde80 1px, transparent 1px);
  background-size: 15px 15px;
}
.match-column {
  min-width: 0;
}
.match-column h3 {
  min-height: 44px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-content: center;
}
.match-column h3 > span {
  width: 100%;
  margin: 0 0 0 26px;
}
.medicine-card,
.ingredient-card {
  position: relative;
  z-index: 2;
  height: 165px;
  min-height: 0;
  margin-bottom: 18px;
  border-width: 2px;
  box-shadow: 0 5px 0 #ded8e955;
  transition:
    transform 0.15s,
    background 0.15s,
    border-color 0.15s;
}
.medicine-card:hover,
.ingredient-card:hover {
  filter: brightness(0.985);
}
.medicine-card.selected {
  border-color: var(--purple);
  box-shadow:
    0 0 0 3px #7155e81a,
    0 5px 0 #7155e829;
}
.medicine-card::after,
.ingredient-card::before {
  content: '';
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  border: 3px solid #b4a2d9;
  transform: translateY(-50%);
}
.medicine-card::after {
  right: -8px;
}
.ingredient-card::before {
  left: -8px;
}
.medicine-card.correct::after,
.ingredient-card.correct::before {
  border-color: #289152;
  background: #e2f5e7;
}
.medicine-card.incorrect::after,
.ingredient-card.incorrect::before {
  border-color: #cd4e4e;
  background: #fff0ed;
}
.medicine-card.correct,
.ingredient-card.correct {
  box-shadow: 0 5px 0 #b6d9bf;
}
.medicine-card.incorrect,
.ingredient-card.incorrect {
  box-shadow: 0 5px 0 #efc4c0;
}
.connection-wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 1;
}
.connection-wires g {
  fill: currentColor;
}
.wire-correct {
  color: #299454;
}
.wire-incorrect {
  color: #d44949;
}
.connection-wires path {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
}
.connection-wires .wire-halo {
  stroke: #fffefa;
  stroke-width: 10px;
}
.wire-line {
  stroke-width: 4px;
  animation: wire-appear 0.3s ease-out;
}
.wire-incorrect .wire-line {
  stroke-dasharray: 7 6;
}
.connection-wires circle {
  stroke: #fffefa;
  stroke-width: 2px;
}
.instant-feedback {
  margin: 24px 0 0;
  animation: feedback-pop 0.2s ease-out;
}
.game-complete {
  animation: feedback-pop 0.3s ease-out;
}
@keyframes wire-appear {
  from {
    opacity: 0;
    stroke-width: 1px;
  }
  to {
    opacity: 1;
    stroke-width: 4px;
  }
}
@keyframes feedback-pop {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 900px) {
  .matching-board {
    gap: 64px;
  }
  .medicine-card,
  .ingredient-card {
    padding: 13px;
    height: 185px;
  }
  .ingredient-symbol {
    width: 31px;
    height: 31px;
  }
  .card-number {
    width: 24px;
    height: 24px;
  }
  .card-body strong {
    font-size: 16px;
  }
}
@media (max-width: 620px) {
  .game-intro h1 {
    font-size: 34px;
  }
  .game-workspace {
    padding: 19px 12px;
  }
  .matching-board {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 36px;
    padding: 12px 0 0;
  }
  .medicine-card,
  .ingredient-card {
    height: 201px;
    padding: 12px 9px;
    gap: 7px;
    flex-direction: column;
    align-items: flex-start;
  }
  .card-number {
    width: 22px;
    height: 22px;
    font-size: 10px;
  }
  .card-body {
    flex: 1;
    gap: 5px;
  }
  .card-body strong {
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .card-body small {
    font-size: 10px;
  }
  .card-clue {
    font-size: 10px;
    line-height: 1.45;
  }
  .connection-chip {
    font-size: 10px;
    flex-wrap: wrap;
    gap: 3px;
  }
  .medicine-card > svg,
  .ingredient-card > svg {
    display: none;
  }
  .ingredient-symbol {
    width: 26px;
    height: 26px;
    border-radius: 8px;
  }
  .ingredient-symbol svg {
    width: 17px;
  }
  .match-column h3 {
    font-size: 11px;
    gap: 4px;
    min-height: 45px;
  }
  .match-column h3 > span {
    margin: 0;
    font-size: 9px;
  }
  .match-column h3 > svg {
    display: none;
  }
  .selection-prompt {
    flex-wrap: wrap;
    gap: 5px;
    font-size: 11px;
    padding: 12px;
  }
  .selection-prompt > span {
    width: 100%;
    margin: 0;
    font-size: 10px;
  }
  .selection-prompt > svg {
    display: none;
  }
  .board-toolbar > span {
    font-size: 11px;
  }
  .level-dots {
    gap: 5px;
  }
  .level-dots i {
    width: 10px;
    height: 10px;
  }
  .wire-line {
    stroke-width: 3px;
  }
  .game-counter {
    max-width: 90px;
  }
  .game-section-head h2 {
    font-size: 23px;
  }
  .ingredient-owner {
    font-size: 10px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  .wire-line,
  .instant-feedback,
  .game-complete {
    animation: none !important;
    transition: none !important;
  }
}
</style>
