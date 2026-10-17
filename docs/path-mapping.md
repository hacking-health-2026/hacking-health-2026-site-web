# Chemins et correspondances du projet

La racine du dépôt contient l’application Vue. L’ancien dossier local
`hacking-health-2026-web/` ne contient plus de source suivie par Git ; ses éventuels
`node_modules/` et `dist/` sont des résidus locaux ignorés et ne sont pas publiés.

## Sources et fichiers générés

| Référence | Cible effective |
| --- | --- |
| `index.html` → `/src/main.ts` | `src/main.ts`, entrée compilée par Vite |
| `src/main.ts` → `./App.vue` | `src/App.vue` |
| `src/main.ts` → `./router` | `src/router/index.ts` |
| `src/main.ts` → `./assets/main.css` | `src/assets/main.css`, intégrée au CSS généré |
| `@/…` | `src/…`, même alias dans Vite et TypeScript |
| `src/views/*.vue`, `src/components/*.vue`, `src/services/*.ts`, `src/stores/*.ts` | Modules compilés dans `dist/assets/`, pas des fichiers à exposer séparément |
| `%BASE_URL%favicon.ico` | `public/favicon.ico` → `dist/favicon.ico` |
| JS/CSS référencés par le HTML compilé | Fichiers nommés par empreinte dans `dist/assets/` |
| Configuration TypeScript | `tsconfig.app.json` couvre `src/` et `env.d.ts` ; `tsconfig.node.json` couvre les configurations Node |
| Métadonnées de compilation TypeScript | `node_modules/.tmp/`, ignoré par Git |
| `npm run build` | Vérification TypeScript, compilation, puis génération des entrées statiques |
| Déploiement GitHub Pages | Artefact `dist/` à la racine du dépôt |

## Pages et ancres

`<base>` n’est pas ajouté au HTML : le préfixe est appliqué par Vite aux ressources
et par `createWebHistory(import.meta.env.BASE_URL)` au routeur.

| URL logique | Vue / comportement | Fichier produit pour l’hébergement statique |
| --- | --- | --- |
| `/` | `src/views/HomeView.vue` | `dist/index.html` |
| `/jeu/` | `src/views/GameView.vue`, jeu autonome sans API | `dist/jeu/index.html` |
| `/statistiques/` | `src/views/StatisticsView.vue`, couverture et limites du catalogue | `dist/statistiques/index.html` |
| `/utilisation/` | `src/views/CompatibilityView.vue`, étapes sélection / analyse / résumé | `dist/utilisation/index.html` |
| `/utilisation/?example=sleep` | Même vue, exemple sélectionné | Même fichier ; la query est lue côté Vue |
| `/compatibility/` | Redirection Vue vers `/utilisation`, query conservée | `dist/compatibility/index.html` |
| `/team/` | Redirection Vue vers l’accueil | `dist/team/index.html` |
| URL inconnue sur Pages | Repli de l’hébergeur ; ne crée pas une nouvelle route Vue | `dist/404.html` |
| `#main-content` | `src/App.vue` → `<main id="main-content">` | DOM rendu |
| `#cas-documentes` | Section des cas dans `HomeView.vue` | DOM rendu |
| `#cas-curcuma` | Identifiant généré par la liste des cas dans `HomeView.vue` | DOM rendu |

`scripts/prepare-static-routes.mjs` produit les entrées de pages à partir des routes
déclarées. Leurs ressources utilisent le préfixe absolu du build : elles ne sont
pas cherchées dans un sous-dossier `compatibility/assets/`.

## Racine locale et sous-chemin public

- **Backend local** : `VITE_BASE_PATH=/`, ressources `/assets/…` et `/favicon.ico`.
- **Pages** : `actions/configure-pages@v5` fournit `base_path`. Le workflow le passe
  à `VITE_BASE_PATH`, avec un `/` final. Cela couvre un site de projet sous
  `/hacking-health-2026-site-web/` ainsi qu’un site publié à la racine d’un domaine.
