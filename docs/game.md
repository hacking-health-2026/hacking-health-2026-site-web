# Jeu des associations

La page `/jeu` fonctionne sans API, y compris sur GitHub Pages. Deux manches :
relier cinq fiches à partir d’indices, puis répondre sur les cinq associations
documentées. Les liens initiaux restent enregistrés pour la correction ; ils ne
sont jamais interprétés comme de nouvelles associations médicales validées.

Les données et sources sont dans `src/data/game.ts`. Les plantes ne sont pas
présentées comme des molécules isolées. Les trois réponses « oui » portent sur
ciclosporine–millepertuis, sertraline–5-HTP et lévothyroxine–calcium. Les deux
réponses « non » concernent uniquement les effets non observés dans les essais
warfarine–gingembre et digoxine–extrait de chardon-Marie : elles ne signifient
pas « sans danger ». Le contexte est visible avant de répondre, les limites
et la publication primaire figurent dans chaque correction.

Les compteurs mesurent les réponses du joueur, jamais un risque médical. Les
connexions peuvent être réattribuées, une seule fois par ingrédient. Rejouer
efface liens et réponses et décale l’ordre des ingrédients.

Vérifications : `node --test scripts/game.test.mjs`, vérification TypeScript,
build et audit des chemins. Les tests de connexion utilisent Node 24.
