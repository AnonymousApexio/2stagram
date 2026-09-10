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

Les deux paquets `@esbuild-kit` restent dépréciés en amont, mais leur copie
d'esbuild vulnérable est remplacée. Retirer l'override lorsqu'une version stable
de Drizzle Kit supprime cette chaîne ou adopte une version corrigée, puis refaire
installation, audit et essais de migrations. L'exception d'acceptation de cet
avis n'est plus nécessaire ; l'exception documentaire ci-dessous est inchangée
et ne s'applique jamais à l'audit applicatif.

## Docusaurus : deux avis non corrigés

Contrôle du 10 septembre 2026 : 17 dépendances affectées transitivement par
deux avis de niveau haut sur `image-size`. Une image malformée peut bloquer
le processus Node qui analyse les images lors de la génération :

- [GHSA-w3rx-r6r6-pgpr — ICNS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr)
- [GHSA-5p2g-fcmc-qvqq — JXL et HEIF](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)

Docusaurus 3.10.2 et image-size 2.0.2 restent les dernières versions du registre
au contrôle. Les avis n'indiquent aucun correctif publié. L'acceptation du risque
n'est pas une correction et ne supprime pas les alertes.

Les correctifs publiés de `serialize-javascript`, `qs` et `uuid` sont épinglés
dans les overrides documentaires, avec build vérifié. Retirer ces overrides
lorsque les dépendances amont adoptent les versions corrigées.

## Acceptation temporaire — amendement 0001

Décision adoptée par le responsable technique le 10 septembre 2026, pour la
génération documentaire uniquement. Responsable du suivi : responsable technique.
Période : **du 10 septembre 2026 à 00:00 (heure de Paris) au 10 octobre 2026 à 00:00 (heure de Paris) exclu**.
La reconduction n'est pas automatique.

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

`scripts/docs-audit-policy.ts` applique cette décision : chaque alerte haute
doit remonter exclusivement aux deux avis identifiés, dans `image-size` ou sa
chaîne `@docusaurus/`. Une autre cause, une alerte critique, un correctif signalé
comme disponible ou une référence de dépendance inconnue bloque le contrôle.
Un cycle non résolu ou un rapport incomplet ne vaut jamais validation.
À l'expiration, les alertes encore présentes redeviennent bloquantes.

Cette politique est testée avec Vitest, notamment avant/après l'échéance et
avec de nouvelles alertes mélangées aux causes connues. Elle est spécifique à
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
et reste en échec tant que ces alertes subsistent.

Dependabot surveille les deux lockfiles. À la publication d'un correctif, faire
approuver la mise à jour ciblée, régénérer le lockfile documentaire, exécuter
`npm run docs:site` et les deux audits documentaires, puis vérifier navigation
et images. Supprimer l'exception lorsque l'audit strict passe. Réexaminer la
situation avant l'échéance ; toute extension exige une nouvelle décision explicite.

Pour rédiger et consulter localement : modifier `docs/`, puis lancer
`npm run docs:dev` et ouvrir `http://localhost:3001`.
