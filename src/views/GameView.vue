<script setup lang="ts">
import { computed, ref } from 'vue'
import NexusIcon from '@/components/NexusIcon.vue'
import { connectPair, gameCases, type GameId } from '@/data/game'

const selected = ref<GameId>('ciclosporine')
const pairs = ref<Partial<Record<GameId, GameId>>>({})
const order = ref([3, 0, 4, 1, 2])
const lastAttempt = ref<{ medicine: GameId; ingredient: GameId }>()
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

function link(id: GameId) {
  const medicine = selected.value
  pairs.value = connectPair(pairs.value, medicine, id)
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
          Cinq médicaments, cinq ingrédients. Reliez-les à l’aide des indices<br
            class="desktop-break"
          />
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
          <h2>Qui va avec qui ?</h2>
        </div>
        <span class="game-counter" :class="{ complete: pairCount === 5 }" aria-live="polite"
          >{{ pairCount }} / 5 liens corrects</span
        >
      </header>
      <p class="game-instruction">
        Choisissez un médicament, puis l’ingrédient qui correspond à son indice. La réponse apparaît
        immédiatement : vous pouvez réessayer autant que vous voulez.
      </p>
      <p class="game-legend">
        <span><i class="legend-green"></i> Bonne réponse</span
        ><span><i class="legend-red"></i> Lien à revoir</span
        ><small
          >Les couleurs indiquent la justesse du lien dans le jeu, pas la sécurité d’une
          association.</small
        >
      </p>

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

      <div class="matching-board">
        <div class="match-column">
          <h3>
            <NexusIcon name="pill" :size="18" /> Les médicaments <span>Principe actif indiqué</span>
          </h3>
          <button
            v-for="(item, index) in gameCases"
            :key="item.id"
            class="medicine-card"
            :class="[connectionState(item.id), { selected: selected === item.id }]"
            :aria-pressed="selected === item.id"
            @click="selected = item.id"
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
          <p class="selection-prompt" aria-live="polite">
            Relier à <strong>{{ selectedCase.medicine }}</strong
            ><NexusIcon name="arrow" :size="17" />
          </p>
          <button
            v-for="item in ingredients"
            :key="item.id"
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
              >
              <span v-if="owner(item.id)" class="ingredient-discovery">{{
                item.foundIn
              }}</span> </span
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
</style>
