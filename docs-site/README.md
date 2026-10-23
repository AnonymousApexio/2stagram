# Site de documentation

Docusaurus est configuré hors des workspaces, avec son propre `package-lock.json`.
Depuis la racine du projet :

```bash
npm ci --prefix docs-site
npm run docs:site
npm run docs:dev
```

Le build produit `docs-site/build/`. La navigation inclut la référence TypeDoc,
copiée depuis la sortie générée, et les pages rédigées dans `docs/`.
Le site fonctionne pour rédiger et consulter la documentation localement.
L'avis braces a été retiré le 23 octobre 2026 et `npm run audit:docs:strict`
passe. `npm run audit:docs` conserve le rapport complet et bloque toute alerte
haute ou critique ; l'acceptation de l'amendement 0002 n'y est plus utilisée.
Deux overrides de version majeure (`tinypool`, `postcss-selector-parser`)
compensent l'absence de correctif dans Docusaurus 3.10.2. Utiliser uniquement les contenus revus
du dépôt ; aucun upload de l'application n'alimente la documentation.
La configuration TypeScript est conservée sans déclarer `type: module` dans
ce manifeste, pour respecter le chargeur interne de Docusaurus.

Le build documentaire est manuel et distinct du pipeline applicatif. La génération
est limitée à 10 minutes en CI. L'audit s'exécute chaque jour et sur les PR qui
modifient ses dépendances ou sa politique ; son rapport est conservé en artefact.
Consulter [le suivi](../docs/dependances.md) pour le périmètre et l'échéance.
