<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BillyMascot from '@/components/BillyMascot.vue'
import NexusIcon from '@/components/NexusIcon.vue'
import GameCoach from '@/components/GameCoach.vue'
import { workbookUrl } from '@/services/api'
import { clearIncorrectPairs, connectPair, createGame, shuffle, type GameId } from '@/data/game'

const gameCases = ref(createGame())
const selected = ref<GameId | null>(null)
const errorCount = ref(0)
const coachDismissed = ref(false)
const pairs = ref<Partial<Record<GameId, GameId>>>({})
const order = ref(shuffle([0, 1, 2, 3, 4]))
const lastAttempt = ref<{ medicine: GameId; ingredient: GameId }>()
const board = ref<HTMLElement>()
const boardFrame = ref<HTMLElement>()
const boardScale = ref(1)
const boardWidth = ref(850)
const boardHeight = ref(0)
const boardLeft = ref(0)
function fitBoard() {
  if (!board.value || !boardFrame.value) return
  const width = boardFrame.value.clientWidth
  boardWidth.value = Math.max(850, width)
  const naturalHeight = board.value.offsetHeight
  const visibleHeight = Math.min(
    window.innerHeight,
    window.visualViewport?.height ?? window.innerHeight,
  )
  boardScale.value = Math.min(
    1,
    Math.max(1, visibleHeight - 24) / naturalHeight,
    width / boardWidth.value,
  )
  boardHeight.value = naturalHeight * boardScale.value
  boardLeft.value = Math.max(0, (width - boardWidth.value * boardScale.value) / 2)
}
async function showWholeBoard() {
  fitBoard()
  await nextTick()
  boardFrame.value?.scrollIntoView({ block: 'start', behavior: 'smooth' })
}
function resizeBoard() {
  fitBoard()
  nextTick(measureWires)
}
const victory = ref<HTMLDialogElement>()
const wires = ref<
  { id: GameId; path: string; x1: number; y1: number; x2: number; y2: number; correct: boolean }[]
>([])
let resizeObserver: ResizeObserver | undefined
const components = computed(() => order.value.map((i) => gameCases.value[i]!))
const pairCount = computed(() => gameCases.value.filter((c) => pairs.value[c.id] === c.id).length)
const selectedCase = computed(() => gameCases.value.find((c) => c.id === selected.value))
const feedback = computed(() => {
  if (!lastAttempt.value) return undefined
  return {
    correct: lastAttempt.value.medicine === lastAttempt.value.ingredient,
    medicine: gameCases.value.find((c) => c.id === lastAttempt.value!.medicine)!,
    component: gameCases.value.find((c) => c.id === lastAttempt.value!.ingredient)!,
  }
})
const coachVisible = computed(
  () => !!feedback.value && !feedback.value.correct && !coachDismissed.value,
)
const componentName = (id?: GameId) => gameCases.value.find((c) => c.id === id)?.ingredient
const owner = (id: GameId) => gameCases.value.find((c) => pairs.value[c.id] === id)
const connectionState = (medicine: GameId) =>
  !pairs.value[medicine] ? '' : pairs.value[medicine] === medicine ? 'correct' : 'incorrect'
const fruitState = (component: GameId) => {
  const medicine = owner(component)
  return medicine ? connectionState(medicine.id) : ''
}

function measureWires() {
  if (!board.value) return
  const bounds = board.value.getBoundingClientRect()
  const scale = bounds.width / board.value.offsetWidth || 1
  wires.value = gameCases.value.flatMap((item) => {
    const target = pairs.value[item.id]
    if (!target) return []
    const from = board
      .value!.querySelector<HTMLElement>(`[data-medicine="${item.id}"]`)
      ?.getBoundingClientRect()
    const to = board
      .value!.querySelector<HTMLElement>(`[data-component="${target}"]`)
      ?.getBoundingClientRect()
    if (!from || !to) return []
    const x1 = (from.left + from.width / 2 - bounds.left) / scale
    const y1 = (from.bottom - bounds.top) / scale
    const x2 = (to.left + to.width / 2 - bounds.left) / scale
    const y2 = (to.top - bounds.top) / scale
    const bend = Math.max(45, (y2 - y1) * 0.5)
    return [
      {
        id: item.id,
        x1,
        y1,
        x2,
        y2,
        correct: item.id === target,
        path: `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`,
      },
    ]
  })
}
watch(
  [pairs, order, boardScale],
  async () => {
    await nextTick()
    measureWires()
  },
  { deep: true },
)
watch([pairCount, coachVisible], async ([count, coaching]) => {
  if (count === 5 && !coaching) {
    await nextTick()
    if (pairCount.value === 5 && !coachVisible.value && !victory.value?.open)
      victory.value?.showModal()
  }
})
onMounted(() => {
  resizeObserver = new ResizeObserver(resizeBoard)
  if (board.value) resizeObserver.observe(board.value)
  if (boardFrame.value) resizeObserver.observe(boardFrame.value)
  resizeBoard()
  window.addEventListener('resize', resizeBoard)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', resizeBoard)
})
function selectSample(id: GameId) {
  pairs.value = clearIncorrectPairs(pairs.value)
  lastAttempt.value = undefined
  selected.value = id
}
function link(id: GameId) {
  const medicine = selected.value
  if (!medicine) return
  coachDismissed.value = false
  if (medicine !== id) errorCount.value += 1
  pairs.value = connectPair(clearIncorrectPairs(pairs.value), medicine, medicine)
  lastAttempt.value = { medicine, ingredient: id }
  selected.value = null
}
function restart() {
  victory.value?.close()
  errorCount.value = 0
  pairs.value = {}
  lastAttempt.value = undefined
  gameCases.value = createGame(gameCases.value)
  selected.value = null
  order.value = shuffle([0, 1, 2, 3, 4])
}
</script>

