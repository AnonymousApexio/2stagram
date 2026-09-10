# Outillage et intégration continue

## Contrôles locaux

npm ci reproduit le lockfile ; npm run check exécute format, lint, types,
tests/couverture et build. Les versions sont exactes. Ne pas utiliser
npm audit fix --force ni remplacer les outils.

ESLint vérifie notamment exports nommés, TypeScript, promesses, hooks React,
motifs de sécurité dans les trois sources applicatives et garde-fous JSX/HTTP.
Les comparaisons strictes et l'absence de `var` sont aussi vérifiées.
Prettier vise 80 colonnes.
Le reste du guide Google, les limites de complexité, la charte et l'accessibilité
se relisent humainement. Les règles ne prouvent pas la pertinence des tests.

Vitest découvre backend, frontend (jsdom) et shared. Unitaires colocalisés,
intégration HTTP/BDD dans backend/tests/integration. Seuil local 70 % lignes et
branches **par fichier inclus**. Tous les fichiers applicatifs sont inclus,
même non importés et y compris les points d'entrée. Tests et déclarations de
types sont seuls exclus du périmètre src/. Le projet Vitest tooling teste aussi
la politique d'audit documentaire, incluse dans la couverture au même seuil.
Le navigateur complète les unités.

Pour une PR, comparer aussi la couverture globale avec la branche cible sur la
même configuration et contrôler les lignes/branches nouvelles dans SonarCloud.
Conserver les deux rapports dans la PR. Le seuil par fichier n'assure ni
non-régression globale, ni couverture précise du diff. Cette comparaison et la
Quality Gate doivent être configurées avant de considérer les portes complètes.

## Workflows

- CI : PR et main ; format, lint, types, tests unitaires/intégration, couverture,
  build, audit applicatif, SBOM, commits, images Docker et smoke navigateur.
  Les étapes de `quality` sont séquentielles ; Docker attend leur réussite.
  Le smoke navigateur tourne en parallèle. Les actions sont épinglées à des
  SHA complets et suivies par Dependabot. Voir [le pipeline](./pipeline.md).
- Parcours E2E : manuel ou label grand-ajout. Inscription, publication, signalement
  uniquement ; la suite vide actuelle échoue, elle n'est pas annoncée validée.
- Documentation : build manuel hors chemin critique, sans publication ; audit
  automatique sur toutes les PR, chaque jour et sur main quand ses manifestes,
  son contrôle ou sa politique changent, aussi disponible manuellement.
  Le build attend l'audit et sa génération
  est limitée à 10 minutes en CI. Le rapport npm complet est conservé en artefact.

Les hooks Husky activés par npm ci exécutent lint-staged puis commitlint.
Une archive sans .git reste installable. L'installation dans un dépôt Git utilise
le binaire Husky réellement fourni. Ne pas confondre hooks locaux et checks requis.

## Classification grand ajout

Le responsable et le relecteur indiquent grand-ajout pour une intégration externe,
une évolution de schéma/contrat, un flux critique (auth, permissions, export,
suppression) ou une refonte transverse. **Une nouvelle route seule ne suffit pas** :
évaluer ces critères et conserver ses tests unitaires et HTTP adaptés.
Cette règle applique l'[amendement 0001](./amendement-0001.md), validé par le
responsable technique ; il n'y a pas de nouvel arbitrage à demander pour chaque route.

Les tests d'intégration existants tournent dans CI sur toutes les PR et main.
Les E2E métier restent limités aux trois parcours. La classification est humaine :
le workflow ne devine pas qu'une modification constitue un grand ajout.

## Activation dans GitHub

Le remote pointe vers GitHub. Les YAML ne créent pas ces réglages, qui restent
à vérifier dans le dépôt distant :

1. Protéger main : PR obligatoire, interdiction du push direct, checks quality,
   docker et browser-smoke requis, approbations humaines et absence de contournement.
2. Nommer le responsable technique et les responsables des revues BDD, infra, design et sécurité.
   Choisir une stratégie de fusion, activer signatures ou authentification forte.
3. Créer grand-ajout, imposer les parcours lorsque nécessaire.
4. Configurer SONAR_PROJECT_KEY, SONAR_ORGANIZATION et SONAR_TOKEN. Le scan attend
   la Quality Gate quand il est activé ; il reste absent tant que ces valeurs manquent.
   Ne jamais fournir de secrets à une PR externe non fiable.
5. Exiger 70 % lignes/branches du nouveau code et une comparaison de couverture
   globale avant/après, avec des rapports vérifiables. Rendre la gate requise.
6. Configurer les dépôts/alertes Dependabot, la revue des dépendances et le SBOM.
   Pour la documentation, rendre le job audit requis : il applique uniquement
   l'exception datée décrite dans [dependances.md](./dependances.md). L'audit strict
   reste disponible et les failles restent signalées jusqu'à correction.

La revue humaine, les E2E conditionnels et l'autorisation de fusion ne sont pas
simulés par le dépôt. Les noms des contrôles et leurs conditions sont décrits
dans [le pipeline](./pipeline.md). Voir aussi [l'audit](./conformite.md).

## Docker et modules natifs

Le backend final utilise Node 24 Debian slim ; nginx sert le frontend.
Python/make/g++ restent dans les étapes de build pour les modules natifs, si
aucun binaire précompilé compatible n'est disponible. Aucun Redis ni moteur
de base externe. argon2, better-sqlite3 et sharp sont installés mais ne créent
aucun schéma ni fonctionnalité.

Avec npm 12, allowScripts autorise les scripts natifs nécessaires à leurs versions
épinglées et à esbuild. Scarf est désactivé. En local, les outils de compilation
peuvent être nécessaires pour une plateforme sans binaire précompilé.

nginx transmet /api/ et /socket.io/ sans réécriture, avec Upgrade/Connection.
Le volume media n'est pas servi publiquement par nginx : ses permissions seront
définies avec les routes. Limite d'upload prévue 25 Mio, JSON limité à 100 Kio.
Le healthcheck actuel attend 404, aucune route de santé métier n'est inventée.
Les utilisateurs finaux sont non-root. TLS et sauvegardes restent à préparer
avant un déploiement, qui n'est pas effectué par ce squelette.
