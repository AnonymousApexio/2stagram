# Audit du squelette

Audit initial du 9 septembre 2026, complété le 10 septembre.
Ce rapport décrit les contrôles locaux et les éléments encore à préparer.
Les arbitrages du 10 septembre sont consignés dans l'[amendement 0001](./amendement-0001.md).

**Verdict : socle technique exploitable, conformité complète non acquise.**
Les dossiers métier sont volontairement vides. Les consignes sont préparées
pour l'équipe, mais ne remplacent ni les contrats, ni la CI distante, ni les revues.

## Ce qui est préparé et contrôlable localement

| Exigence                                                    | État du squelette / preuve                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| TypeScript strict front/back, Node 24 natif, shared compilé | tsconfig par workspace, build shared avant consommateurs, typecheck                             |
| Dépendances épinglées et installation reproductible         | versions directes exactes, lockfiles, npm ci ; aucun Tailwind/tsx/ts-node ajouté                |
| Architecture et périmètres                                  | frontend/backend/shared séparés, dossiers métier réservés                                       |
| Style Google et format                                      | Prettier 80, exports nommés, noms sans tiret bas initial/final ; règles non mécaniques en revue |
| Qualité TypeScript                                          | ESLint interdit any, contournements TS et promesses oubliées dans les sources                   |
| Garde-fous frontend                                         | ESLint refuse styles inline, HTML brut, div/span cliquables et fetch hors services              |
| Schémas Zod partagés                                        | emplacement/exports et règles prêts ; pas de contrat métier simulé                              |
| HTTP minimal                                                | Express, helmet, limite JSON, erreurs normalisées ; tests d'intégration                         |
| Docker/nginx                                                | multi-stage, utilisateurs non-root, volumes réservés, proxy sans réécriture                     |
| Tests                                                       | Vitest, jsdom, supertest ; Playwright pour démarrage et futurs parcours séparés                 |
| Couverture locale                                           | seuil 70 % lignes/branches par fichier inclus ; code métier absent                              |
| Consignes Codex                                             | racine + frontend + backend + shared, lecture explicite par mission                             |
| Backend en deux phases                                      | proposition de routes/tests, arrêt, validation, tests rouges puis code                          |
| Documentation                                               | TypeDoc, Docusaurus isolé, guide équipe, fiche, revue, ADR, changelog                           |
| Hooks Git                                                   | Husky/commitlint/lint-staged ; chemin Husky corrigé et activation vérifiée                      |
| CI préparée                                                 | format/types/lint/tests/build, Docker, navigateur, audit, SBOM, scan conditionnel               |

Le lint n'établit pas à lui seul l'accessibilité, la conformité de chaque valeur
CSS, la pertinence d'un test ou le respect de tout le guide Google.
Les tests HTTP vérifient l'application Express ; ils ne constituent pas des
tests unitaires métier. La couverture inclut les points de démarrage et les
fichiers applicatifs non importés ; seuls les tests et déclarations de types
sont exclus du périmètre src/. Les commandes testent séparément l'outillage.

## Vérifications initiales du socle

- Installation propre avec npm ci et activation des hooks dans le dépôt Git.
- npm run check : format, lint, typage, 16 tests et build passent.
- Deux passages de couverture après corrections : 100 % des lignes (29/29),
  96,42 % des branches (27/28), sur les sources applicatives actuelles.
  La branche de délégation après envoi des en-têtes HTTP reste non couverte.
- Ajout temporaire d'un fichier shared non importé : le seuil de 70 % échoue
  effectivement. Fichier de contrôle retiré, rapport final régénéré sans lui.
- Vérification des refus ESLint : any, promesse oubliée, export par défaut,
  fetch hors services, style inline, HTML brut, div cliquable, import Node dans
  un schéma navigateur. Un composant sémantique valide est accepté.
- Playwright : démarrage sans erreur et sans débordement à 360/768/1280 px.
- Docker : deux services sains, proxy API, CSP, utilisateurs non-root et
  chargement des trois modules natifs vérifiés.
- TypeDoc/Docusaurus : build, types, navigation et styles dans le navigateur.
- YAML des workflows et acceptation/refus de messages commitlint vérifiés.
- Audit applicatif et SBOM exécutés ; audit documentation en échec, signalé.
- Fichiers destinés au dépôt contrôlés : aucun nom de membre de l'équipe,
  chemin personnel ou document original ; secrets et sorties générées ignorés.

Ces résultats concernent le petit socle actuel, pas la couverture des features
encore absentes. Aucun résultat de CI distante ou d'approbation n'est inventé.

## Contrôle après les arbitrages du 10 septembre

