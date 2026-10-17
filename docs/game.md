# Jeu des associations

La page `/jeu` fonctionne sans API, y compris sur GitHub Pages. Chaque partie
propose cinq associations tirées du classeur via `src/data/static-demo.json`.
Les tirages excluent les doublons et les liens croisés ambigus ; rejouer renouvelle
les duos et mélange les composants. Les indices, mécanismes et produits cités
viennent du classeur. Ses références ne sont pas vérifiées.

Le plateau présente les échantillons sur une table de laboratoire et les composants
naturels dans un arbre imaginaire, centré sur une largeur maximale de 850 px.
Tous les composants ne sont pas des fruits. Les liens sont des courbes SVG
recalculées après connexion et redimensionnement. Sur mobile, le plateau peut
être parcouru horizontalement.

Une tentative correcte trace le lien et passe au prochain échantillon. Une erreur
incrémente le compteur, trace immédiatement la bonne connexion, puis ouvre la
popup éducative de la mascotte fournie (`public/billy-mascot.png`). La popup
explique le duo corrigé et indique où trouver le composant choisi. Sa couleur
orange ou rouge correspond à la gravité du duo corrigé dans le classeur, et non
à celle du mauvais lien. Les liens verts valident les associations du jeu ; ils
ne représentent pas leur sécurité médicale.

« Compris, on continue ! », la croix ou Échap ferme la popup. La correction reste
tracée et l’erreur reste dans le bilan. Si la correction termine la partie, le
dialogue de victoire attend la fermeture de la popup pour éviter la superposition
des dialogues. Il affiche médaille, étoiles, confettis et nombre d’erreurs.
Rejouer remet les liens et le compteur à zéro. Les animations respectent
`prefers-reduced-motion`. Aucun son n’est joué.

Vérifications : `node --test scripts/game.test.mjs`, TypeScript, build,
audit des chemins et parcours dans le navigateur.
