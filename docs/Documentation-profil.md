# Profil et compte de 2stagram

*Documentation fonctionnelle et technique*

Louis | Équipe 2stagram | État documenté au 22 septembre 2026

Le module gère la consultation des profils publics, la gestion du compte personnel par l'utilisateur connecté, la mise à jour des préférences de visibilité et la modification sécurisée des identifiants (pseudo, contact, avatar et mot de passe). Il s'appuie sur le store de session d'authentification et prépare le raccordement à la persistance SQLite de Kleiton.

---

## 1 Objectif et architecture

Cette documentation définit le contrat d'API, les règles d'intégrité métier et les exigences de sécurité liées à la gestion des comptes et des profils pour l'équipe 2stagram.

### Parcours utilisateur

- **Consultation de profil public :** accès en lecture aux informations publiques d'un utilisateur (`id`, `username`, `bio`, `avatar_path`, date de création). Aucun secret ni donnée privée (`email`, `phone`, `role`) n'est divulgué.
- **Consultation de son propre profil :** l'utilisateur authentifié accède à l'ensemble de ses informations personnelles et préférences de confidentialité (`is_reshare_public`, `group_invite_policy`, `email`, `phone`).
- **Mise à jour des informations de profil :** modification de la biographie, des préférences de repartage et de politique d'invitation de groupe sans réauthentification.
- **Gestion de l'avatar :** téléversement, remplacement ou suppression de l'image de profil avec validation de format et stockage sécurisé.
- **Modification des identifiants sensibles :** changement d'adresse email, de numéro de téléphone ou de nom d'utilisateur avec vérification d'unicité. Le changement de mot de passe exige obligatoirement la saisie du mot de passe actuel (`current_password`) et révoque les sessions distantes.

### Organisation du code

| Couche | Rôle | Fichiers principaux |
| --- | --- | --- |
| HTTP | Valider les paramètres d'URL, les corps JSON et les fichiers d'avatar. | backend/src/routes/profile.ts<br>backend/src/controllers/profile.ts |
| Métier | Vérifier les permissions, appliquer la normalisation et orchestrer les changements d'identifiants. | backend/src/services/profile-service.ts<br>backend/src/services/avatar-service.ts |
| Persistance | Exécuter les requêtes de lecture et de mise à jour atomique sur la base SQLite. | UsersRepository<br>SessionRepository |

Flux : `navigateur / client` → `route et contrôleur` → `middleware de session (auth)` → `service profil` → `repository injecté`.

---

## 2 Contrat API et validation

Les routes relatives au profil sont scindées en deux préfixes : `/api/v1/users` pour les accès publics et `/api/v1/profile` pour l'espace personnel authentifié. Les requêtes JSON sont strictes : tout champ non documenté déclenche un refus immédiat (`400 VALIDATION_ERROR`).

| Méthode et route | Entrée | Réponse nominale |
| --- | --- | --- |
| `GET /api/v1/users/:username` | Paramètre d'URL `username`<br>Query facultative : `limit` (défaut : 20, max : 50), `cursor` (ou `page`)<br>Accès public | 200 et profil public avec tableau `posts` paginé (uniquement les publications visibles selon le lien d'amitié entre l'observateur et l'auteur). Si le compte est supprimé ou introuvable : 404 avec message métier uniforme. |
| `GET /api/v1/profile/me` | Cookie de session valide | 200 et profil complet de l'utilisateur connecté. |
| `PATCH /api/v1/profile/me` | `bio?`, `is_reshare_public?`, `group_invite_policy?`<br>Cookie de session valide | 200 et profil complet mis à jour. |
| `POST /api/v1/profile/avatar` | Fichier image (`multipart/form-data`)<br>Cookie de session valide | 200 `{ "avatar_path": string }`. |
| `DELETE /api/v1/profile/avatar` | Corps vide<br>Cookie de session valide | 204 sans corps. `avatar_path` remis à `NULL`. |
| `PATCH /api/v1/profile/credentials` | `username?`, `email?`, `phone?`<br>Cookie de session valide | 200 et identifiants mis à jour. |
| `POST /api/v1/profile/change-password` | `current_password`, `new_password`<br>Cookie de session valide | 204 sans corps. Sessions distantes révoquées. |
| `PATCH /api/v1/profile/privacy` | `post_visibility?`, `group_invite_policy?`, `is_reshare_public?`<br>Cookie de session valide | 200 et préférences de confidentialité mises à jour. |
| `DELETE /api/v1/profile` | `password` (confirmation obligatoire)<br>Cookie de session valide | 204 sans corps. Déclenche l'anonymisation logique, la fermeture de toutes les sessions et la suppression du cookie. |

