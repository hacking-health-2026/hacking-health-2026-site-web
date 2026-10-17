# Jeu des associations

La page `/jeu` fonctionne sans API, y compris sur GitHub Pages. On relie cinq
fiches à partir d’indices. Chaque tentative donne immédiatement un retour vert
(bon lien) ou rouge (lien incorrect), une explication et les produits où trouver
l’ingrédient choisi, avec une source. Il n’y a plus de questions ni d’étape de validation.

Les données et sources sont dans `src/data/game.ts`. Les plantes ne sont pas
présentées comme des molécules isolées. Les couleurs indiquent la correspondance
avec l’indice, jamais la sécurité médicale du duo. Les anciens contextes d’études
restent conservés dans les données mais ne servent plus à poser des questions.

Le compteur mesure les liens corrects, jamais un risque médical. Une tentative
incorrecte garde la même fiche sélectionnée pour réessayer. Un bon lien passe à
la prochaine fiche à résoudre. Les connexions peuvent être réattribuées, une seule
fois par ingrédient. Recommencer efface les liens et décale l’ordre des ingrédients.

Les cartes sont reliées par des courbes SVG, mesurées après chaque connexion et
redimensionnement du plateau. Le plateau garde deux colonnes sur mobile. Toute
nouvelle sélection efface les tentatives incorrectes et leur message ; les bons
liens restent en place. Les couleurs sont accompagnées d’icônes et de libellés.

Vérifications : `node --test scripts/game.test.mjs`, vérification TypeScript,
build et audit des chemins. Les tests de connexion utilisent Node 24.
