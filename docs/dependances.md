# État des dépendances

Les dépendances de l'application et du site documentaire possèdent des
manifestes et des lockfiles distincts. Les versions sont épinglées ; `npm ci`
reproduit les résolutions. Aucun `audit fix --force` n'est appliqué.

## Application

Au contrôle du 10 septembre 2026, l'audit applicatif ne signale plus de
vulnérabilité après la correction ciblée d'esbuild. Les quatre alertes modérées
précédentes correspondaient à un seul avis et à sa propagation dans cette chaîne :

```text
drizzle-kit 0.31.10
  @esbuild-kit/esm-loader 2.6.5
    @esbuild-kit/core-utils 3.3.2
      esbuild 0.18.20 -> 0.25.12
```

L'avis [GHSA-67mh-4wv8-2f99](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99)
concerne le serveur de développement intégré à esbuild : son CORS permissif
permettait à une page externe de lire les fichiers servis, y compris sur
`127.0.0.1`. Écouter seulement sur l'interface locale ne corrige donc pas ce cas.
Le correctif est publié depuis esbuild 0.25.0.

Un override npm limité à `@esbuild-kit/core-utils@3.3.2` impose esbuild 0.25.12,
déjà utilisé directement par Drizzle Kit. Le lockfile et les autorisations de
scripts d'installation suivent cette résolution. Les versions de Drizzle Kit,
Drizzle ORM, Vite et tsx restent inchangées ; aucun override global d'esbuild,
retour à une ancienne version de Drizzle ou passage en préversion n'est appliqué.

Le remplacement dépasse la plage déclarée par l'ancien chargeur. Les essais
locaux de compatibilité ont donc vérifié ses transformations CommonJS/ESM,
l'await au niveau module et les source maps, puis la génération et l'application
de deux migrations SQLite dans un répertoire de test ignoré. Une troisième
génération sans changement de schéma ne crée aucune migration. Aucun schéma
métier ni migration de l'application n'est ajouté par cette correction.

Un serveur esbuild éphémère, limité à un contenu synthétique, renvoyait
`Access-Control-Allow-Origin: *` avant le remplacement. Après remplacement,
la même requête avec une origine externe ne reçoit plus cet en-tête.
Ce contrôle HTTP n'est pas un test complet de sécurité du navigateur.

