export const gameCases = [
  {
    id: 'ciclosporine',
    medicine: 'Ciclosporine',
    role: 'Traitement immunosuppresseur',
    active: 'Ciclosporine',
    clue: 'À relier à la plante aux fleurs jaunes, parfois utilisée pour l’humeur.',
    ingredient: 'Millepertuis',
    foundIn:
      'On le trouve dans des préparations de phytothérapie à base de millepertuis, notamment des gélules et des extraits.',
    originUrl: 'https://www.nccih.nih.gov/health/st-johns-wort',
    ingredientNote: 'Extrait végétal · plusieurs substances actives',
    context:
      'Deux personnes greffées du cœur prennent ce traitement et un extrait de cette plante.',
    risk: true,
    explanation:
      'Deux rejets aigus de greffe ont été rapportés après l’association de millepertuis à la ciclosporine. La baisse d’exposition à l’immunosuppresseur peut compromettre la protection du greffon.',
    source: 'Ruschitzka et al. · The Lancet, 2000',
    url: 'https://doi.org/10.1016/S0140-6736(99)05467-7',
  },
  {
    id: 'sertraline',
    medicine: 'Sertraline',
    role: 'Traitement antidépresseur',
    active: 'Sertraline',
    clue: 'À relier au précurseur de la sérotonine, dont le nom contient « HTP ».',
    ingredient: '5-HTP',
    foundIn:
      'On le trouve dans certains compléments de 5-HTP ou de Griffonia simplicifolia : ses graines sont une source de 5-HTP.',
    originUrl: 'https://www.mskcc.org/cancer-care/integrative-medicine/herbs/5-htp-01',
    ingredientNote: '5-hydroxytryptophane · précurseur de la sérotonine',
    context:
      'Un cas publié décrit la prise de cet antidépresseur avec ce complément, parmi plusieurs produits, après un effort intense.',
    risk: true,
    explanation:
      'Un syndrome sérotoninergique avec complications musculaires a été rapporté. Les auteurs suspectent cette association ; les autres produits, l’effort et les doses incertaines limitent l’attribution à elle seule.',
    source: 'Patel & Marzella · American Journal of Case Reports, 2017',
    url: 'https://amjcaserep.com/abstract/full/idArt/904375',
  },
  {
    id: 'levothyroxine',
    medicine: 'Lévothyroxine',
    role: 'Traitement de l’hypothyroïdie',
    active: 'Lévothyroxine',
    clue: 'À relier au minéral souvent utilisé pour la santé des os.',
    ingredient: 'Calcium',
    foundIn:
      'On le trouve dans les compléments de calcium, certaines formules calcium + vitamine D et certains antiacides contenant du carbonate de calcium.',
    originUrl: 'https://ods.od.nih.gov/factsheets/Calcium-Consumer/',
    ingredientNote: 'Sous forme de carbonate de calcium dans l’étude',
    context:
      'Vingt patients prennent leur lévothyroxine en même temps que du carbonate de calcium pendant trois mois.',
    risk: true,
    explanation:
      'L’absorption de la lévothyroxine a diminué et la TSH a augmenté. Cette association peut déséquilibrer le traitement thyroïdien : une interaction peut aussi réduire l’efficacité d’un médicament.',
    source: 'Singh et al. · JAMA, 2000',
    url: 'https://pubmed.ncbi.nlm.nih.gov/10838651/',
  },
  {
    id: 'warfarine',
    medicine: 'Warfarine',
    role: 'Traitement anticoagulant',
    active: 'Warfarine',
    clue: 'À relier au rhizome épicé également utilisé contre les nausées.',
    ingredient: 'Gingembre',
    foundIn:
      'On le trouve comme aliment et dans des compléments à base de gingembre. Les préparations concentrées ne sont pas équivalentes à son usage en cuisine.',
    originUrl: 'https://www.nccih.nih.gov/health/ginger',
    ingredientNote: 'Préparation végétale étudiée · plusieurs substances actives',
    context:
      'Essai de 2005 : douze hommes en bonne santé reçoivent une dose unique de warfarine avec une préparation de cette plante.',
    risk: false,
    explanation:
      'Dans cet essai, aucun effet significatif sur l’exposition à la warfarine ou les paramètres de coagulation n’a été observé. Cela ne démontre pas l’absence de risque chez des patients anticoagulés au long cours, ni avec d’autres préparations.',
    source: 'Jiang et al. · British Journal of Clinical Pharmacology, 2005',
    url: 'https://pubmed.ncbi.nlm.nih.gov/15801937/',
  },
  {
    id: 'digoxine',
    medicine: 'Digoxine',
    role: 'Traitement cardiaque',
    active: 'Digoxine',
    clue: 'À relier à la silymarine, ensemble de substances issues du chardon-Marie.',
    ingredient: 'Silymarine',
    foundIn:
      'On la trouve dans des extraits de chardon-Marie commercialisés comme compléments alimentaires, notamment sous forme de gélules.',
    originUrl: 'https://www.nccih.nih.gov/health/milk-thistle',
    ingredientNote: 'Mélange de substances · extrait de chardon-Marie étudié',
    context:
      'Essai chez seize volontaires sains : la digoxine est évaluée avant et après quatorze jours d’un extrait de chardon-Marie.',
    risk: false,
    explanation:
      'Cette formulation n’a pas modifié significativement la pharmacocinétique de la digoxine dans cet essai. Ce résultat limité à un extrait et à des volontaires sains ne garantit pas la sécurité de toutes les associations.',
    source: 'Gurley et al. · Drug Metabolism and Disposition, 2006',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16221754/',
  },
] as const

export type GameId = (typeof gameCases)[number]['id']

/** A new selection dismisses failed attempts while keeping solved pairs. */
export function clearIncorrectPairs(pairs: Partial<Record<GameId, GameId>>) {
  return Object.fromEntries(
    Object.entries(pairs).filter(([medicine, ingredient]) => medicine === ingredient),
  ) as Partial<Record<GameId, GameId>>
}

/** An ingredient has at most one connection. Reconnecting frees the old card. */
export function connectPair(
  pairs: Partial<Record<GameId, GameId>>,
  medicine: GameId,
  ingredient: GameId,
) {
  const next = { ...pairs }
  for (const key of Object.keys(next) as GameId[]) {
    if (next[key] === ingredient) delete next[key]
  }
  next[medicine] = ingredient
  return next
}