<template>
  <div class="game-page page-width">
    <header class="game-intro">
      <div>
        <p class="eyebrow">Le jeu Herbal Nexus</p>
        <h1>De la nature<br />au labo<span>.</span></h1>
        <p>
          Une nouvelle partie à chaque fois.<br />Cinq échantillons. Cinq composants naturels.<br />À
          vous de créer les bonnes connexions.
        </p>
      </div>
      <div class="mission-badge">
        <BillyMascot :size="135" /><span>Votre mission<strong>5 liens à retrouver</strong></span>
      </div>
    </header>

    <section class="game-workspace" aria-label="Jeu du laboratoire et de l’arbre">
      <div class="game-toolbar">
        <div><span class="live-dot"></span><strong>Connectez les deux mondes</strong></div>
        <div class="progress" aria-live="polite">
          <span>{{ pairCount }} / 5</span>
          <div aria-hidden="true">
            <i v-for="n in 5" :key="n" :class="{ solved: n <= pairCount }"></i>
          </div>
        </div>
      </div>
      <button class="show-board" type="button" @click="showWholeBoard">
        Voir tout le plateau <NexusIcon name="scan" :size="19" />
      </button>
      <p class="instructions">
        Sélectionnez un échantillon dans le labo, puis un fruit de l’arbre. Retrouvez les cinq liens
        violets !
      </p>
      <p class="mobile-hint">
        <NexusIcon name="arrow" :size="14" /> Tournez votre téléphone à l’horizontale pour jouer
        plus confortablement.
      </p>

      <div
        ref="boardFrame"
        class="board-scroll"
        :style="boardHeight ? { height: `${boardHeight + 2}px` } : undefined"
        tabindex="0"
        aria-label="Plateau du jeu ajusté à l’écran"
      >
        <div
          ref="board"
          class="nature-board"
          :class="{ finished: pairCount === 5 }"
          :style="{
            width: `${boardWidth}px`,
            transform: `scale(${boardScale})`,
            marginLeft: `${boardLeft}px`,
          }"
        >
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

          <section class="lab-scene" aria-label="Le laboratoire : principes actifs des médicaments">
            <div class="scene-caption">
              <span><NexusIcon name="pill" :size="16" /> Le laboratoire</span
              ><small>Les principes actifs des médicaments</small
              ><span class="lab-lights" aria-hidden="true"><i></i><i></i><i></i></span>
            </div>
            <div class="lab-wall" aria-hidden="true">
              <svg class="lab-equipment" viewBox="0 0 1000 130" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <pattern id="lab-tiles" width="44" height="38" patternUnits="userSpaceOnUse">
                    <path d="M44 0H0v38" fill="none" stroke="#ddd5ec" stroke-width="1" />
                  </pattern>
                </defs>
                <rect width="1000" height="130" rx="12" fill="url(#lab-tiles)" />
                <rect
                  x="350"
                  y="9"
                  width="210"
                  height="93"
                  rx="9"
                  fill="#e4f2f3"
                  stroke="#c8b9e1"
                  stroke-width="6"
                />
                <path d="M455 12v86m-100-40h200" stroke="#c8b9e1" stroke-width="5" />
                <path d="m368 84 44-53m58 50 42-50" stroke="white" stroke-width="9" opacity=".8" />
                <rect x="24" y="105" width="242" height="9" rx="4" fill="#aa95c7" />
                <g stroke="#9d86bd" stroke-width="3" fill="#fdfcff">
                  <path d="M49 24h26v34l20 32q5 9-5 10H35q-10-1-5-10l19-32Z" />
                  <path d="M111 34h24v58q0 12-12 12t-12-12Z" />
                  <path d="M160 45h51v49q0 10-12 10h-27q-12 0-12-10Z" />
                </g>
                <path d="m43 77-9 17h56L79 77Z" fill="#9ccfc6" />
                <path d="M115 65h16v28q0 7-8 7t-8-7Z" fill="#e9ae91" />
                <path d="M164 72h43v23q0 5-8 5h-27q-8 0-8-5Z" fill="#c3b1ef" />
                <path d="M171 58h10m-10 10h7m-7 14h10" stroke="#9d86bd" stroke-width="2" />
                <g
                  transform="translate(628 9)"
                  stroke="#9982b9"
                  stroke-width="5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m35 14 25 14-17 30-25-14Z" fill="#c3b2df" />
                  <path d="M61 37q41 26 9 58H32" fill="none" />
                  <path d="M17 72h49M39 74v29M18 105h75" fill="none" />
                  <circle cx="63" cy="63" r="8" fill="#e5d8f5" />
                </g>
                <g stroke="#a28ebc" stroke-width="3" fill="none">
                  <path d="M814 51h119v46H814Z" fill="#eee6f8" />
                  <path
                    d="M828 43v42q0 9 7 9t7-9V43m17 0v42q0 9 7 9t7-9V43m17 0v42q0 9 7 9t7-9V43"
                    fill="#fff"
                  />
                  <path d="M829 68v18q0 6 6 6t6-6V68" fill="#eab6ce" />
                  <path d="M860 64v22q0 6 6 6t6-6V64" fill="#a5d5ce" />
                  <path d="M891 72v14q0 6 6 6t6-6V72" fill="#e9d28b" />
                  <path d="M799 108h151" />
                </g>
              </svg>
            </div>
            <div class="sample-row">
              <button
                v-for="(item, index) in gameCases"
                :key="item.id"
                :data-medicine="item.id"
                class="sample-card"
                :class="[connectionState(item.id), { selected: selected === item.id }]"
                :aria-pressed="selected === item.id"
                :aria-label="`Sélectionner l’échantillon ${item.medicine}`"
                @click="selectSample(item.id)"
              >
                <span class="sample-number">ÉCH. 0{{ index + 1 }}</span>
                <svg class="sample-vial" viewBox="0 0 50 83" aria-hidden="true">
                  <rect x="13" y="4" width="24" height="10" rx="3" class="vial-cap" />
                  <path d="M16 14v51a9 9 0 0 0 18 0V14" class="vial-glass" />
                  <path d="M18 43v22a7 7 0 0 0 14 0V43Z" class="vial-liquid" />
                  <circle cx="23" cy="53" r="2" fill="white" opacity=".65" />
                  <circle cx="28" cy="63" r="1.5" fill="white" opacity=".65" />
                  <path d="M20 20v17" stroke="white" stroke-width="3" stroke-linecap="round" />
                </svg>
                <strong>{{ item.active }}</strong
                ><small :title="item.role">{{ item.medicine }}</small>
                <span class="sample-result"
                  ><NexusIcon
                    :name="
                      !pairs[item.id]
                        ? 'plus'
                        : connectionState(item.id) === 'correct'
                          ? 'check'
                          : 'close'
                    "
                    :size="14"
                  />{{
                    !pairs[item.id]
                      ? 'Choisir'
                      : connectionState(item.id) === 'correct'
                        ? componentName(pairs[item.id])
                        : 'À réessayer'
                  }}</span
                >
              </button>
            </div>
            <div class="lab-bench" aria-hidden="true">
              <span></span><span></span><span></span>
              <i class="table-leg table-leg-left"></i>
              <i class="table-leg table-leg-right"></i>
              <i class="table-brace"></i>
            </div>
          </section>

          <div class="worlds-gap" aria-hidden="true">
            <span>Reliez les découvertes</span><NexusIcon name="link" :size="22" /><i></i>
          </div>

          <section class="tree-scene" aria-label="L’arbre : composants naturels à relier">
            <svg
              class="tree-art"
              viewBox="0 0 1000 630"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <ellipse cx="500" cy="606" rx="310" ry="19" fill="#d9e6be" />
              <path d="M458 595c28-151 19-315 24-365h43c-4 80-4 296 32 365Z" fill="#a77852" />
              <path
                d="M499 379 347 225M511 335l163-147M492 292l-34-134M515 282l78-153"
                fill="none"
                stroke="#a77852"
                stroke-width="23"
                stroke-linecap="round"
              />
              <path
                d="M470 588c18-112 24-246 23-335"
                fill="none"
                stroke="#c6996b"
                stroke-width="8"
                stroke-linecap="round"
              />
              <path
                d="M89 211C20 136 104 56 205 65 217-6 357-13 415 39 482-25 609-9 646 39 764 1 854 49 853 93 969 81 1007 184 921 230c11 100-132 137-225 98-54 66-178 65-222 22-109 59-223 12-218-31-115 47-210-29-167-108Z"
                fill="#c6df9c"
              />
              <ellipse cx="299" cy="126" rx="153" ry="92" fill="#d5e9ac" />
              <ellipse cx="641" cy="118" rx="157" ry="100" fill="#cfe5a5" />
              <ellipse cx="831" cy="193" rx="100" ry="81" fill="#b9d78c" />
              <ellipse cx="448" cy="218" rx="163" ry="100" fill="#b5d58a" />
              <g fill="#709c57" opacity=".4">
                <path
                  d="M153 153q28-43 52-25-9 31-52 25ZM366 63q25-33 43-17-11 26-43 17ZM751 94q33-26 49-6-18 22-49 6ZM586 281q30-32 49-10-17 26-49 10ZM251 279q-32-34-47-10 18 25 47 10Z"
                />
              </g>
              <g fill="#f5f9d7">
                <circle cx="116" cy="198" r="4" />
                <circle cx="389" cy="98" r="4" />
                <circle cx="712" cy="230" r="5" />
                <circle cx="902" cy="157" r="3" />
              </g>
              <path
                d="M377 605q13-40 32-14m177 12q18-44 29-13M319 604q-11-26-24-14"
                fill="none"
                stroke="#81a66b"
                stroke-width="5"
                stroke-linecap="round"
              />
            </svg>
            <div class="fruit-row">
              <button
                v-for="(item, index) in components"
                :key="item.id"
                :data-component="item.id"
                class="fruit-card"
                :class="[fruitState(item.id), `fruit-${index}`]"
                :aria-label="
                  selectedCase
                    ? `Relier ${item.ingredient} à ${selectedCase.medicine}`
                    : `${item.ingredient} : choisissez d’abord un échantillon`
                "
                :disabled="!selectedCase"
                @click="link(item.id)"
              >
                <span class="fruit-leaf" aria-hidden="true"></span
                ><span class="fruit-shine" aria-hidden="true"></span>
                <NexusIcon :name="'leaf'" :size="24" /><strong>{{ item.ingredient }}</strong
                ><small>{{
                  !owner(item.id)
                    ? 'Relier'
                    : fruitState(item.id) === 'correct'
                      ? 'Bien relié !'
                      : 'Réessayez'
                }}</small
                ><NexusIcon
                  v-if="owner(item.id)"
                  :name="fruitState(item.id) === 'correct' ? 'check' : 'close'"
                  :size="16"
                />
              </button>
            </div>
            <div class="tree-sign">
              <NexusIcon name="leaf" :size="17" />
              <div>
                <strong>L’arbre des composants naturels</strong
                ><small>Plantes, extraits et compléments</small>
              </div>
            </div>
            <p class="tree-metaphor">
              Un arbre imaginaire pour explorer les composants : tous ne proviennent pas de fruits.
            </p>
          </section>
        </div>
      </div>

      <div class="feedback-slot" aria-live="polite" aria-atomic="true">
        <div
          v-if="feedback"
          class="instant-feedback"
          :class="feedback.correct ? 'correct' : 'incorrect'"
          role="status"
        >
          <NexusIcon :name="feedback.correct ? 'check' : 'close'" :size="23" />
          <div>
            <strong>{{
              feedback.correct ? 'Une connexion de plus !' : 'Nexus a tracé le bon lien pour vous !'
            }}</strong>
            <p>
              {{ feedback.medicine.medicine }} + {{ feedback.component.ingredient }} :
              {{
                feedback.correct
                  ? 'ce lien correspond à l’indice.'
                  : 'ce lien ne correspondait pas à l’indice. La bonne association a été reliée automatiquement.'
              }}
            </p>
            <p><b>Où le trouver ?</b> {{ feedback.component.foundIn }}</p>
            <p v-if="feedback.correct">{{ feedback.medicine.explanation }}</p>
            <small>{{ feedback.component.source }}</small>
            <a :href="workbookUrl('/api/source/workbook')" target="_blank" rel="noopener noreferrer"
              >Consulter le classeur <NexusIcon name="arrow" :size="13"
            /></a>
          </div>
        </div>
        <p v-else class="feedback-idle">
          <NexusIcon name="link" :size="18" /> Chaque connexion raconte une histoire. À vous de la
          découvrir.
        </p>
      </div>
      <div class="game-actions">
        <p>
          <span class="legend-purple"></span> Juste <span class="legend-red"></span> À réessayer
          <small>Les couleurs valident la réponse au jeu, pas la sécurité d’une association.</small>
        </p>
        <button class="game-primary" @click="restart">
          Recommencer <NexusIcon name="spark" :size="17" />
        </button>
      </div>
    </section>

    <GameCoach
      v-if="coachVisible && feedback"
      :key="errorCount"
      :medicine="feedback.medicine"
      :component="feedback.component"
      :attempt="errorCount"
      @dismiss="coachDismissed = true"
      @retry="coachDismissed = true"
    />

    <dialog
      ref="victory"
      class="victory-dialog"
      aria-labelledby="victory-title"
      aria-describedby="victory-description victory-summary"
    >
      <div class="confetti" aria-hidden="true">
        <i
          v-for="n in 55"
          :key="n"
          :style="{
            '--x': `${(n * 37) % 100}%`,
            '--delay': `${(n % 11) * 0.09}s`,
            '--drift': `${((n * 19) % 180) - 90}px`,
            '--hue': ['#7155e8', '#fb704b', '#dcef8f', '#edb546', '#66ba90'][n % 5],
          }"
        ></i>
      </div>
      <div class="victory-content">
        <BillyMascot :size="180" />
        <div class="victory-medal" aria-hidden="true">
          <NexusIcon name="spark" :size="58" /><span>5/5</span>
        </div>
        <p class="eyebrow">Mission accomplie</p>
        <h2 id="victory-title">Connexion parfaite<span>!</span></h2>
        <p id="victory-description">
          Du labo à l’arbre, vous avez retrouvé les cinq duos.<br /><strong
            >Les deux mondes sont connectés !</strong
          >
        </p>
        <div id="victory-summary" class="victory-summary">
          <strong>{{ errorCount }}</strong>
          <span>{{ errorCount > 1 ? 'erreurs' : 'erreur' }} avant la solution</span>
        </div>
        <div class="victory-stars" aria-hidden="true">✦ ✦ ✦ ✦ ✦</div>
        <button class="game-primary" @click="victory?.close()">
          Admirer mes connexions <NexusIcon name="arrow" :size="18" /></button
        ><button class="victory-replay" @click="restart">Rejouer une partie</button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.game-page {
  padding-top: 40px;
  padding-bottom: 65px;
}
.game-intro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 25px;
  margin-bottom: 30px;
}
.game-intro h1 {
  font-size: clamp(40px, 5vw, 65px);
  line-height: 1.02;
  letter-spacing: -2.8px;
  margin: 0 0 18px;
}
.game-intro h1 > span {
  color: var(--coral);
}
.game-intro > div > p:last-child {
  font-size: 22px;
  line-height: 1.6;
  color: #726b7e;
  margin: 0;
}
.mission-badge {
  display: flex;
  gap: 15px;
  align-items: center;
  background: var(--lime);
  padding: 25px 28px;
  border-radius: 28px;
  transform: rotate(4deg);
}
.mission-badge > span {
  font-size: 20px;
  line-height: 1.6;
}
.mission-badge strong {
  display: block;
  font-size: 19px;
}
.game-workspace {
  background: #fffefa;
  border: 1px solid #e9e3f3;
  border-radius: 25px;
  padding: 27px;
  box-shadow: 0 12px 50px #39246508;
}
.game-toolbar,
.game-toolbar > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.game-toolbar {
  justify-content: space-between;
  gap: 20px;
}
.game-toolbar strong {
  font-size: 20px;
  letter-spacing: -0.5px;
}
.live-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--purple);
  box-shadow: 0 0 0 5px #7155e811;
}
.progress > span {
  font-size: 21px;
  font-weight: 750;
  color: var(--purple);
  white-space: nowrap;
}
.progress > div {
  display: flex;
  gap: 5px;
}
.progress i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e7dff5;
}
.progress i.solved {
  background: #7155e8;
  box-shadow: 0 0 0 3px #7155e815;
}
.instructions {
  font-size: 20px;
  line-height: 1.7;
  color: #77707e;
  margin: 14px 0 19px;
}
.mobile-hint {
  display: none;
}
.show-board {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #d6c8f2;
  border-radius: 12px;
  background: #f0eaff;
  color: #6244c2;
  font-size: 17px;
  font-weight: 650;
  margin-top: 16px;
}
.board-scroll {
  position: relative;
  scroll-margin-top: 12px;
  overflow: hidden;
  border-radius: 19px;
  border: 1px solid #e7e1ec;
  scrollbar-color: #c5b4e9 #f1ecf9;
  scrollbar-width: thin;
}
.board-scroll:focus-visible {
  outline: 3px solid #b09bec;
  outline-offset: 4px;
}
.nature-board {
  transform-origin: top left;
  position: relative;
  min-width: 850px;
  background: linear-gradient(#f5f1fd 0%, #f5f1fd 38%, #f9f9ec 63%, #eff4e7 100%);
  overflow: hidden;
}
.lab-scene {
  width: min(100%, 950px);
  margin-inline: auto;
  box-sizing: border-box;
  position: relative;
  padding: 18px 24px 0;
}
.scene-caption {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  z-index: 4;
}
.scene-caption > span:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 20px;
  font-weight: 750;
  color: #65528f;
}
.scene-caption small {
  font-size: 17px;
  color: #92869e;
}
.lab-lights {
  display: flex;
  gap: 5px;
  margin-left: auto;
}
.lab-lights i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #b1a1cc;
}
.lab-lights i:last-child {
  background: #a5c979;
}
.lab-wall {
  height: 102px;
  margin: 12px 0 14px;
}
.lab-equipment {
  display: block;
  width: 100%;
  height: 100%;
}
.sample-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  position: relative;
  z-index: 4;
}
.sample-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  min-height: 158px;
  width: 100%;
  padding: 12px 10px;
  border: 2px solid #ddd2ee;
  border-radius: 15px 15px 10px 10px;
  background: #ffffffed;
  color: #574c65;
  box-shadow: 0 5px 0 #d3c6e5;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.sample-card:hover {
  background: white;
  border-color: #9a80c7;
}
.sample-card.selected {
  border-color: var(--purple);
  box-shadow:
    0 0 0 3px #7155e819,
    0 5px 0 #b7a2df;
}
.sample-card::after {
  content: '';
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
  border: 3px solid #a88dcf;
  background: white;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.sample-number {
  align-self: flex-start;
  margin-bottom: 10px;
  font-size: 15px;
  letter-spacing: 1px;
  font-weight: 750;
  color: #7d688e;
}
.sample-vial {
  position: absolute;
  right: 8px;
  top: 9px;
  width: 22px;
  height: 36px;
}
.vial-cap {
  fill: #8b74be;
}
.vial-glass {
  fill: #f0ebfc;
  stroke: #b4a1d7;
  stroke-width: 2;
}
.vial-liquid {
  fill: #a18bea;
}
.sample-card:nth-child(2) .vial-liquid {
  fill: #f6b183;
}
.sample-card:nth-child(3) .vial-liquid {
  fill: #76beb6;
}
.sample-card:nth-child(4) .vial-liquid {
  fill: #e6ca70;
}
.sample-card:nth-child(5) .vial-liquid {
  fill: #b19acc;
}
.sample-card strong {
  line-height: 1.25;
  font-size: 20px;
  overflow-wrap: anywhere;
}
.sample-card > small {
  font-size: 16px;
  line-height: 1.5;
  color: #74617f;
}
.sample-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 650;
  margin-top: auto;
  min-height: 18px;
}
.lab-bench {
  position: relative;
  z-index: 2;
  height: 44px;
  background: linear-gradient(90deg, #d4c8e4, #e6deef 50%, #d4c8e4);
  border-top: 10px solid #8e77ae;
  border-bottom: 4px solid #b7a5ca;
  margin: 4px -8px 0;
  border-radius: 5px 5px 3px 3px;
  box-shadow: 0 6px 12px #6d568d18;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.lab-bench::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -18px;
  height: 9px;
  background: #f5effb;
  border: 1px solid #c3afd9;
  border-radius: 6px 6px 0 0;
  transform: skewX(-10deg);
}
.lab-bench .table-leg {
  position: absolute;
  top: 30px;
  width: 15px;
  height: 65px;
  background: linear-gradient(90deg, #a694bb, #d8cde4);
  border-radius: 0 0 4px 4px;
  border-bottom: 6px solid #80718e;
}
.table-leg-left {
  left: 24px;
}
.table-leg-right {
  right: 24px;
}
.lab-bench .table-brace {
  position: absolute;
  left: 36px;
  right: 36px;
  top: 68px;
  height: 7px;
  border-radius: 3px;
  background: #c5b6d5;
}
.lab-bench span {
  width: 20px;
  height: 3px;
  border-radius: 5px;
  background: #a18abf;
}
.worlds-gap {
  height: 100px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  color: #af9ebf;
  font-size: 16px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  z-index: 1;
}
.worlds-gap i {
  position: absolute;
  left: 50%;
  height: 72px;
  width: 1px;
  background: #d1c6db88;
  transform: rotate(33deg);
}
.worlds-gap > span,
.worlds-gap > svg {
  position: relative;
  z-index: 1;
  background: #f7f6f4;
  padding: 5px;
}
.tree-scene {
  width: min(100%, 850px);
  margin-inline: auto;
  box-sizing: border-box;
  position: relative;
  height: 485px;
  padding: 0 24px;
}
.tree-art {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 450px;
  z-index: 0;
}
.fruit-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  padding-top: 24px;
  position: relative;
  z-index: 4;
  align-items: start;
}
.fruit-card {
  position: relative;
  width: 100%;
  min-height: 140px;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 7px 10px;
  background: #ffe7a5;
  border: 2px solid #e3be65;
  border-radius: 37% 42% 45% 43%;
  color: #765328;
  box-shadow: 0 5px 0 #8ea46145;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.fruit-card:hover {
  border-color: #a68039;
  background: #ffefbd;
}
.fruit-0 {
  margin-top: 54px;
  background: #f6caad;
  border-color: #dca27e;
}
.fruit-1 {
  margin-top: 0;
  background: #fff0b2;
}
.fruit-2 {
  margin-top: 61px;
  background: #e9d6f2;
  border-color: #c1a2d3;
  color: #715280;
}
.fruit-3 {
  margin-top: 9px;
  background: #f8cfc2;
  border-color: #dca08e;
}
.fruit-4 {
  margin-top: 56px;
  background: #e9edb0;
  border-color: #b6c777;
  color: #637132;
}
.fruit-card::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  height: 14px;
  width: 4px;
  background: #8d774d;
  border-radius: 4px;
  transform: rotate(12deg);
}
.fruit-card::after {
  content: '';
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  border: 2px solid #a59b67;
}
.fruit-leaf {
  position: absolute;
  width: 22px;
  height: 11px;
  background: #6e9d51;
  border-radius: 0 95% 0 95%;
  top: -13px;
  left: calc(50% + 3px);
  transform: rotate(-20deg);
}
.fruit-shine {
  position: absolute;
  top: 19px;
  left: 13px;
  width: 6px;
  height: 22px;
  background: #ffffff80;
  border-radius: 80%;
  transform: rotate(25deg);
}
.fruit-card strong {
  overflow-wrap: anywhere;
  line-height: 1.25;
  font-size: 21px;
  position: relative;
}
.fruit-card > small {
  font-size: 16px;
}
.fruit-card > svg {
  width: 20px;
  height: 20px;
}
.fruit-card > svg:last-child:not(:first-child) {
  position: absolute;
  bottom: 9px;
  right: 13px;
  width: 13px;
  height: 13px;
}
.tree-sign {
  position: absolute;
  bottom: 37px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: #fff9e8;
  border: 1px solid #b8aa7c;
  border-radius: 8px;
  padding: 11px 19px;
  box-shadow: 0 3px 0 #a99a6d;
  z-index: 4;
  white-space: nowrap;
  color: #736641;
}
.tree-sign strong {
  font-size: 18px;
  display: block;
}
.tree-sign small {
  font-size: 16px;
  display: block;
  margin-top: 3px;
}
.tree-metaphor {
  position: absolute;
  bottom: 5px;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 16px;
  color: #7c896c;
  margin: 0;
  padding: 0 15px;
}
.connection-wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 3;
}
.connection-wires path {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
}
.wire-correct {
  color: #7155e8;
}
.wire-incorrect {
  color: #d44949;
}
.wire-halo {
  stroke: #fcfcf1 !important;
  stroke-width: 8px;
  opacity: 0.9;
}
.wire-line {
  stroke-width: 3px;
  animation: draw-link 0.3s ease-out;
}
.wire-incorrect .wire-line {
  stroke-dasharray: 6 5;
}
.connection-wires circle {
  fill: currentColor;
  stroke: #fffefa;
  stroke-width: 2;
}
.sample-card.correct,
.fruit-card.correct {
  background: #eee7ff;
  border-color: #9171db;
  color: #6244a3;
  box-shadow: 0 5px 0 #c2afe8;
}
.sample-card.incorrect,
.fruit-card.incorrect {
  background: #ffe1d9;
  border-color: #d77470;
  color: #a34440;
  box-shadow: 0 5px 0 #e1a69a;
}
.sample-card.correct::after,
.fruit-card.correct::after {
  border-color: #7155e8;
}
.sample-card.incorrect::after,
.fruit-card.incorrect::after {
  border-color: #d44949;
}
.finished .lab-lights i {
  background: #9171db;
}
.feedback-slot {
  margin-top: 18px;
}
.feedback-idle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #f5f2fa;
  border-radius: 12px;
  font-size: 20px;
  line-height: 1.6;
  padding: 20px;
  color: #96899f;
  margin: 0;
}
.instant-feedback {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid;
  border-radius: 14px;
  padding: 19px;
  animation: pop-in 0.2s ease-out;
}
.instant-feedback > svg {
  flex-shrink: 0;
}
.instant-feedback.correct {
  background: #f1ebff;
  border-color: #c8b4ee;
  color: #6244a3;
}
.instant-feedback.incorrect {
  background: #fff1ed;
  border-color: #e2afa5;
  color: #98493c;
}
.instant-feedback strong {
  font-size: 21px;
}
.instant-feedback p {
  font-size: 20px;
  line-height: 1.7;
  margin: 7px 0;
}
.instant-feedback a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 17px;
  text-decoration: underline;
}
.game-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}
.game-actions p {
  font-size: 17px;
  color: #81778b;
  margin: 0;
  line-height: 1.7;
}
.game-actions p > span {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 5px;
}
.legend-purple {
  background: #7155e8;
}
.game-actions .legend-red {
  background: #d44949;
  margin-left: 12px;
}
.game-actions small {
  display: block;
  font-size: 16px;
}
.game-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 20px;
  border: 0;
  border-radius: 12px;
  background: var(--purple);
  color: white;
  font-size: 20px;
  font-weight: 650;
}
.game-primary:hover {
  background: #5e42cb;
}
.victory-dialog {
  position: fixed;
  width: min(560px, calc(100% - 32px));
  max-height: calc(100dvh - 32px);
  overflow: auto;
  border: 0;
  border-radius: 30px;
  padding: 0;
  background: #fffdf6;
  color: var(--ink);
  box-shadow: 0 35px 130px #20173355;
}
.victory-dialog::backdrop {
  background: #22183bcc;
  backdrop-filter: blur(8px);
}
.victory-dialog[open] {
  animation: celebration-in 0.5s cubic-bezier(0.2, 0.85, 0.3, 1.2);
}
.victory-content {
  position: relative;
  z-index: 2;
  padding: 42px 30px 30px;
  text-align: center;
}
.victory-medal {
  position: relative;
  margin: 0 auto 25px;
  width: 135px;
  height: 135px;
  border-radius: 40%;
  background: var(--lime);
  display: grid;
  place-items: center;
  box-shadow:
    0 0 0 12px #dcef8f35,
    0 0 0 24px #dcef8f12;
  animation: medal-pop 0.8s ease-out;
}
.victory-medal > svg {
  color: #7155e8;
  position: absolute;
  top: 16px;
  left: 38px;
}
.victory-medal > span {
  font-size: 27px;
  font-weight: 850;
  letter-spacing: -1px;
  margin-top: 47px;
  color: #5d46ac;
}
.victory-content .eyebrow {
  justify-content: center;
  font-size: 17px;
}
.victory-content h2 {
  font-size: 44px;
  line-height: 1.02;
  letter-spacing: -2px;
  margin-bottom: 18px;
}
.victory-content h2 > span {
  color: var(--coral);
  display: block;
}
.victory-content > p:not(.eyebrow) {
  font-size: 21px;
  color: #86798f;
  line-height: 1.9;
  margin-bottom: 18px;
}
.victory-content > p strong {
  color: #5d5071;
  font-weight: 650;
}
.victory-stars {
  color: #edba54;
  letter-spacing: 9px;
  font-size: 25px;
  margin: 12px 0 25px;
}
.victory-summary {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: var(--lavender);
  color: #68528e;
  border-radius: 12px;
  font-size: 20px;
}
.victory-summary strong {
  color: var(--purple);
  font-size: 24px;
}
.victory-content .game-primary {
  width: 100%;
  font-size: 21px;
  padding: 17px;
}
.victory-replay {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  color: #8a7d98;
  font-size: 20px;
  padding: 18px 10px 0;
}
.victory-replay:hover {
  color: var(--purple);
}
.confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: 30px;
  z-index: 1;
}
.confetti i {
  position: absolute;
  top: -20px;
  left: var(--x);
  width: 8px;
  height: 15px;
  background: var(--hue);
  border-radius: 2px;
  animation: confetti-fall 2.9s var(--delay) ease-out 2 both;
}
.confetti i:nth-child(3n) {
  border-radius: 50%;
  height: 9px;
}
.confetti i:nth-child(2n) {
  width: 5px;
}
.victory-content > p,
.victory-content h2 {
  animation: pop-in 0.5s 0.1s ease-out both;
}
@keyframes confetti-fall {
  0% {
    opacity: 0;
    transform: translate(0, -20px) rotate(0);
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--drift), 700px) rotate(600deg);
  }
}
@keyframes celebration-in {
  from {
    opacity: 0;
    transform: translateY(35px) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes medal-pop {
  0% {
    transform: scale(0.5) rotate(-25deg);
  }
  65% {
    transform: scale(1.08) rotate(8deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes draw-link {
  from {
    opacity: 0;
    stroke-width: 1;
  }
  to {
    opacity: 1;
    stroke-width: 3;
  }
}
@media (max-width: 900px) {
  .game-workspace {
    padding: 20px;
  }
  .mission-badge {
    padding: 21px;
    max-width: 220px;
  }
  .mission-badge strong {
    font-size: 21px;
  }
  .lab-scene {
    padding-left: 17px;
    padding-right: 17px;
  }
  .tree-scene {
    padding-left: 17px;
    padding-right: 17px;
  }
  .sample-row,
  .fruit-row {
    gap: 9px;
  }
  .sample-card strong {
    font-size: 18px;
  }
  .sample-card > small {
    font-size: 15px;
  }
  .scene-caption small {
    font-size: 16px;
  }
}
@media (max-width: 740px) {
  .mobile-hint {
    display: flex;
    gap: 7px;
    align-items: center;
    font-size: 17px;
    color: #9b88b1;
    margin: -8px 0 12px;
  }
  .game-toolbar strong {
    font-size: 22px;
  }
  .progress > div {
    gap: 3px;
  }
  .progress i {
    width: 7px;
    height: 7px;
  }
}
@media (max-width: 620px) {
  .game-page {
    padding-top: 30px;
    padding-bottom: 40px;
  }
  .game-intro {
    margin-bottom: 24px;
  }
  .game-intro h1 {
    font-size: 43px;
    letter-spacing: -2px;
  }
  .game-intro > div > p:last-child {
    font-size: 20px;
  }
  .mission-badge {
    display: none;
  }
  .game-workspace {
    padding: 16px 12px;
    border-radius: 20px;
  }
  .game-toolbar {
    align-items: flex-start;
    gap: 12px;
  }
  .game-toolbar strong {
    font-size: 21px;
  }
  .game-toolbar .live-dot {
    display: none;
  }
  .progress > div {
    display: none;
  }
  .instructions {
    font-size: 18px;
  }
  .game-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .game-primary {
    width: 100%;
  }
  .game-actions p {
    font-size: 17px;
  }
  .feedback-idle {
    font-size: 18px;
    text-align: center;
    padding: 16px;
  }
  .feedback-idle svg {
    flex-shrink: 0;
  }
  .instant-feedback {
    padding: 14px;
    gap: 8px;
  }
  .instant-feedback p {
    font-size: 18px;
  }
  .victory-content {
    padding: 35px 22px 22px;
  }
  .victory-content h2 {
    font-size: 37px;
  }
  .victory-medal {
    width: 115px;
    height: 115px;
  }
  .victory-medal > svg {
    left: 28px;
    top: 9px;
  }
  .victory-medal > span {
    margin-top: 43px;
    font-size: 25px;
  }
  .victory-content > p:not(.eyebrow) {
    font-size: 20px;
  }
  .victory-stars {
    font-size: 21px;
  }
}
/* Wide, short screens need a compact scene before fitting it to the viewport. */
@media (orientation: landscape) and (max-height: 600px) {
  .mobile-hint {
    display: none;
  }
  .lab-scene {
    padding-top: 8px;
  }
  .scene-caption {
    gap: 8px;
  }
  .scene-caption > span:first-child {
    font-size: 17px;
  }
  .scene-caption small {
    font-size: 14px;
  }
  .lab-wall {
    height: 36px;
    margin: 4px 0 8px;
  }
  .sample-card {
    min-height: 105px;
    padding: 8px;
    gap: 4px;
  }
  .sample-number,
  .sample-vial {
    display: none;
  }
  .sample-card strong {
    font-size: 21px;
  }
  .sample-card > small,
  .sample-result {
    font-size: 14px;
  }
  .lab-bench {
    height: 20px;
    border-top-width: 6px;
  }
  .lab-bench .table-leg {
    top: 15px;
    height: 28px;
  }
  .lab-bench .table-brace {
    top: 35px;
  }
  .worlds-gap {
    height: 42px;
    font-size: 11px;
  }
  .worlds-gap i {
    height: 24px;
  }
  .tree-scene {
    height: 280px;
  }
  .tree-art {
    height: 260px;
  }
  .fruit-row {
    padding-top: 8px;
    gap: 10px;
  }
  .fruit-card {
    min-height: 95px;
    padding: 12px 8px;
    gap: 4px;
  }
  .fruit-card strong {
    font-size: 21px;
  }
  .fruit-card > svg,
  .fruit-card > small {
    display: none;
  }
  .fruit-0,
  .fruit-4 {
    margin-top: 28px;
  }
  .fruit-1,
  .fruit-3 {
    margin-top: 0;
  }
  .fruit-2 {
    margin-top: 32px;
  }
  .tree-sign {
    bottom: 20px;
    padding: 6px 14px;
  }
  .tree-sign strong {
    font-size: 15px;
  }
  .tree-sign small {
    display: none;
  }
  .tree-metaphor {
    font-size: 11px;
    bottom: 2px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
  .confetti {
    display: none;
  }
  .victory-dialog::backdrop {
    backdrop-filter: none;
  }
}
</style>

<style scoped>
.fruit-card:disabled {
  cursor: default;
}
.fruit-card:disabled:hover {
  transform: none;
}
</style>
