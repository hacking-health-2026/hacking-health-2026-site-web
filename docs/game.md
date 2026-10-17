# Jeu des associations

La page `/jeu` fonctionne sans API, y compris sur GitHub Pages. On relie cinq
fiches à partir d’indices. Chaque tentative donne immédiatement un retour vert
(bon lien) ou rouge (lien incorrect), une explication et les produits où trouver
le composant naturel choisi, avec une source. Il n’y a plus de questions ni d’étape de validation.

Les parties sont générées par `src/data/game.ts` à partir de `src/data/static-demo.json`, export du classeur. Les cinq associations fixes et leurs anciennes sources externes ont été retirées. Les plantes ne sont pas
présentées comme des molécules isolées. Les couleurs indiquent la correspondance
avec l’indice, jamais la sécurité médicale du duo. Les indices, mécanismes et produits où trouver chaque composant viennent des règles du classeur. Les références du classeur restent non vérifiées.

Le compteur mesure les liens corrects, jamais un risque médical. Une tentative
incorrecte garde la même fiche sélectionnée pour réessayer. Un bon lien passe à
la prochaine fiche à résoudre. Les connexions peuvent être réattribuées, une seule
fois par composant. Recommencer efface les liens, tire cinq nouvelles associations et mélange les composants. Un tirage exclut les doublons de principes actifs et les liens croisés présents dans le dataset afin de garder une solution sans ambiguïté. Le même ensemble ne peut pas être repris immédiatement.

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

La mascotte fleur Nexus ouvre une bulle non modale à chaque mauvais lien. Elle
varie ses encouragements, indique les produits du classeur où trouver le composant
choisi et rappelle l’indice de la carte. « Montre-moi le duo » révèle la bonne
association et le mécanisme du classeur. Fermer masque la bulle ; « Je retente ! »
efface aussi le mauvais lien. Toute nouvelle sélection ferme la bulle ; les bonnes
connexions et le compteur d’erreurs sont conservés. Les animations respectent
`prefers-reduced-motion`.
