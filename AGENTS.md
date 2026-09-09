# AGENTS.md — 2stagram

## Commencer ici

L'utilisateur décrit sa mission en langage naturel et peut joindre une capture.
Déduire le périmètre, lire les fichiers existants et appliquer les règles sans
lui faire recopier un long prompt.

Lire ce fichier puis les consignes de **chaque** périmètre touché, même si la
session est ouverte à la racine :

| Mission                                   | Instructions à lire avant de modifier    |
| ----------------------------------------- | ---------------------------------------- |
| Écran, composant, style, état client      | frontend/AGENTS.md                       |
| API, service, session, upload, temps réel | backend/AGENTS.md                        |
| Zod, types partagés, Drizzle              | shared/AGENTS.md et backend/AGENTS.md    |
| Outillage, CI, Docker, documentation      | ce fichier et docs/outillage.md          |
| Revue de code                             | périmètres concernés et docs/revue-pr.md |

Les règles racine et locales se cumulent. Ne pas supposer que les fichiers des
dossiers frères sont chargés automatiquement : les lire explicitement.
Une tâche mixte applique tous les périmètres concernés.

## Périmètre et cadrage

Le dépôt est un **squelette TypeScript**, sans fonctionnalités métier. Nettoyer
ou préparer le socle n'autorise pas à implémenter les pages, l'authentification,
les schémas ou les migrations métier.

Les règles et les choix techniques applicables sont documentés dans ce dépôt.
L'amendement docs/amendement-0001.md, validé par le responsable technique,
tranche les divergences du dépôt : états, grand ajout, CSS et audit documentaire.
Appliquer ces arbitrages sans redemander leur accord de principe.
L'état d'application figure dans docs/conformite.md.
Ne pas présenter une proposition comme une décision déjà approuvée.

Avant une nouvelle fonctionnalité, vérifier la Definition of Ready : besoin,
critères, cas limites, contrat, dépendances, accord des pôles concernés,
présentation au Scrum Master et validation technique du responsable technique. Réutiliser toute validation
déjà donnée dans la fiche ou la conversation, sans la redemander. Sinon préparer
la fiche avec docs/gabarit-tache.md et demander uniquement les points manquants
avant le code qui en dépend. L'absence de réponse n'est pas un accord.
Les corrections et travaux de socle déjà autorisés peuvent avancer.

## Langage et lisibilité

- npm workspaces : backend/, frontend/, shared/. docs-site/ reste isolé.
- TypeScript strict : .ts/.tsx dans src/, sans any, @ts-ignore, @ts-nocheck ni
  assertion de type destinée à masquer une erreur.
- Node 24 exécute le backend directement, imports relatifs avec .ts, sans tsx,
  ts-node ni compilation backend. erasableSyntaxOnly interdit enum, namespace
  et les propriétés de constructeur.
- Compiler shared avant ses consommateurs : npm run build:shared. Importer
  ses exports via @2stagram/shared, jamais ses sources internes.
- Google TypeScript Style Guide : identifiants anglais, acronymes comme des mots
  (loadHttpUrl), aucun tiret bas initial/final, exports nommés. Exceptions pour
  les configurations d'outils exigeant un export par défaut. Prettier : 80 colonnes.
- Commentaires techniques et TSDoc en anglais ; documentation
  fonctionnelle, consignes, échanges et interface en français.
- TSDoc sur les fonctions, composants et hooks exportés : comportement, paramètres,
  retour, erreurs réellement possibles ; pas de tags artificiels. TypeDoc génère
  la référence TypeScript, OpenAPI est généré séparément depuis Zod.
- Fonctions ciblées, effets de bord isolés, clauses de garde. Repères de revue :
  50 lignes/fonction, 3 niveaux d'imbrication, 4 paramètres, 400 lignes/fichier.
  Justifier les dépassements ; éviter toute abstraction sans besoin.
- Booléens is/has/can, unités explicites (timeoutMs), collections au pluriel,
  fichiers kebab-case hors composants et hooks React.

## Dépendances et sécurité

- Utiliser la stack installée. npm ci est autorisé pour reproduire le lockfile.
  Pas de nouveau paquet, substitution, mise à jour ou npm audit fix --force sans
  autorisation explicite du responsable technique.
- Aucun secret dans les sources, tests, logs ou historique. .env reste local ;
  .env.example documente les variables sans valeur sensible.
- Pas de route ou de contrat métier inventé, ni de DDL/migration sans périmètre
  explicite et validation BDD (le responsable BDD).
- Ne jamais désactiver un test, assouplir une assertion ou une règle pour faire
  passer une implémentation. Corriger la cause ou expliquer le désaccord.
- Seule exception SCA documentaire autorisée : les deux avis image-size,
  jusqu'au 10 octobre 2026 à 00:00 (heure de Paris) exclu, selon docs/dependances.md.
  Ne pas étendre le périmètre ni prolonger l'échéance sans nouvel accord explicite.
- Consulter les fiches OWASP applicables au changement. Les contrôles frontend
  ne remplacent pas les permissions et validations backend.
- Signaler les blocages tôt. Ne pas envoyer de message ou publier au nom de
  l'utilisateur sans son autorisation.

## Vérification et livraison

Appliquer le workflow backend **proposition → arrêt → validation → tests rouges
→ code → tests verts**, détaillé dans backend/AGENTS.md.

| Tests                 | Emplacement                                     |
| --------------------- | ----------------------------------------------- |
| Unitaires             | à côté du fichier testé, *.test.ts / *.test.tsx |
| Intégration HTTP/BDD  | backend/tests/integration/*.test.ts             |
| E2E métier Playwright | tests/e2e/*.spec.ts                             |
| Démarrage navigateur  | tests/smoke/*.spec.ts, distinct des E2E métier  |

Nommer les tests should_X_when_Y ; assertions pertinentes, dépendances isolées
en unitaire. Ne pas appeler « unitaire » un test HTTP ou une vraie BDD.
Ne pas présenter une suite vide comme validée.

Exécuter les contrôles adaptés puis npm run check avant livraison de code.
Pour le front : contrôle aux trois largeurs. Pour les dépendances :
npm run audit:dependencies. Pour le site : npm run docs:site et npm run audit:docs.
Rapporter les commandes réellement exécutées, résultats et limites.

Exiger 70 % lignes et branches sur le code ajouté/modifié et aucune baisse de la
couverture globale. Le seuil global Vitest seul ne prouve pas ces deux critères ;
voir les réglages externes et la comparaison de couverture dans docs/outillage.md.

Travailler sur une branche type/sujet-en-kebab-case, jamais directement sur main.
Conventional Commits avec types anglais. Viser 400 lignes de code modifiées/PR,
hors généré et lockfiles ; faire approuver une exception avant fusion.
Ne pas committer, pousser ou fusionner sans demande.

Revue humaine : le responsable technique ; le responsable BDD pour BDD, le responsable DevOps pour CI/infra, le responsable design pour le
rendu. Ajouter responsable technique et Scrum Master en revue sécurité pour auth, permissions, nouvelle
entrée externe, upload, tiers sensible ou données personnelles.
Les checks distants, approbations et protections de main ne sont pas simulés.

Terminer par le résultat, les fichiers créés/modifiés, les vérifications faites
et les limites. Mettre à jour docs, ADR et changelog quand le changement le demande.