Cette vulnérabilité de lecture inter-origines n'est pas corrigée par un jeton
CSRF ajouté aux routes Express : le serveur concerné est celui d'esbuild.
Les protections des futures mutations authentifiées restent un sujet distinct,
décrit par [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

Contrôle du 5 octobre 2026 : de nouveaux avis étaient apparus sur `multer`,
`brace-expansion`, `fast-uri` et `ip-address`. Les correctifs publiés sont
installés (multer 2.4.0, brace-expansion 5.0.12, fast-uri 3.1.8,
ip-address 10.7.3) et l'audit applicatif ne signale plus de vulnérabilité.
Aucune route d'upload n'existe encore, donc le comportement de multer n'est
pas exercé en conditions réelles.

Contrôle du 23 octobre 2026 : de nouveaux avis touchaient `proxy-addr`
(critique, utilisé par Express), `sharp` et sa bibliothèque libvips, `vite`,
`markdown-it` et `source-map-js` (hauts), ainsi que `vitest` et `ip-address`
(modérés). Les correctifs publiés sont installés sans changement de version
majeure : vitest et @vitest/coverage-v8 5.0.5, sharp 0.35.5, vite 8.3.5,
proxy-addr 2.0.8, markdown-it 14.3.3, source-map-js 1.2.2 et ip-address 10.7.4.
L'audit applicatif ne signale plus de vulnérabilité. `npm run check`, le
contrôle navigateur aux trois largeurs, la construction des images Docker et
le chargement de sharp dans l'image backend passent.

Les deux paquets `@esbuild-kit` restent dépréciés en amont, mais leur copie
d'esbuild vulnérable est remplacée. Retirer l'override lorsqu'une version stable
de Drizzle Kit supprime cette chaîne ou adopte une version corrigée, puis refaire
installation, audit et essais de migrations. L'exception d'acceptation de cet
avis n'est plus nécessaire ; l'exception documentaire ci-dessous est inchangée
et ne s'applique jamais à l'audit applicatif.

## Docusaurus

Contrôle du 10 septembre 2026 : 17 dépendances affectées transitivement par
deux avis de niveau haut sur `image-size`. Une image malformée pouvait bloquer
le processus Node qui analyse les images lors de la génération :

- [GHSA-w3rx-r6r6-pgpr — ICNS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr)
- [GHSA-5p2g-fcmc-qvqq — JXL et HEIF](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)

Contrôle du 5 octobre 2026 : le correctif existe depuis `image-size` 2.0.3. Le
verrou documentaire installe la 2.0.4, que Docusaurus 3.10.2 accepte (plage
`^2.0.2`). Les deux avis ne sont plus signalés. `brace-expansion` 1.1.21,
`fast-uri` 3.1.8 et `http-cache-semantics` 4.3.0 sont aussi installés. Le build
du site, la vérification de types et la comparaison avant/après n'ont montré
aucun écart.

Il restait alors 28 alertes hautes, toutes issues d'un seul avis :
[GHSA-vfj7-8cjw-p6xm — braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
affectant `braces` jusqu'à la 3.0.3, sans correctif publié. Il a été accepté
temporairement par l'[amendement 0002](./amendement-0002.md). GitHub a retiré
cet avis le 23 octobre 2026 et npm ne le signale plus : l'exception n'est plus
utilisée par l'audit. Sa suppression du contrôle, des consignes et de
l'amendement fera l'objet d'un changement distinct.

Contrôle du 23 octobre 2026 : de nouveaux avis touchaient `compression`,
`follow-redirects`, `joi`, `launch-editor`, `proxy-addr`, `shell-quote` et
`source-map-js`. Leurs correctifs publiés, compatibles avec Docusaurus 3.10.2,
sont installés. Deux avis restaient sans version compatible : `tinypool`
(critique), que `@docusaurus/core` 3.10.2 demande en version 1, et
`postcss-selector-parser` (modéré), que les préréglages cssnano 6 demandent en
version 6. Aucune version de Docusaurus ne les corrige. Les overrides
documentaires imposent donc `tinypool` 2.2.0 et `postcss-selector-parser`
7.1.7 : deux changements de version majeure, acceptés par le responsable
technique le 23 octobre 2026. Le build du site, la consultation des pages dans
un navigateur et les deux audits documentaires, strict compris, passent.

Les correctifs publiés de `serialize-javascript` (7.1.2), `qs` et `uuid` sont
épinglés dans les overrides documentaires, avec build vérifié. Retirer ces
overrides lorsque les dépendances amont adoptent les versions corrigées. Pour
`tinypool` et `postcss-selector-parser`, retirer l'override dès qu'une version
de Docusaurus adopte une version corrigée, puis refaire le build et vérifier
les pages.

## Acceptation temporaire — amendement 0002

Décision adoptée par le responsable technique le 5 octobre 2026, pour la
génération documentaire uniquement. Responsable du suivi : responsable technique.
Période : **du 5 octobre 2026 à 00:00 (heure de Paris) au 1er janvier 2027 à 00:00 (heure de Paris) exclu**.
La reconduction n'est pas automatique. Elle remplace l'acceptation des deux avis
`image-size` de l'amendement 0001, désormais corrigés. L'avis visé a été retiré
le 23 octobre 2026 : cette acceptation n'est plus appliquée par l'audit, en
attendant sa suppression.

Mesures applicables :

- Docusaurus reste hors workspaces et images applicatives, avec son lockfile.
  Le serveur de développement écoute sur l'interface locale.
- Seuls les contenus et images revus du dépôt alimentent la génération.
  Les uploads de l'application ne sont jamais transmis à Docusaurus.
- Le build documentaire est manuel, sur un runner distinct ; son étape de
  génération est limitée à 10 minutes en CI. Aucun site n'est publié automatiquement.
- L'audit s'exécute chaque jour, sur modification de ses dépendances ou de sa
  politique, et à la demande. Le rapport npm intégral est conservé en artefact
  pendant 30 jours, y compris lorsque le contrôle échoue.

`scripts/docs-audit-policy.ts` applique cette décision : une alerte haute n'est
acceptée que si chacune de ses causes, suivie dans la chaîne de dépendances,
aboutit à l'avis `braces` identifié. Une autre cause, une alerte critique, un
correctif signalé comme disponible ou une référence de dépendance inconnue
bloque le contrôle. Un cycle non résolu ou un rapport incomplet ne vaut jamais
validation. À l'expiration, les alertes encore présentes redeviennent bloquantes.

Cette politique est testée avec Vitest, notamment avant/après l'échéance et
avec de nouvelles alertes mélangées à la cause connue. Elle est spécifique à
la commande documentaire ; aucun seuil applicatif n'est assoupli.

## Commandes et suivi

Depuis la racine du dépôt :

```bash
npm run audit:dependencies
npm run audit:docs
npm run audit:docs:strict
```

`audit:docs` affiche le rapport complet, le conserve dans
`docs-site/audit-report.json` (ignoré par Git) et indique les exceptions et blocages.
La récupération du rapport est limitée à une minute ; erreur npm ou JSON invalide
font échouer le contrôle. `audit:docs:strict` applique le seuil haut sans exception
et passe depuis le 23 octobre 2026.

Dependabot surveille les deux lockfiles. À la publication d'un correctif, faire
approuver la mise à jour ciblée, régénérer le lockfile documentaire, exécuter
`npm run docs:site` et les deux audits documentaires, puis vérifier navigation
et images. Supprimer l'exception lorsque l'audit strict passe, par exemple si `braces` publie un correctif. Réexaminer la
situation avant l'échéance ; toute extension exige une nouvelle décision explicite.

Pour rédiger et consulter localement : modifier `docs/`, puis lancer
`npm run docs:dev` et ouvrir `http://localhost:3001`.
