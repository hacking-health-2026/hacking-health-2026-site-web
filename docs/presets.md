# Présélections et GitHub Pages

Les deux exemples sont initialisés depuis `src/data/presets.json`, un instantané
de `GET /api/scenarios` du backend du projet. Ils restent visibles même si l’API
est indisponible. Une réponse API valide actualise ensuite la liste des exemples.
L’échec de `/profile-options` ne masque plus les exemples.

Choisir une présélection (ou ouvrir `?example=contraception` / `?example=sleep`)
remplit les produits, compositions, quantités et profil, puis reste en sélection.
L’analyse ne démarre qu’avec le bouton « Analyser cette association ».

GitHub Pages ne lance pas FastAPI et rejette un POST `/api/assess` avec HTTP 405.
Quand `VITE_API_BASE_URL` est vide, le workflow active `VITE_STATIC_DEMO=true` :
recherche sur les quatre produits des exemples, calcul simulé, variations de profil
et de quantités, résumé et téléchargement du classeur fonctionnent dans le navigateur.
Les autres produits du catalogue ne sont pas disponibles dans cette version.

`src/services/staticDemo.ts` applique le même calcul de présentation Python v3,
avec les règles des six paires possibles entre ces quatre produits. Les règles
de profil sont exportées depuis le même classeur. Aucun lien absent n’est déclaré
sans danger. Les coefficients et les limites de la simulation restent ceux du
backend ; les nombres internes ne sont pas affichés comme un risque sur 100.

Le backend complet reste utilisé localement. Pour le connecter à Pages, configurer
`VITE_API_BASE_URL` avec son URL HTTPS et autoriser l’origine Pages dans
`CORS_ORIGINS` côté serveur. Une API explicitement configurée a priorité sur le
calcul de présentation ; ses erreurs ne déclenchent pas un repli silencieux.

Après modification des exemples ou du moteur côté backend, régénérer les exports
et les résultats de référence avec le Python du backend :

```powershell
C:/codex/hacking-health-2026-backend/.venv/Scripts/python.exe scripts/export-static-demo.py
node --test scripts/static-demo.test.mjs scripts/game.test.mjs
```

L’export produit `src/data/static-demo.json`, les presets, le classeur public et
23 résultats Python de référence pour les tests de parité. Ces tests couvrent les
deux exemples, leurs variations de quantités et de profil, les données manquantes,
les règles de profil, les paires non classées et l’ordre inverse des produits.
