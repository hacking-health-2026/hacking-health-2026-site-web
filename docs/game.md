# Jeu des associations

La page `/jeu` fonctionne sans API, y compris sur GitHub Pages. On relie cinq
fiches à partir d’indices. Chaque tentative donne immédiatement un retour vert
(bon lien) ou rouge (lien incorrect), une explication et les produits où trouver
le composant naturel choisi, avec une source. Il n’y a plus de questions ni d’étape de validation.

Les données et sources sont dans `src/data/game.ts`. Les plantes ne sont pas
présentées comme des molécules isolées. Les couleurs indiquent la correspondance
avec l’indice, jamais la sécurité médicale du duo. Les anciens contextes d’études
restent conservés dans les données mais ne servent plus à poser des questions.

Le compteur mesure les liens corrects, jamais un risque médical. Une tentative
incorrecte garde la même fiche sélectionnée pour réessayer. Un bon lien passe à
la prochaine fiche à résoudre. Les connexions peuvent être réattribuées, une seule
fois par composant. Recommencer efface les liens et décale l’ordre des composants.

Le plateau montre les échantillons du laboratoire en haut et les composants
naturels comme fruits d’un arbre illustré en bas. Cette représentation est
métaphorique : tous les composants ne proviennent pas de fruits. Les courbes SVG
relient le bas des échantillons au sommet des fruits et sont mesurées après chaque
connexion et redimensionnement. Sur mobile, le plateau se parcourt horizontalement. Toute
nouvelle sélection efface les tentatives incorrectes et leur message ; les bons
liens restent en place. Les couleurs sont accompagnées d’icônes et de libellés.

Le cinquième lien correct ouvre un dialogue de victoire avec médaille, étoiles et
confettis. Il permet de revenir au plateau ou de rejouer. Échap ferme le dialogue ;
les animations sont désactivées avec `prefers-reduced-motion`. Aucun son n’est joué.
Le bilan affiche aussi le nombre de tentatives incorrectes de la partie, y compris
les erreurs effacées à la sélection suivante. Chaque mauvais lien compte une erreur ;
sélectionner un échantillon n’en ajoute pas. Rejouer remet ce compteur à zéro.

Vérifications : `node --test scripts/game.test.mjs`, vérification TypeScript,
build et audit des chemins. Les tests de connexion utilisent Node 24.
