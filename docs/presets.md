# Présélections et GitHub Pages

Les deux exemples sont initialisés depuis `src/data/presets.json`, un instantané
de `GET /api/scenarios` du backend du projet. Ils restent visibles même si l’API
est indisponible. Une réponse API valide actualise ensuite la liste des exemples.
L’échec de `/profile-options` ne masque plus les exemples.

Choisir une présélection (ou ouvrir `?example=contraception` / `?example=sleep`)
remplit les produits, compositions, quantités et profil, puis reste en sélection.
L’analyse ne démarre qu’avec le bouton « Analyser cette association ».

Cet instantané ne remplace pas le moteur : recherche, analyse et téléchargement
du classeur nécessitent toujours un backend. GitHub Pages ne lance pas FastAPI.
Configurer `VITE_API_BASE_URL` dans les variables du dépôt avec l’URL HTTPS du
backend et autoriser l’origine Pages dans `CORS_ORIGINS` côté serveur.

Après modification des exemples côté backend, régénérer le JSON depuis l’API
locale, vérifier les quatre produits et leurs compositions, puis compiler le site.