### Données retournées

- **Profil public (`/users/:username`) :** renvoie uniquement `{ id, username, bio, avatar_path, created_at }`. Le rôle, l'email, le téléphone et les identifiants techniques internes ne sont jamais exposés.
- **Profil privé (`/profile/me`) :** renvoie `{ id, username, email, phone, bio, avatar_path, role, is_reshare_public, group_invite_policy, created_at }`.
- **Identifiant public et IDOR (Convention 10.3) :** la consultation publique s'effectue via le `username` insensible à la casse. Le champ `id` exposé dans les réponses publiques reste soumis à l'arbitrage architectural d'équipe (alignement avec Nat et Kleiton sur un `public_id TEXT UNIQUE` pour proscrire l'exposition d'entiers séquentiels).

### Règles des champs et contraintes d'intégrité

| Champ | Validation applicative (Zod / Service) | Contrainte Persistance (SQLite) |
| --- | --- | --- |
| `username` | Espaces périphériques retirés ; 3 à 30 caractères composés **exclusivement de lettres, chiffres et tiret bas** (`[a-zA-Z0-9_]`). Aucun point, accent ou émoji. Casse conservée à l'affichage. | `UNIQUE (username COLLATE NOCASE)` obligatoire en base pour garantir l'unicité stricte indépendamment de la casse. |
| `email` | Espaces périphériques retirés ; max 254 caractères ; minuscules puis validation Zod de syntaxe d'adresse. | `CHECK (email = LOWER(email))` et `UNIQUE` en base. Non modifiable si déjà renseigné sauf confirmation explicite. |
| `phone` | Numéro validé et converti au format international standardisé E.164 via `libphonenumber-js` (`parsePhoneNumberFromString(val, 'FR')`). | `UNIQUE` en base si non `NULL`. |
| bio | Chaîne de 0 à 500 caractères maximum. Les URL sont explicitement autorisées (avec validation de schéma http/https). Espaces superflus nettoyés. |
| `avatar` (fichier) | Taille maximale : 2 Mo. Formats acceptés : JPEG, PNG, WebP (`image/jpeg`, `image/png`, `image/webp`). Vérification du type MIME réel par signature magique (*magic bytes*). | `avatar_path TEXT NULL` (stocke le chemin relatif ou le nom de fichier haché). |
| `is_reshare_public` | Booléen (`true` / `false`). | `INTEGER NOT NULL DEFAULT 1` (`CHECK (is_reshare_public IN (0, 1))`). |
| `group_invite_policy` | Énumération stricte : `'everyone'`, `'friends'`, `'nobody'`. | `TEXT NOT NULL DEFAULT 'everyone'` (`CHECK (group_invite_policy IN ('everyone', 'friends', 'nobody'))`). |

---

## 3 Sécurité et intégrité des données

### Contrôle d'accès et prévention des IDOR

Toutes les routes de modification sous `/api/v1/profile` résolvent l'identité de la cible exclusivement à partir de l'identifiant extrait du cookie de session (`session.userId`). Aucun paramètre d'identifiant (`userId` ou `id`) n'est accepté dans l'URL ou dans le corps de la requête pour ces opérations, rendant toute tentative d'usurpation d'identité (IDOR) impossible au niveau architectural.

