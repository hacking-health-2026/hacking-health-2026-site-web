<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import QRCode from 'qrcode'
import BillyMascot from './BillyMascot.vue'
import { encodeAnalysis } from '@/services/analysisShare'
import type { Assessment, Profile, Intake } from '@/services/api'
const props = defineProps<{ result: Assessment; profile: Profile; intakes: Intake[] }>()
const qr = ref('')
const error = ref('')
const copied = ref(false)
const downloading = ref(false)
const link = computed(() => {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  const base = local
    ? 'https://hacking-health-2026.github.io/hacking-health-2026-site-web/'
    : new URL(import.meta.env.BASE_URL, window.location.origin).href
  return `${base}utilisation/#analyse=${encodeAnalysis({ profile: props.profile, intakes: props.intakes })}`
})
watch(
  link,
  async (url, _, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })
    error.value = ''
    qr.value = ''
    copied.value = false
    try {
      const image = await QRCode.toDataURL(url, {
        width: 480,
        margin: 4,
        errorCorrectionLevel: 'M',
        color: { dark: '#251c35', light: '#ffffff' },
      })
      if (active) qr.value = image
    } catch {
      if (active)
        error.value =
          'Le QR code est trop long. Vous pouvez télécharger le bilan ou copier le lien.'
    }
  },
  { immediate: true },
)
async function download() {
  downloading.value = true
  error.value = ''
  try {
    const { analysisPdf } = await import('@/services/analysisPdf')
    const bytes = await analysisPdf(props.result, props.profile)
    const url = URL.createObjectURL(
      new Blob([new Uint8Array(bytes).buffer], { type: 'application/pdf' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'bilan-herbal-nexus.pdf'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {
    error.value = 'Le PDF n’a pas pu être généré. Réessayez le téléchargement.'
  } finally {
    downloading.value = false
  }
}
async function copy() {
  try {
    await navigator.clipboard.writeText(link.value)
    copied.value = true
  } catch {
    error.value = 'Copie indisponible. Ouvrez le résumé partagé pour copier son adresse.'
  }
}
</script>
<template>
  <section class="analysis-export" aria-labelledby="export-title">
    <div class="export-copy">
      <BillyMascot :size="110" />
      <h3 id="export-title">Gardez votre analyse à portée de main.</h3>
      <p>
        Scannez le QR code pour ouvrir ce résumé sur votre téléphone, ou téléchargez votre bilan.
      </p>
      <div class="export-actions">
        <button type="button" :disabled="downloading" @click="download">
          {{ downloading ? 'Création du PDF…' : 'Télécharger le bilan PDF' }}</button
        ><button type="button" @click="copy">
          {{ copied ? 'Lien copié !' : 'Copier le lien' }}
        </button>
      </div>
      <a :href="link" target="_blank" rel="noopener noreferrer">Ouvrir le résumé partagé ↗</a>
      <small
        >Le lien contient les produits, quantités et profil affichés. Partagez-le avec les personnes
        de votre choix. Le résumé est recalculé avec la même version du classeur.</small
      >
      <p v-if="error" role="status">{{ error }}</p>
    </div>
    <figure v-if="qr">
      <img :src="qr" alt="QR code pour rouvrir cette analyse" width="260" height="260" />
      <figcaption>Votre résumé, sur votre téléphone</figcaption>
    </figure>
  </section>
</template>
<style scoped>
.analysis-export {
  margin-top: 30px;
  padding: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 30px;
  align-items: center;
  background: #f0eafa;
  border: 1px solid #d8c8ef;
  border-radius: 24px;
}
h3 {
  font-size: 28px;
  margin: 14px 0;
}
p {
  font-size: 20px;
  line-height: 1.55;
}
small {
  display: block;
  font-size: 19px;
  line-height: 1.6;
  margin-top: 16px;
  color: #635670;
}
figure {
  margin: 0;
  text-align: center;
}
figure img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 16px;
}
figcaption {
  font-size: 20px;
  margin-top: 12px;
}
.export-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
button {
  font-size: 21px;
  font-weight: 650;
  padding: 14px 18px;
  background: #7155e8;
  color: white;
  border: 0;
  border-radius: 12px;
}
button + button {
  background: white;
  color: #7155e8;
}
a {
  display: inline-block;
  margin-top: 18px;
  font-size: 22px;
  text-decoration: underline;
}
@media (max-width: 900px) {
  .analysis-export {
    grid-template-columns: 1fr;
    padding: 20px;
  }
  figure {
    width: min(100%, 300px);
    justify-self: center;
  }
}
</style>
