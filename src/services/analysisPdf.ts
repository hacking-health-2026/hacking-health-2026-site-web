import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Assessment, Profile } from './api'

export async function analysisPdf(result: Assessment, profile: Profile): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle('Bilan Herbal Nexus')
  pdf.setAuthor('Herbal Nexus')
  pdf.setSubject(`Évaluation simulée · ${result.status} · ${result.algorithm.version}`)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.16, 0.13, 0.21),
    purple = rgb(0.38, 0.27, 0.7),
    muted = rgb(0.4, 0.37, 0.44)
  const labels = {
    critical: 'Danger',
    watch: 'Risque modéré',
    low: 'Risque faible',
    unknown: 'Informations insuffisantes',
  }
  const text = (value: unknown) =>
    String(value)
      .normalize('NFC')
      .replace(/[→⇒]/g, ' -> ')
      .replace(/[‑–−]/g, '-')
      .replace(/[\u00a0\u202f]/g, ' ')
      .replace(/≥/g, '>=')
      .replace(/≤/g, '<=')
      .replace(/α/g, 'alpha')
      .replace(/β/g, 'beta')
      .replace(/\s+/g, ' ')
      .trim()
  let page = pdf.addPage([595.28, 841.89])
  let y = 790
  const newPage = () => {
    page = pdf.addPage([595.28, 841.89])
    y = 790
  }
  function lines(value: unknown, size = 11, heading = false, color = ink) {
    const font = heading ? bold : regular
    const words = text(value).split(' ')
    const wrapped: string[] = []
    let line = ''
    for (const word of words) {
      if (font.widthOfTextAtSize(word, size) > 507) {
        if (line) {
          wrapped.push(line)
          line = ''
        }
        let part = ''
        for (const character of word) {
          if (font.widthOfTextAtSize(part + character, size) > 507) {
            wrapped.push(part)
            part = ''
          }
          part += character
        }
        line = part
      } else if (line && font.widthOfTextAtSize(line + ' ' + word, size) > 507) {
        wrapped.push(line)
        line = word
      } else line += (line ? ' ' : '') + word
    }
    if (line) wrapped.push(line)
    for (const row of wrapped) {
      if (y < 65) newPage()
      page.drawText(row, { x: 44, y, font, size, color })
      y -= size * 1.45
    }
    y -= 6
  }
  function section(title: string, reserve = 90) {
    if (y < reserve + 65) newPage()
    y -= 8
    lines(title, 15, true, purple)
  }
  lines('HERBAL NEXUS', 12, true, purple)
  lines('Votre bilan d’association', 25, true)
  lines(
    labels[result.status],
    20,
    true,
    result.status === 'critical'
      ? rgb(0.72, 0.15, 0.18)
      : result.status === 'watch'
        ? rgb(0.65, 0.34, 0.08)
        : purple,
  )
  lines(
    'Prototype de présentation - évaluation simulée, non validée pour un usage médical.',
    10,
    false,
    muted,
  )
  section('Votre profil')
  lines(
    `Âge : ${profile.age == null ? 'non renseigné' : profile.age + ' ans'} | Poids : ${profile.weight_kg == null ? 'non renseigné' : profile.weight_kg + ' kg'}`,
  )
  lines(`État renseigné : ${profile.conditions.join(', ') || 'aucun'}`)
  section('Vos produits et quantités')
  for (const drug of result.drugs) {
    if (y < 140) newPage()
    lines(drug.name, 13, true)
    for (const c of drug.components)
      lines(
        `${c.name} : ${c.daily_mg == null ? 'quantité journalière inconnue' : c.daily_mg + ' mg/j'}`,
      )
    y -= 4
  }
  section('Les associations')
  for (const pair of result.pairs) {
    if (y < 150) newPage()
    lines(`${pair.drug_a.name} + ${pair.drug_b.name}`, 12, true)
    lines(labels[pair.status], 11, true)
    if (!pair.rules.length) lines('Aucune règle applicable dans les données disponibles.')
    for (const rule of pair.rules) {
      lines(`${rule.mechanism}. ${rule.consequence}`)
      lines(
        `${rule.id} | ${rule.reference.sheet}, ligne ${rule.reference.row} | ${rule.source_label} (référence du classeur non vérifiée)`,
        9,
        false,
        muted,
      )
    }
  }
  if (result.profile_alerts.length) {
    section('Alertes liées au profil')
    for (const alert of result.profile_alerts)
      lines(`${alert.condition} - ${alert.ingredient} : ${alert.risk}`)
  }
  section('Limites et provenance', 150)
  lines(
    'Une interaction non détectée ne signifie pas une absence de danger. Ce prototype ne remplace pas l’avis d’un professionnel de santé.',
    10,
    false,
    muted,
  )
  lines(`Source : ${result.source.name}`, 10, false, muted)
  lines(`Empreinte : ${result.source.sha256}`, 9, false, muted)
  lines(
    `Moteur : ${result.algorithm.version} | ${result.coverage.classified_pairs}/${result.coverage.total_pairs} associations couvertes.`,
    10,
    false,
    muted,
  )
  const pages = pdf.getPages()
  pages.forEach((p, i) =>
    p.drawText(`Herbal Nexus | Bilan de présentation | ${i + 1} / ${pages.length}`, {
      x: 44,
      y: 30,
      font: regular,
      size: 9,
      color: muted,
    }),
  )
  return pdf.save()
}