### Sécurisation de l'avatar

1. **Validation stricte :** l'extension déclarée dans le nom de fichier est ignorée. Le service inspecte les premiers octets du tampon (*magic numbers*) pour valider le type binaire réel.
2. **Nommage et stockage :** les images ne sont jamais enregistrées sous leur nom d'origine. Un nom aléatoire sécurisé (UUIDv4 ou hash cryptographique SHA-256) avec l'extension canonique correspondante est généré.
3. **Isolation :** le répertoire de stockage physique est situé hors de la racine d'exécution directe des scripts backend pour interdire toute exécution de code malveillant.
4. **Nettoyage :** le téléversement d'un nouvel avatar ou la suppression (`DELETE`) supprime physiquement l'ancien fichier associé sur le disque pour éviter les fichiers orphelins.

### Modification des identifiants et mot de passe

- **Changement de mot de passe (`/change-password`) :** l'utilisateur doit obligatoirement fournir son `current_password`. Le service vérifie ce mot de passe contre le hash Argon2id en base (avec exécution de hash factice si le compte présente une anomalie afin d'empêcher les attaques temporelles).
- **Complexité du nouveau mot de passe :** soumise aux mêmes règles strictes du projet (15 à 128 caractères, au moins quatre majuscules, quatre minuscules, quatre caractères spéciaux, rejet formel des émojis).
- **Révocation de session :** après changement réussi du mot de passe, l'intégralité des autres sessions actives de l'utilisateur est immédiatement révoquée via `destroyByUserId(userId)` (ou l'alias `revokeUserSessions`), à l'exception de la session courante renouvelée.

### Suppression du compte (anonymisation et suppression logique)

Le compte n'est jamais supprimé physiquement de la base SQLite afin de conserver l'historique de modération (avertissements, bannissements) et d'empêcher qu'un utilisateur sanctionné ne recrée immédiatement un compte identique :
- **Données personnelles effacées :** `email`, `phone`, `bio` et `avatar_path` sont vidés (`NULL`). Le mot de passe est invalidé pour interdire toute reconnexion.
- **Pseudo anonymisé :** le `username` d'origine est libéré et remplacé par un identifiant anonyme généré par le backend (ex. `compte_supprime_<id>`).
- **Nettoyage des contenus :** ses publications, commentaires et messages directs sont supprimés. Les repartages effectués par le compte sont supprimés. Les repartages réalisés par d'autres utilisateurs pointant vers ses publications restent visibles avec la mention « publication indisponible ».
- **Clôture des sessions :** révocation immédiate de la totalité des sessions actives via `destroyByUserId(userId)` et suppression du cookie.
- **Consultation publique :** une requête vers le profil d'un compte supprimé renvoie un statut 404 avec le message métier explicite « Compte inexistant » (jamais d'erreur technique 500).

### Protection CSRF et en-têtes

Toutes les requêtes de modification (`PATCH`, `POST`, `DELETE`) sont soumises à la triple protection établie pour le module d'authentification : en-tête `Origin` strict, cookie `SameSite=Lax`, et en-tête personnalisé `X-CSRF-Protection: 1`.

---

## 4 Erreurs et stratégie de test

Le module applique le format uniforme d'erreur `{ "code": string, "message": string, "details": object | null }`.

| HTTP | Code | Situation |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Format d'email ou de téléphone invalide, bio trop longue, émojis dans le mot de passe. |
| 401 | `AUTHENTICATION_FAILED` | Session absente ou invalide, mot de passe actuel erroné lors d'un changement de mot de passe. |
| 403 | `FORBIDDEN` | Échec de validation CSRF ou origine non autorisée. |
| 404 | `USER_NOT_FOUND` | Identifiant inconnu OU compte supprimé logiquement (`deleted_at IS NOT NULL`). La réponse renvoie strictement le message générique `Compte inexistant` sans divulguer l'existence passée du profil. |
| 409 | `IDENTITY_UNAVAILABLE` | Tentative de modification du pseudo, email ou téléphone vers une valeur déjà attribuée. |
| 413 | `BODY_TOO_LARGE` / `FILE_TOO_LARGE` | Corps JSON > 100 Kio ou avatar > 2 Mo. |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Fichier téléversé non reconnu comme image JPEG, PNG ou WebP. |
| 500 | `INTERNAL_ERROR` | Défaillance d'écriture base ou système de fichiers. |