- Le HTML d’entrée utilise `%BASE_URL%favicon.ico` ; les liens de navigation
  passent par `RouterLink`. Les liens de sources externes conservent leurs URL.

Source de configuration : [sorties officielles de configure-pages](https://github.com/actions/configure-pages/blob/v5/action.yml).

## API et fichiers du backend

| Référence | Cible effective |
| --- | --- |
| Frontend : `VITE_API_BASE_URL` vide | `/api/…` sur la même origine ; proxy Vite vers `127.0.0.1:8000` en développement |
| Frontend : `VITE_API_BASE_URL=https://api.example.org` | `https://api.example.org/api/…` ; la variable désigne l’origine/prefixe avant `/api`, sans ajouter `/api` soi-même |
| `fetchScenarios()` | `GET /api/scenarios` dans `app/demo.py` |
| `fetchProfileOptions()` | `GET /api/profile-options` |
| `searchDrugs()` | `GET /api/drugs?q=…` |
| `assessDrugs()` | `POST /api/assess` |
| `workbookUrl('/api/source/workbook')` | Même base API + fichier source XLSX servi par le backend |
| Pages sans API (`VITE_STATIC_DEMO=true`) | Recherche et calcul navigateur sur les 100 produits du classeur ; voir `docs/presets.md` |
| Pages : téléchargement du classeur | `public/demo-source.xlsx` → `dist/demo-source.xlsx`, préfixé avec `BASE_URL` |
| Backend `DATA` | `data/herbal_nexus/dataset.json`, résolu depuis le dépôt backend |
| Backend `WORKBOOK` | `data/herbal_nexus/Herbal_Nexus_Donnees_Agent1.xlsx` |
| Backend `FRONTEND_DIST` par défaut | Dépôt frère `hacking-health-2026-site-web/dist/` |
| Backend `FRONTEND_DIST` explicite | Dossier alternatif choisi par l’exploitant |
| Backend `/assets/…`, `/favicon.ico` | Fichiers exacts dans `FRONTEND_DIST`, avec leur type MIME |
| Backend `/utilisation`, `/compatibility`, `/team`, `/jeu`, `/statistiques` | Entrée SPA, puis résolution/redirection Vue |
| Fichier absent, route API inconnue, chemin sortant de `dist/` | HTTP 404 ; aucun renvoi trompeur vers le HTML |

Les autres données du backend et l’ancien moteur DDInter ne sont pas exposés comme
fichiers publics. Le chemin de build de l’ancien moteur a également été aligné sur
la structure actuelle, sans activer ce moteur.

**GitHub Pages ne lance pas FastAPI.** La variable de dépôt GitHub
`VITE_API_BASE_URL` doit désigner un backend HTTPS déjà déployé ; son `CORS_ORIGINS`
doit autoriser l’origine du site (sans le chemin du dépôt). Le lien
`github.com/…/deployments/github-pages` est une page de suivi du déploiement du
frontend, pas l’adresse de l’API. En l’absence de variable, le workflow active le
calcul de présentation dans le navigateur sur le catalogue du classeur.

## Refaire le contrôle

```sh
npm run build
npm run check:paths
```

Le contrôle vérifie la présence et la casse Git des imports locaux, les modules
externes, les liens Vue, les ancres, les ressources du HTML/CSS compilés, la copie
du dossier public et les entrées statiques des pages. `PATH_AUDIT_VERBOSE=1` affiche
chaque import et sa destination. Pour auditer un autre build :

```sh
node scripts/check-paths.mjs <dossier-du-build> /prefixe/
```

Le contrôle est exécuté dans la CI avec le même préfixe que le build publié.
Les tests `tests/test_static_paths.py` du backend vérifient les correspondances
octet par octet, les types MIME, les paramètres d’URL, les 404 et l’override de
`FRONTEND_DIST`.
