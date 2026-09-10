# État des dépendances

Les dépendances de l'application et du site documentaire possèdent des
manifestes et des lockfiles distincts. Les versions sont épinglées ; `npm ci`
reproduit les résolutions. Aucun `audit fix --force` n'est appliqué.

## Application

Au contrôle du 9 septembre 2026, l'audit passe au seuil haut. Les quatre alertes
modérées restantes proviennent du chargeur esbuild de `drizzle-kit`, exception
acceptée pour l'outillage de migration. Le CLI de migrations n'est pas exposé comme serveur.
L'exception documentaire ci-dessous ne s'applique jamais à cet audit.

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