### Cas vérifiés par les tests

- **Consultation :** masquage effectif des champs privés sur `/users/:username` ; restitution exhaustive sur `/profile/me`.
- **Normalisation :** conservation exacte de la casse du `username` à l'enregistrement et rejet des doublons insensibles à la casse (`Kleiton` vs `kleiton`).
- **Téléphone :** acceptation des formats locaux français et internationaux ; conversion exacte en E.164 (`+33...`) ; rejet des numéros invalides.
- **Avatar :** rejet d'un faux fichier JPEG (ex. script renommé `.jpg`) ; suppression de l'ancien fichier après remplacement ; nettoyage après `DELETE`.
- **Sécurité mot de passe :** rejet de la modification si `current_password` est incorrect ; application de la règle 4/4/4 sans émojis sur le nouveau mot de passe ; confirmation de la révocation des autres sessions.

---

## 5 Raccordement, conventions et coordination équipe

### Conventions de développement

- **Branche Git :** conformément aux règles d'équipe, le travail doit être isolé sur la branche `fonctionnalité/profil` (l'usage de `feat/` est interdit).
- **Rapport de couverture (§7.3) :** les tests unitaires et d'intégration couvrant `backend/src/services/profile*` et `avatar-service*` doivent faire l'objet d'un rapport de couverture dédié justifiant le respect des seuils d'acceptation.
- **Processus de merge (§3.4 et §10.4) :** passage obligatoire en revue de code croisée avec validation du contrat d'interface et des schémas partagés dans `shared/src/schemas/profile.ts`.

### Coordination avec Kleiton (Adaptateur SQLite & Schéma)

1. **Table `users` :** vérifier la présence des colonnes `bio TEXT NULL`, `avatar_path TEXT NULL`, `is_reshare_public INTEGER NOT NULL DEFAULT 1`, et `group_invite_policy TEXT NOT NULL DEFAULT 'everyone'`.
2. **Index et contraintes :** s'assurer de la déclaration de l'index d'unicité `UNIQUE (username COLLATE NOCASE)` et de la clause `CHECK (email = LOWER(email))`.
3. **Persistance atomique :** les mises à jour combinées sur `users` (notamment lors du changement d'identifiants et de hash de mot de passe) doivent être exécutées dans une transaction SQLite unique (`better-sqlite3`).
4. **Harmonisation des sessions :** utilisation de `destroyByUserId(userId)` pour invalider les sessions distantes lors d'une modification de mot de passe.
5. **Stockage physique et distribution :**
   - Les fichiers validés sont écrits sur le disque local dans le répertoire dédié `uploads/avatars/`.
   - Ce dossier est exposé en lecture seule via un middleware statique dédié qui force l'en-tête de sécurité `X-Content-Type-Options: nosniff` et désactive toute exécution de script.
   - La valeur persistée et renvoyée dans le champ `avatar_path` est le chemin relatif public accessible par le client (ex. `/uploads/avatars/550e8400-e29b-41d4-a716-446655440000.webp`).

### Coordination avec les fonctionnalités consommatrices

- **Publication (Erin) :** la valeur de `is_reshare_public` gouverne directement les permissions de repartage appliquées lors de la création d'une publication.
- **Messagerie :** le filtre `group_invite_policy` est interrogé par le module de messagerie avant d'autoriser l'ajout d'un utilisateur à une conversation de groupe.
