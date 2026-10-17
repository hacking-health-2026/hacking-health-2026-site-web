<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import NexusIcon from '@/components/NexusIcon.vue'
import { connectPair, gameCases, type GameId } from '@/data/game'

const step = ref<1 | 2 | 3>(1)
const selected = ref<GameId>('ciclosporine')
const pairs = ref<Partial<Record<GameId, GameId>>>({})
const answers = ref<Partial<Record<GameId, boolean>>>({})
const heading = ref<HTMLElement>()
const order = ref([3, 0, 4, 1, 2])
const ingredients = computed(() => order.value.map((i) => gameCases[i]!))
const linked = computed(() => Object.keys(pairs.value).length)
const answered = computed(() => Object.keys(answers.value).length)
const pairCount = computed(() => gameCases.filter((c) => pairs.value[c.id] === c.id).length)
const answerCount = computed(() => gameCases.filter((c) => answers.value[c.id] === c.risk).length)
const selectedCase = computed(() => gameCases.find((c) => c.id === selected.value)!)
const ingredientName = (id?: GameId) => gameCases.find((c) => c.id === id)?.ingredient
const owner = (id: GameId) => gameCases.find((c) => pairs.value[c.id] === id)

function link(id: GameId) {
  pairs.value = connectPair(pairs.value, selected.value, id)
  const remaining = gameCases.find((c) => !pairs.value[c.id])
  if (remaining) selected.value = remaining.id
}
async function go(value: 1 | 2 | 3) {
  step.value = value
  await nextTick()
  heading.value?.focus({ preventScroll: true })
  heading.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function restart() {
  pairs.value = {}
  answers.value = {}
  selected.value = 'ciclosporine'
  order.value = [...order.value.slice(1), order.value[0]!]
  void go(1)
}
</script>

<template>
  <div class="game-page page-width">
    <header class="game-intro">
      <div>
        <p class="eyebrow">À vous de relier</p>
        <h1>Un duo.<br />Des conséquences ?<span class="game-dot">*</span></h1>
        <p class="game-lead">
          Cinq médicaments, cinq ingrédients. Faites les liens,<br class="desktop-break" />
          puis mettez vos intuitions à l’épreuve.
        </p>
      </div>
      <div class="game-emblem" aria-hidden="true">
        <NexusIcon name="pill" :size="45" /><span>+</span><NexusIcon name="leaf" :size="45" /><small
          >Le bon réflexe ?<br /><strong>Vérifier l’association.</strong></small
        >
      </div>
    </header>

    <ol class="game-steps" aria-label="Progression du jeu">
      <li
        v-for="(label, index) in ['Reliez', 'Décidez', 'Découvrez']"
        :key="label"
        :class="{ active: step === index + 1, done: step > index + 1 }"
        :aria-current="step === index + 1 ? 'step' : undefined"
      >
        <span>{{ index + 1 }}</span
        >{{ label }}<NexusIcon v-if="step > index + 1" name="check" :size="17" />
      </li>
    </ol>

    <section class="game-workspace">
      <header class="game-section-head">
        <div>
          <p class="eyebrow">Manche {{ step === 3 ? 'terminée' : `${step} / 2` }}</p>
          <h2 ref="heading" tabindex="-1">
            {{
              step === 1
                ? 'Qui va avec qui ?'
                : step === 2
                  ? 'Une interaction à risque est-elle rapportée dans ce cas ?'
                  : 'Les liens deviennent plus clairs.'
            }}
          </h2>
        </div>
        <span v-if="step < 3" class="game-counter"
          >{{ step === 1 ? linked : answered }} / 5 {{ step === 1 ? 'liens' : 'réponses' }}</span
        >
      </header>

      <template v-if="step === 1">
        <p class="game-instruction">
          Choisissez un médicament, puis l’ingrédient qui correspond à son indice. Vous pouvez
          modifier chaque lien.
        </p>
        <div class="matching-board">
          <div class="match-column">
            <h3>
              <NexusIcon name="pill" :size="18" /> Les médicaments
              <span>Principe actif indiqué</span>
            </h3>
            <button
              v-for="(item, index) in gameCases"
              :key="item.id"
              class="medicine-card"
              :class="{ selected: selected === item.id, connected: pairs[item.id] }"
              :aria-pressed="selected === item.id"
              @click="selected = item.id"
            >
              <span class="card-number">0{{ index + 1 }}</span
              ><span class="card-body"
                ><strong>{{ item.medicine }}</strong
                ><small>{{ item.role }} · Actif : {{ item.active }}</small
                ><span class="card-clue">{{ item.clue }}</span
                ><span v-if="pairs[item.id]" class="connection-chip"
                  ><NexusIcon name="link" :size="14" />{{ ingredientName(pairs[item.id]) }}</span
                ></span
              ><NexusIcon :name="pairs[item.id] ? 'check' : 'plus'" :size="20" />
            </button>
          </div>
          <div class="match-column ingredients-column">
            <h3>
              <NexusIcon name="leaf" :size="18" /> Les ingrédients
              <span>À associer une seule fois</span>
            </h3>
            <p class="selection-prompt" aria-live="polite">
              Relier à <strong>{{ selectedCase.medicine }}</strong>
              <NexusIcon name="arrow" :size="17" />
            </p>
            <button
              v-for="item in ingredients"
              :key="item.id"
              class="ingredient-card"
              :class="{ used: owner(item.id) }"
              :aria-label="`Relier ${item.ingredient} à ${selectedCase.medicine}`"
              @click="link(item.id)"
            >
              <span class="ingredient-symbol"
                ><NexusIcon
                  :name="item.id === 'levothyroxine' ? 'spark' : 'leaf'"
                  :size="23" /></span
              ><span class="card-body"
                ><strong>{{ item.ingredient }}</strong
                ><small>{{ item.ingredientNote }}</small
                ><span v-if="owner(item.id)" class="ingredient-owner"
                  >Lié à {{ owner(item.id)?.medicine }} · cliquer pour réattribuer</span
                ></span
              ><NexusIcon :name="owner(item.id) ? 'check' : 'plus'" :size="18" />
            </button>
          </div>
        </div>
        <div class="game-actions">
          <p aria-live="polite">
            {{
              linked === 5
                ? 'Les cinq liens sont prêts. À vous de décider !'
                : 'Chaque médicament attend son ingrédient.'
            }}
          </p>
          <button class="game-primary" :disabled="linked !== 5" @click="go(2)">
            Passer aux questions <NexusIcon name="arrow" :size="18" />
          </button>
        </div>
      </template>

      <template v-else-if="step === 2">
        <p class="game-instruction">
          Vos liens sont enregistrés. Voici maintenant les cinq associations étudiées : pour
          chacune, répondez à partir du contexte présenté.
        </p>
        <p class="game-note">
          <NexusIcon name="info" :size="18" /> « Non » signifie qu’aucune interaction à risque n’a
          été mise en évidence dans l’étude citée. Cela ne garantit pas l’absence de danger.
        </p>
        <div class="question-list">
          <fieldset v-for="(item, index) in gameCases" :key="item.id" class="question-card">
            <legend>
              <span>0{{ index + 1 }}</span> {{ item.medicine }} <b>+</b> {{ item.ingredient }}
            </legend>
            <p>{{ item.context }}</p>
            <div class="answer-options">
              <label :class="{ chosen: answers[item.id] === true }"
                ><input
                  v-model="answers[item.id]"
                  type="radio"
                  :name="item.id"
                  :value="true"
                />Oui</label
              ><label :class="{ chosen: answers[item.id] === false }"
                ><input
                  v-model="answers[item.id]"
                  type="radio"
                  :name="item.id"
                  :value="false"
                />Non, dans cette étude</label
              >
            </div>
          </fieldset>
        </div>
        <div class="game-actions">
          <button class="game-secondary" @click="go(1)">Modifier mes liens</button
          ><button class="game-primary" :disabled="answered !== 5" @click="go(3)">
            Découvrir les réponses <NexusIcon name="arrow" :size="18" />
          </button>
        </div>
      </template>

      <template v-else>
        <div class="game-results" aria-live="polite">
          <div>
            <strong>{{ pairCount }} / 5</strong><span>associations retrouvées</span>
          </div>
          <div>
            <strong>{{ answerCount }} / 5</strong><span>réponses correctes</span>
          </div>
          <p>
            Un ingrédient peut modifier l’effet d’un médicament. Le contexte et la qualité des
            preuves comptent autant que le lien.
          </p>
        </div>
        <div class="correction-list">
          <article v-for="(item, index) in gameCases" :key="item.id" class="correction-card">
            <div class="correction-title">
              <span class="card-number">0{{ index + 1 }}</span>
              <h3>{{ item.medicine }} <span>+</span> {{ item.ingredient }}</h3>
              <span class="evidence-tag" :class="{ reported: item.risk }">{{
                item.risk ? 'Oui · risque rapporté' : 'Non · effet non observé dans l’étude'
              }}</span>
            </div>
            <div class="response-recap">
              <span :class="{ incorrect: pairs[item.id] !== item.id }">{{
                pairs[item.id] === item.id
                  ? '✓ Bon lien'
                  : `Lien choisi : ${ingredientName(pairs[item.id])} · à corriger`
              }}</span
              ><span :class="{ incorrect: answers[item.id] !== item.risk }">{{
                answers[item.id] === item.risk ? '✓ Bonne réponse' : 'Réponse à corriger'
              }}</span>
            </div>
            <p>{{ item.explanation }}</p>
            <a :href="item.url" target="_blank" rel="noopener noreferrer"
              >{{ item.source }} <NexusIcon name="arrow" :size="14"
            /></a>
          </article>
        </div>
        <p class="game-note">
          <NexusIcon name="info" :size="18" /> Une étude sans effet observé ne prouve pas qu’une
          association est sans danger. Ce jeu pédagogique ne décide pas d’un traitement.
        </p>
        <div class="game-actions">
          <RouterLink class="game-secondary" to="/utilisation"
            >Utiliser Herbal Nexus <NexusIcon name="arrow" :size="17" /></RouterLink
          ><button class="game-primary" @click="restart">
            Rejouer <NexusIcon name="spark" :size="18" />
          </button>
        </div>
      </template>
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
.game-steps {
  list-style: none;
  display: flex;
  padding: 0;
  margin: 0 0 28px;
  gap: 10px;
}
.game-steps li {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 13px 23px;
  border: 1px solid var(--line);
  border-radius: 40px;
  color: #777382;
  font-weight: 650;
  font-size: 14px;
}
.game-steps li > span {
  font-size: 12px;
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  background: #eeece7;
  border-radius: 50%;
}
.game-steps .active {
  background: var(--purple);
  border-color: var(--purple);
  color: white;
}
.game-steps .active > span {
  background: #ffffff25;
}
.game-steps .done {
  background: var(--lavender);
  color: var(--purple);
  border-color: var(--lavender);
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
.ingredient-card.used {
  background: #f1f0f5;
  border-color: #e4e1eb;
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
.game-primary,
.game-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 15px 21px;
  border-radius: 13px;
  font-weight: 650;
  font-size: 13px;
  border: 0;
}
.game-primary {
  background: var(--purple);
  color: white;
}
.game-primary:hover:not(:disabled) {
  background: #5f43cc;
}
.game-secondary {
  background: #f1eef8;
  color: #5d498b;
}
.game-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  line-height: 1.6;
  background: #f5f2fc;
  border-radius: 13px;
  padding: 16px;
  color: #675b7b;
}
.game-note svg {
  flex-shrink: 0;
  margin-top: 1px;
}
.question-list {
  display: grid;
  gap: 20px;
  margin-top: 25px;
}
.question-card {
  border: 1px solid var(--line);
  border-radius: 17px;
  padding: 18px 22px 22px;
  margin: 0;
  min-width: 0;
}
.question-card legend {
  font-weight: 700;
  font-size: 17px;
  padding: 0 9px;
  line-height: 1.6;
}
.question-card legend > span {
  color: var(--purple);
  font-size: 12px;
  margin-right: 9px;
}
.question-card legend > b {
  color: var(--coral);
  padding: 0 7px;
}
.question-card p {
  font-size: 13px;
  color: #6c6675;
  line-height: 1.7;
  max-width: 780px;
}
.answer-options {
  display: flex;
  gap: 12px;
}
.answer-options label {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #e5e0ed;
  border-radius: 10px;
  padding: 12px 18px;
  font-size: 13px;
  cursor: pointer;
}
.answer-options label.chosen {
  border-color: var(--purple);
  background: var(--lavender);
  color: #5639b4;
}
.answer-options input {
  accent-color: var(--purple);
}
.game-results {
  background: var(--lime);
  border-radius: 18px;
  padding: 28px;
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 28px;
  align-items: center;
  margin: 12px 0 26px;
}
.game-results strong {
  font-size: 42px;
  letter-spacing: -2px;
  display: block;
}
.game-results span {
  font-size: 12px;
}
.game-results p {
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}
.correction-list {
  display: grid;
  gap: 16px;
}
.correction-card {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 23px;
}
.correction-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.correction-title h3 {
  font-size: 18px;
  flex: 1;
  margin: 0;
}
.correction-title h3 > span {
  color: var(--coral);
  padding: 0 5px;
}
.evidence-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 8px 11px;
  border-radius: 30px;
  background: #eeebf8;
  color: #685287;
}
.evidence-tag.reported {
  background: #fff0e9;
  color: #a34428;
}
.response-recap {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin: 17px 0 12px;
  font-size: 11px;
  color: #5c6c32;
}
.response-recap .incorrect {
  color: #a64b27;
}
.correction-card p {
  font-size: 13px;
  line-height: 1.8;
  color: #66606e;
  margin-bottom: 12px;
}
.correction-card a {
  color: var(--purple);
  font-size: 11px;
  line-height: 1.6;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.correction-card a:hover {
  text-decoration: underline;
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
  .game-results {
    grid-template-columns: 1fr 1fr;
  }
  .game-results p {
    grid-column: 1/-1;
  }
}
@media (max-width: 620px) {
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
  .game-steps {
    gap: 6px;
  }
  .game-steps li {
    flex: 1;
    justify-content: center;
    padding: 10px 5px;
    gap: 5px;
    font-size: 11px;
  }
  .game-steps li > span {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
  .game-steps li > svg {
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
  .game-primary,
  .game-secondary {
    width: 100%;
  }
  .question-card {
    padding: 14px;
  }
  .question-card legend {
    font-size: 14px;
  }
  .answer-options {
    gap: 8px;
  }
  .answer-options label {
    padding: 11px 12px;
    font-size: 12px;
  }
  .game-results {
    padding: 22px;
    gap: 20px;
  }
  .game-results strong {
    font-size: 36px;
  }
  .correction-card {
    padding: 17px;
  }
  .correction-title h3 {
    font-size: 16px;
  }
  .evidence-tag {
    margin-left: 40px;
  }
  .game-note {
    font-size: 11px;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
    transition: none !important;
  }
}
</style>
