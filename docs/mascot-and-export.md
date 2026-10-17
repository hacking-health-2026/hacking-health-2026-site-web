# Mascotte et export du résumé

La mascotte transparente est dans `public/billy-mascot-transparent.png`. L’original
est conservé. Le détourage a été réalisé avec l’outil intégré imagegen, avec cette
consigne : retirer uniquement le fond blanc extérieur, resserrer les marges,
conserver le dessin, les objets et les couleurs, garder le blanc opaque des yeux,
dents et perles et produire une véritable transparence alpha.

`BillyMascot.vue` la rend réutilisable dans l’en-tête, le pied de page, l’accueil,
l’utilisation, le résumé, le jeu et sa victoire. La popup l’utilise aussi.

Pour une alerte modérée ou grave, `AnalysisExport.vue` génère le QR code dans le
navigateur avec node-qrcode (MIT, https://github.com/soldair/node-qrcode). Aucun
service externe de QR n’est utilisé. Le lien porte les produits, quantités et
profil dans son fragment : il faut le traiter comme les informations affichées.
Le texte de partage le précise. Le fragment n’est pas envoyé dans la requête HTTP.

Le lien rouvre le résumé et recalcule l’analyse. Le format et l’empreinte du
classeur sont vérifiés ; une autre version du classeur entraîne un message
d’erreur. Les noms et références proviennent du catalogue, jamais d’un lien.
Depuis localhost, le QR pointe vers GitHub Pages pour être utilisable sur téléphone.
Le bilan HTML téléchargeable conserve le résultat, les quantités journalières,
les alertes de profil et les règles avec leurs lignes sources. Le contenu est
échappé et fonctionne sans serveur.

Les tests `scripts/analysis-share.test.mjs` vérifient la conservation des résultats,
la capacité des QR, le rejet des liens invalides et l’échappement du bilan.

Consigne exacte envoyée à imagegen :

> Edit target: the provided mascot illustration. Remove ONLY the exterior white background and trim the large empty outer margins. Return the exact same full mascot, leaves, capsule and tablet as a tightly framed transparent PNG cutout. Preserve the original drawing, expression, black outlines and bright colors. Preserve opaque white inside the eyes, teeth and white bead shapes. No added text, no extra objects, no redesign. Genuine alpha transparency around all separate objects and between the arms and body.
