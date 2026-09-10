# AGENTS.md — backend

Lire ../AGENTS.md. Ces règles concernent l'API Express et s'appliquent aux
contrats/schémas de shared/ via ../shared/AGENTS.md.

## Workflow obligatoire

Pour toute nouvelle fonctionnalité ou modification du comportement métier,
même demandée simplement en langage naturel :

### Phase 1 — aucun code

- Lire besoin, critères, contrat et fichiers existants.
- Produire **uniquement** les routes proposées (méthode, chemin, droits,
  entrées/sorties, existante ou à approuver) et les tests unitaires prévus,
  nommés should_X_when_Y. Si aucune route ne change, l'indiquer.
- Couvrir cas nominal, absent/null/vide, chaînes longues, Unicode/emojis,
  collection vide/volumineuse, bornes, double soumission/concurrence, rejeu,
  droits sur **cette ressource**, entrée hostile, échec à mi-parcours.
  Ajouter temps/UTC et panne d'une dépendance si pertinents. Justifier les cas
  sans objet au lieu d'inventer des tests artificiels.
- Distinguer unités isolées et tests HTTP supertest/intégration. Pour chaque
  test, préciser brièvement préparation, action et assertion attendue.
- **S'arrêter et attendre la validation explicite de l'utilisateur sur cette
  liste et ces routes.** Aucun code de production, test ou migration écrit.
  Signaler les informations bloquantes si nécessaire.

### Phase 2 — après validation

1. Écrire d'abord les tests approuvés avec des dépendances isolées en unitaire.
2. Les lancer et montrer le résultat **rouge réel**. Vérifier que l'échec est
   dû au comportement manquant ; une configuration cassée n'est pas une preuve.
   Ne pas casser du code existant artificiellement pour obtenir du rouge.
3. **Aucune ligne de production avant ces tests écrits et rouges.** Implémenter
   ensuite le minimum qui les rend verts ; refactoriser en conservant la suite verte.
4. Ne pas assouplir une assertion pour suivre le code. Si le comportement attendu
   est erroné, expliquer et faire valider la correction de la liste.
5. Lancer les suites concernées puis npm run check. Rapporter rouge/vert,
   fichiers modifiés, cas limites et implications sécurité.

Une validation explicite déjà donnée reste valable : ne pas recommencer la
phase 1. Si les tests ne peuvent pas être exécutés, corriger l'environnement
ou signaler le blocage, sans prétendre avoir réalisé le TDD.
Un audit sans correction, une doc, un déplacement ou une configuration du
squelette n'est pas une feature et n'exige pas de tests métier factices.
Definition of Ready, validation de la liste et revue humaine de PR sont distinctes.

## Stack et architecture

- Node 24 ESM, TypeScript strict par effacement natif, imports relatifs .ts.
  Exports nommés/TSDoc anglais ; shared compilé avant ses consommateurs.
- Express 5.2.1, Zod 4, better-sqlite3 + Drizzle, migrations drizzle-kit.
- argon2, express-session + Store SQLite maison, helmet/cors/express-rate-limit,
  multer/file-type/sharp, Socket.io 4, pino/pino-http.
- Vitest 5 + supertest ; zod-openapi + swagger-ui-dist servi en statique
  uniquement hors production. Pas de remplacement ou de paquet supplémentaire.

Trois couches : HTTP (routes/ et controllers/), métier (services/), persistance
(repositories/). Middlewares et utilitaires séparés. Un service ne reçoit pas
req/res ; le contrôleur n'accède pas à la BDD ; le repository ne porte pas de
règle métier. Injecter les dépendances pour isoler les tests. Découper par domaine
quand le module grossit.

## Contrats et données

- Zod dans shared/src/schemas/, types z.infer, exports via @2stagram/shared,
  OpenAPI généré. Ne pas inventer une route hors contrat approuvé.
- /api/v1 dans le routeur Express ; nginx transmet sans réécriture. URL
  kebab-case, ressources plurielles, action par méthode HTTP ; exceptions auth
  uniquement si prévues au contrat.
- JSON camelCase et erreurs uniques : { code, message, details }.
- Valider corps, paramètres et query ; utiliser **la sortie parsée Zod**, pas
  l'entrée brute après validation. Gérer les propriétés non autorisées.
- SQL paramétré via Drizzle, jamais concaténé. Schéma dans shared/src/db/schema.ts
  validé par le responsable BDD ; aucun DDL/migration improvisé.
- better-sqlite3 synchrone, aucun await artificiel. Pragmas à l'ouverture :
  WAL, foreign_keys, busy_timeout. Un seul backend, volumes db/media.
- Tables snake_case plurielles, colonnes snake_case, clés <entite>_id, dates
  UTC/ISO 8601 suffixées _at. Index : `idx_<table>_<colonnes>` ; contraintes
  uniques : `uq_<table>_<colonnes>`. Noms explicites validés avec le schéma.
- Table sessions préalable à l'auth. Tendances via table de comptage.
  Seeds Faker fixes/reproductibles, interdits hors développement.
- Prévoir transaction/compensation des échecs partiels et rejeu sans duplication
  non souhaitée, selon le contrat métier validé.

## Sécurité au fil des fonctionnalités

Consulter les fiches OWASP pertinentes pour le changement.

- Permissions sur la ressource précise : requireAuth et rôle ne prouvent pas
  propriété, visibilité du post ou appartenance à la conversation de groupe.
- Argon2id explicite : mémoire 19456 Kio, temps 2, parallélisme 1, PHC,
  verify/needsRehash. Aucun bcrypt, JWT ou cryptographie maison.
- express-session + Store better-sqlite3 : cookie httpOnly/Secure/SameSite=Lax,
  régénération au login, expiration glissante, révocation immédiate après
  suspension/ban. Protection CSRF et origine des mutations à définir et tester ;
  SameSite seul ne constitue pas la validation d'une requête.
- Limiter login, récupération du mot de passe et uploads. CORS explicite si
  nécessaire ; même origine front/API, aucun wildcard avec credentials.
- Upload : taille → magic bytes (jamais extension/mimetype client) →
  ré-encodage sharp sans EXIF → randomUUID → volume media hors du code.
  Vidéo : taille, magic bytes, nom aléatoire, stockage ; ni ffmpeg ni vignette.
  Aligner limite nginx, configuration et validation backend.
- Retouche : contrat commun de paramètres validé avant code ; serveur source
  du rendu final, avec limites sur les transformations.
- Socket.io : cookie au handshake, origine, permissions pour événements/rooms,
  room par utilisateur/conversation, retrait du groupe et révocation traités.
  Aucun adapter Redis.
- Erreurs centralisées : 500 générique, aucune stack, SQL ou chemin au client.
  Logs pino/pino-http avec request id et redaction ; pas de console, ni catch vide.
  Libérer les ressources même sur erreur.

## Revue

Tests Arrange/Act/Assert, un comportement, assertions pertinentes, aucun ordre
partagé ; réseau/BDD/horloge/aléatoire simulés en unitaire. Intégration sur
ressources de test isolées, jamais sur des données réelles.
Vérifier qu'en retirant le contrôle de permissions le test échouerait.

Appliquer ../docs/revue-pr.md. Signaler les revues sécurité (responsable technique et Scrum Master),
BDD (le responsable BDD), infrastructure (le responsable DevOps) si concernées.
Une nouvelle route seule ne déclenche pas les E2E ; évaluer son impact selon
../docs/outillage.md et l'amendement 0001. Les tests HTTP adaptés restent requis.
Ne pas annoncer une feature terminée si validation, tests ou revue manquent.