- Formatage, lint, typage et build applicatif passent.
- 63 tests passent : 16 tests du socle et 47 tests de la commande/politique d'audit.
- Couverture du périmètre étendu à l'audit : 100 % des lignes (88/88) et
  97,24 % des branches (106/109). Le périmètre applicatif initial reste inchangé.
- L'audit documentaire réel applique uniquement les deux causes acceptées ;
  l'audit strict reste en échec avec les 17 dépendances affectées.
- Échéance, erreurs npm, rapports incomplets et nouvelles alertes sont testés.
  Les limites de durée et le workflow documentaire sont vérifiés localement.
- Les règles sont décrites dans le dépôt et les références aux documents
  privés ont été retirées.

## Ce qui attend une fonctionnalité

Les fonctionnalités suivantes restent à développer : schéma, sessions, authentification,
profils, posts, hashtags, votes, repartages, amis, groupes, messagerie, retouche,
modération, notifications, composants et pages.

Aucune table, migration, seed, route métier, socket ou page fonctionnelle n'a été
créé pour remplir artificiellement ces cases. Auth, CSRF, rate limits, contrôle
d'accès des médias, logging HTTP avec redaction et OpenAPI devront être branchés
et testés avec les fonctionnalités. Leur dépendance installée n'est pas leur
implémentation. Les volumes sont réservés, pas une BDD configurée ou sauvegardée.

La charte CSS actuelle est provisoire. Le responsable design doit fournir tokens/breakpoints,
maquettes, états et catalogue. Le responsable BDD doit livrer le schéma avec sessions.
Le contrat API/Zod et le contrat de retouche doivent être validés entre les pôles.
Les seuls E2E métier prévus sont inscription, publication et signalement ;
ils ne sont pas encore écrits. La messagerie reste contrôlée manuellement.

## Ce qui reste externe ou non validé

- Aucun remote GitHub configuré : ni PR, ni exécution distante, ni protection de
  main, ni personnes désignées dans des règles GitHub n'ont été créés.
- Activer les sept portes du pipeline, les approbations requises et SonarCloud.
  Le scan est actuellement conditionnel à sa configuration. Le seuil local ne
  garantit pas 70 % sur les seules lignes changées ni l'absence de baisse globale.
- Définir et enregistrer la comparaison de couverture avant/après et la Quality
  Gate sur le nouveau code ; ne pas considérer un scan absent comme une validation.
- Les accords humains de Definition of Ready et les revues du socle restent à
  enregistrer dans l'outil de suivi. Ce rapport ne signe pas au nom de l'équipe.
- TLS, secrets de production, sauvegardes SQLite/WAL, restauration, politique
  d'accès et exploitation restent à préparer avec DevOps/BDD avant déploiement.
- **Failles Docusaurus toujours présentes** : 17 dépendances affectées par deux
  avis image-size. L'acceptation technique est limitée au 10 octobre 2026 à
  00:00 (heure de Paris) exclu ; le contrôle vérifie chaque cause et refuse les alertes non
  couvertes, les rapports incomplets et l'usage de l'exception après expiration.
  Le rapport complet et l'audit strict restent disponibles. Ce traitement n'est
  pas un correctif des dépendances. L'application garde 4 alertes modérées Drizzle,
  exception prévue par la stack. Voir [dependances.md](./dependances.md).

## Règles applicables

| Sujet              | Règle                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Langage            | TypeScript strict dans les sources frontend, backend et shared                                                   |
| Langue             | Identifiants, commentaires techniques et TSDoc en anglais ; documentation fonctionnelle en français              |
| États              | Query pour les données serveur, React pour l'état local, Zustand pour l'état client partagé nécessaire           |
| Grand ajout        | Classification selon l'impact ; nouvelle route seule insuffisante, tests unitaires et HTTP adaptés conservés     |
| E2E                | Parcours inscription, publication et signalement ; déclenchement selon la classification grand ajout             |
| Préfixe API        | /api/v1 dans le routeur ; nginx et Vite transmettent sans réécriture                                             |
| CSS                | variables.css et reset.css au point d'entrée ; styles de composants dans les CSS Modules                         |
| Aperçu de retouche | Variables numériques bornées dans le futur aperçu ; adaptation lint limitée au composant lors de son intégration |
| HTML externe       | Affichage comme texte ; aucun HTML brut ni DOMPurify ajouté                                                      |
| Taille de PR       | Viser 400 lignes de code modifiées, hors généré et lockfiles ; dépassement justifié et approuvé avant fusion     |

Les règles applicables sont définies dans l'[amendement 0001](./amendement-0001.md),
validé par le responsable technique. Les consignes et guides sont alignés sur
ce texte. Les contrats et validations des futures features restent nécessaires
avant leur implémentation.
