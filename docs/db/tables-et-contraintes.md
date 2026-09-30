# Schéma de base de données — 2stagram

**Projet** : 2stagram — SAÉ 5.02
**Responsable** : Kleiton Kitani (Admin BDD)
**SGBD** : SQLite via `better-sqlite3`, ORM Drizzle
**Version** : 4.7 — 29 septembre 2026
**Statut** : **validé par Nat le 28 septembre 2026.** 23 tables, 64 décisions,
aucune en suspens. Le récapitulatif fonctionnel est aligné en version 2 (§0.2).
Reste un point ouvert, la réinitialisation du mot de passe par SMS
(récapitulatif, « Décisions ouvertes »).

> **Nature de ce document.** Il décrit un schéma **cible**. Le récapitulatif
> fonctionnel fait foi sur les règles métier ; les arbitrages pris en revue le
> complètent. Les neuf passages du récapitulatif qu'ils modifiaient sont
> **désormais corrigés** — §0.2.

> **Marqueurs.**
>
> | Marqueur | Signification |
> |---|---|
> | **`[récap]`** | Règle du récapitulatif fonctionnel |
> | **`[Dn]`** | Arbitrage, **acquis**. Table complète en §0.1, dans `decisions-de-conception.md` |
> | **`[à livrer]`** | Pas encore dans `shared/src/db/schema.ts` |
>
> **Le SQL de toutes les contraintes est en §10**, à la fin de ce fichier.

Un fichier sur deux — la carte est dans [`Readme.md`](Readme.md).

> **Sections portées par ce fichier : §1 à §8 et §10.** La numérotation est **commune aux deux fichiers** : un renvoi tel que `§4.3` désigne toujours la même section, et §0 est dans `decisions-de-conception.md`. Les renvois sont textuels, pas cliquables — on les suit par une recherche dans le fichier.

---

## 1. Vue d'ensemble

23 tables réparties en dix domaines.

| Domaine | Tables |
|---|---|
| Authentification | `sessions`, `password_reset_tokens` |
| Utilisateurs | `users`, `user_sanctions`, `blocks` |
| Publications | `posts`, `media`, `saved_posts` |
| Idempotence | `idempotency_reservations`, `media_staging` |
| Interactions | `comments`, `post_reactions`, `comment_reactions` |
| Hashtags | `hashtags`, `post_hashtags`, `hashtag_trends` |
| Relations | `friendships` |
| Messagerie | `conversations`, `conversation_members`, `messages`, `message_attachments` |
| Modération | `reports` |
| Notifications | `notifications` |

Le schéma est défini dans `shared/src/db/schema.ts` (Drizzle). **C'est le seul
fichier à modifier.**

### Documents liés

| Document | Auteur | Interface |
|---|---|---|
| Récapitulatif fonctionnel | Kleiton | **Fait foi.** Version 2, alignée (§0.2) |
| Authentification | Louis | `users`, `sessions`, `password_reset_tokens` |
| Publication | Erin | `posts`, `media`, `comments`, idempotence |

### Vocabulaire

| Récapitulatif | Ce document | Colonne |
|---|---|---|
| « Avec un commentaire, 2200 caractères » | **description** | `posts.caption` |
| Section « Commentaires » | **commentaire** | `comments.body` |
| — | **cadre** d'un repartage | la ligne `posts` du repartage |
| — | **contenu** d'un repartage | le média et la description de la **racine** |

---

## 2. Conventions

### 2.1 Renvois

| Écriture | Désigne |
|---|---|
| §4.6 | Une section de ce document |
| §10 | L'annexe SQL |
| D18 | Un arbitrage, table en **§0.1** |

### 2.2 Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Table | snake_case, pluriel | `users`, `post_reactions` |
| Colonne | snake_case, singulier | `password_hash`, `created_at` |
| Clé primaire | `id` | `id` |
| Clé étrangère — **[D27]** | `<rôle>_id` | `user_id`, `blocker_id` |
| Index | `idx_<table>_<colonnes>` | `idx_posts_user_id_published_at_id` |
| Contrainte unique | `uq_<table>_<colonnes>` | `uq_users_email` |
| `CHECK` sur **une** colonne | `ck_<table>_<colonne>` | `ck_users_role` |
| `CHECK` **entre** colonnes | `ck_<table>_<sujet>` | `ck_media_type_format` |
| Clé primaire composite | `pk_<table>` | `pk_conversation_members` |

> **Les noms `pk_<table>` et `uq_<table>_…` sont documentaires.** SQLite
> ne les expose pas : une violation de clé primaire composite remonte
> `UNIQUE constraint failed: blocks.blocker_id, blocks.blocked_id`, et l'index
> réel s'appelle `sqlite_autoindex_blocks_1`. **Un test ne doit jamais
> assertionner sur ces noms.** Les `CHECK`, eux, remontent bien le leur —
> `CHECK constraint failed: ck_users_role` — ce qui justifie l'effort de
> nommage de §10.

### 2.3 Notation

| Abréviation | Signification |
|---|---|
| `PK` | Fait partie de la clé primaire |
| `FK` | Clé étrangère |
| `NN` | `NOT NULL` |
| *(rien)* | Facultative |

### 2.4 Les trois familles de CHECK

**Famille 1 — énumérations. Toute colonne à valeurs fermées porte un
`ck_<table>_<colonne>` : 19 contraintes**, SQL en §10.1.

| Contrainte | Valeurs |
|---|---|
| `ck_users_role` | `user`, `moderator`, `admin` |
| `ck_users_post_visibility`, `ck_users_group_invite_policy` | `public`, `friends` |
| `ck_media_media_type`, `ck_message_attachments_media_type` | `photo`, `video` |
| `ck_media_file_format`, `ck_message_attachments_file_format` | les huit formats |
| `ck_post_reactions_reaction_type`, `ck_comment_reactions_reaction_type` | `like`, `dislike` |
| `ck_user_sanctions_sanction_type` | `warning`, `ban` |
| `ck_reports_target_type` | `post`, `comment`, `user` |
| `ck_reports_reason` | `spam`, `harassment`, `offensive_content`, `other` |
| `ck_reports_status` | `pending`, `resolved`, `dismissed` |
| `ck_friendships_status` | `pending`, `accepted` |
| `ck_notifications_notification_type` | les huit types |
| `ck_hashtag_trends_period` | `7d` |
| `ck_media_staging_state` | `staged`, `orphaned` |
| `ck_conversations_is_group`, `ck_notifications_is_read` | `0`, `1` |

> **Sans elles, la base accepte `role = 'superadmin'`** sans un mot.

**Famille 2 — formats et longueurs.** Les 35 `CHECK` de date (§10.2), et
**toute colonne `TEXT` libre porte une borne** (D61, §10.1).

**Famille 3 — cohérence entre colonnes**, nommée par sujet (§10.3).

> **Deux colonnes échappent à la famille 1.** `user_sanctions.reason` est un
> motif **libre** — mais borné par D61 — et `reports.target_snapshot` contient
> du **JSON applicatif**, dont SQLite ne sait rien valider.

### 2.5 Clés primaires — **[D6]** **[D63]**

**Une clé primaire simple est privilégiée lorsque l'identité de la ligne doit
pouvoir être référencée indépendamment de ses autres attributs. Une clé
composite est retenue lorsque la ligne n'a pas d'existence propre hors de la
relation qu'elle exprime, et qu'aucune table ne la référence.**

| Forme | Nombre | Tables |
|---|---|---|
| `id INTEGER` | 13 | Cas général |
| `sid TEXT` | 1 | `sessions` |
| Composite | 9 | `post_hashtags`, `blocks`, `saved_posts`, `conversation_members`, `hashtag_trends`, `idempotency_reservations`, `friendships`, **`post_reactions`**, **`comment_reactions`** |

> **[D63] Les réactions passent en clé composite.** La v2.9 leur gardait un
> `id` en invoquant qu'« une notification pourrait les référencer ». Deux
> décisions ont depuis contredit cette justification : **D21** a figé les
> cibles de notification à cinq colonnes, aucune ne visant une réaction, et
> **D26** s'appuie sur l'unicité `(user_id, post_id)`, pas sur l'`id`. La
> table était donc la seule exception à D6, justifiée par un usage qui
> n'existe pas. `pk_post_reactions` remplace `id` et
> `uq_post_reactions_user_id_post_id` ; l'upsert de D26 fonctionne à
> l'identique, la clé primaire servant de cible au `ON CONFLICT`.

### 2.6 Types et formats

**Dates** : `TEXT`, ISO 8601 UTC **avec millisecondes**, suffixe `_at`.

**Booléens** : `INTEGER` 0 ou 1, préfixe `is_`, `mode: 'boolean'` (D3).

**Chaînes Unicode** : normalisées en **NFC** avant écriture, et **mises en
minuscules par le code, jamais par la base** (D56).

> **Les longueurs ne se comptent pas pareil des deux côtés.** `length()`
> compte des **points de code**, `String.length` des **unités UTF-16** : Zod
> est donc plus strict aujourd'hui — ce qui cesserait avec `[...str].length`.

**Tailles** : en unités **binaires**. 25 Mio = 26 214 400 octets (D28).

---

## 3. Pièges du moteur SQLite

### 3.1 Pragmas

| Pragma | Portée | Rôle |
|---|---|---|
| `foreign_keys` | par connexion | Sans lui, clés étrangères et cascades inactives, **sans erreur** |
| `journal_mode = WAL` | persistant | Lectures possibles pendant une écriture |
| `busy_timeout` | par connexion | Une écriture concurrente attend au lieu d'échouer |

**Toute connexion applicative doit passer par `openDatabase()`.**

> **Exception : les migrations.** Ajouter un `CHECK` impose de reconstruire la
> table — ce qui concerne **la quasi-totalité de §10**.
>
> **`foreign_keys` doit être désactivé pendant la séquence, parce que le
> `DROP TABLE` déclenche les suppressions implicites, donc les `ON DELETE
> CASCADE` des enfants.** La variante qui renomme l'ancienne table de côté a
> un piège distinct : avec `legacy_alter_table = OFF`, le `RENAME` réécrit les
> clauses `REFERENCES` des enfants.
>
> - **`PRAGMA foreign_keys` est sans effet dans une transaction** : il se pose
>   à l'ouverture de la connexion de migration ;
> - **`PRAGMA foreign_key_check` ne lève pas d'erreur** : il renvoie une ligne
>   par violation, et le script vérifie qu'il en retourne **zéro**.

### 3.2 Un seul écrivain

**SQLite est mono-écrivain par conception** : une écriture verrouille le
**fichier**. C'est vrai avec ou sans WAL. Le mode WAL permet aux **lectures**
de se poursuivre pendant une écriture, et **ajoute** une contrainte : la
mémoire partagée `2stagram.db-shm` exige un système de fichiers **local**.

Les deux imposent **un seul conteneur backend**.

> Conséquences invoquées ailleurs : une transaction longue bloque toutes les
> écritures (§4.10) ; une écriture de masse est un incident (§4.3, D50) ; **un
> `TEXT` non borné est une écriture longue** (D61) ; le volume Docker contient
> les trois fichiers, la sauvegarde aucun (§6.4).

### 3.3 Le typage n'est pas appliqué

SQLite accepte `'abc'` dans une colonne `INTEGER`.

> **Pourquoi `STRICT` n'est pas retenu — la justification de la v2.9
> était fausse.** Il était écrit « Drizzle ne le supporte pas ». Or §3.1
> impose d'écrire les `CREATE TABLE` **à la main** dans les migrations, où
> `STRICT` ne coûterait qu'un mot-clé.
>
> La vraie raison est ailleurs : **les tables sont générées depuis
> `schema.ts`**, et `drizzle-kit` régénère sans le mot-clé. Un `STRICT` ajouté
> à la main disparaîtrait à la migration suivante, et la base divergerait de
> son schéma **en silence** — exactement ce que ce document cherche à éviter.
> Réserve honnête : `STRICT` n'aurait de toute façon pas remplacé les `CHECK`
> d'énumération, puisqu'il autorise les conversions sans perte.

La validation repose donc sur Zod et sur les `CHECK` de §10.

### 3.4 NULL et index uniques

Chaque `NULL` est **distinct de tous les autres**.

### 3.5 Index partiels : la clause doit être impliquée

**SQLite n'utilise un index partiel que si la clause `WHERE` de la requête
implique celle de l'index**, écrite **littéralement**. Vérifié par
`EXPLAIN QUERY PLAN` : omettre la clause, ou écrire
`COALESCE(deleted_at,'') = ''`, retombe sur un `SCAN` avec
`TEMP B-TREE FOR ORDER BY`.

Même piège pour un **index d'expression**.

### 3.6 Casse, jokers et normalisation

| Comparaison | Résultat |
|---|---|
| `'Kleiton' = 'kleiton'` | faux |
| `'Kleiton' GLOB 'kleiton'` | faux |
| `'Kleiton' LIKE 'kleiton'` | **vrai** |

> **`_` est un joker dans `LIKE`.** `ck_users_username` utilise `GLOB` pour
> cette raison, et `'%_@_%._%'` accepte `a@@b.c` sans la condition ajoutée en
> v2.8.

> **`lower()` ne replie que l'ASCII — et c'est plus subtil qu'il n'y paraît**
> (D56). Un prédicat `x = lower(x)` refuse toute chaîne contenant **au moins
> une majuscule ASCII**, et accepte celles dont les majuscules sont **toutes**
> non-ASCII. `ÉTÉ` est refusé — son `T` est ASCII — mais `Été` et `École`
> passent. Deux contraintes en dépendent : `ck_hashtags_name` (§4.12) et
> `ck_users_email` (§4.3).

### 3.7 Format des dates

Le point passe avant le `Z` en ASCII, donc le tri casse quand les secondes
sont égales :

```
2026-09-11T14:30:00.500Z   ← classé en premier
2026-09-11T14:30:00Z       ← pourtant antérieur
```

**Toute colonne `_at` porte un `CHECK` de forme** — 35 colonnes, §10.2. Le
point est **littéral** en `GLOB`, donc `…00X500Z` est bien refusé.

> **La forme, jamais les valeurs.** `2026-13-45T99:99:99.999Z` passe le
> motif : un mois 13 et une heure 99 sont acceptés. **Risque assumé** — une
> date impossible se trie correctement et ne casse rien — mais à ne pas
> présenter comme une validation de date. C'est `toISOString()` qui la
> garantit.

### 3.8 Un CHECK n'a pas de portée temporelle

| Contrainte | Opération qui aurait échoué |
|---|---|
| `ck_users_contact` | Anonymisation, qui vide mail et téléphone (D52) |
| `ck_comments_body` | Suppression logique, qui vide le texte (D30-a) |
| `ck_reports_target` | Retrait du lien vers la cible (D31) |

> **C'est aussi ce qui autorise les équivalences strictes** de
> `ck_user_sanctions_lifted` et `ck_posts_deleted_by` : sûres **parce que les
> colonnes sont en `NO ACTION`** (§5.2).

### 3.9 Index sur les clés étrangères

Trois suppressions réelles périodiques subsistent : signalements traités
(D35), notifications lues (D41), réservations expirées (D23). **C'est pour
elles que l'audit `ON DELETE` doit couvrir toutes les FK** (D62).

---

## 4. Tables

### 4.1 `sessions`

| Colonne | Type | Rôle |
|---|---|---|
| `sid` | `TEXT` PK NN | Identifiant généré par la bibliothèque |
| `data` | `TEXT` NN | Session sérialisée : cookie, `userId`, `role` |
| `expires_at` | `TEXT` NN | Date d'expiration |

| Index et contraintes | Rôle |
|---|---|
| `idx_sessions_expires_at` | Accélère `purgeExpired()` |
| `idx_sessions_user_id` | Index d'expression — **[à livrer]** |
| `ck_sessions_expires_at_format` | Format de date — **[à livrer]** |

**Pas de clé étrangère vers `users`** : l'`userId` est dans le blob JSON.
**C'est la raison technique du choix `express-session` plutôt que JWT.**

#### L'index d'expression a deux conditions, pas une

1. **L'expression doit être écrite à l'identique** :
   `json_extract(data, '$.userId')`, caractère pour caractère (§3.5) ;
2. **le type de la valeur doit correspondre.** `json_extract` renvoie un
   **`INTEGER`** si le JSON porte un nombre, un **`TEXT`** s'il porte une
   chaîne. Si le Store sérialise `userId` en chaîne et que la purge lie un
   entier, la comparaison échoue **en silence** : index parfaitement utilisé,
   zéro ligne trouvée, **sessions non purgées**. Un test
   `EXPLAIN QUERY PLAN` ne verrait rien, le plan étant correct.

D'où un test qui porte sur le **résultat** : après purge, il ne doit
rester **aucune** session pour ce compte.

Il dépend aussi de l'extension **JSON1**, active par défaut, à vérifier au
démarrage, et du format du blob : changer la forme de la session invaliderait
l'index sans bruit.

#### La purge dans la transaction — **[D64]**

La v2.9 imposait d'appeler `destroyByUserId()` **dans** la transaction
d'anonymisation. **Ce n'était pas implémentable** : `db.transaction()` de
`better-sqlite3` est **synchrone** et n'accepte aucun `await`, alors que
l'interface `Store` d'express-session est à callbacks.

Le store étant bâti sur `better-sqlite3`, lui-même synchrone, **la purge doit
être exposée par une méthode synchrone adossée à la même instance
`Database`** — par exemple `destroyByUserIdSync(userId)`. C'est elle
qu'appelle la transaction ; la méthode à callback reste nécessaire au contrat
d'express-session.

> Si ce point devait être relâché, §4.1 le permet : **la purge est une
> optimisation, la vérification est la garantie.** Mais le choix doit alors
> être écrit ici, pas laissé implicite.

#### Le compte est revérifié à chaque requête authentifiée

**[D13]** Le rôle est relu en base sur toute route exigeant un rôle autre que
`user` ; la copie en session ne sert qu'à l'affichage. **L'état du compte est
vérifié sur *toutes* les routes authentifiées** (§10.6). Zéro ligne → session
détruite, requête refusée.

> **`expires_at` est `NOT NULL`, pas `session.cookie.expires`.** Un cookie
> sans échéance vaut `null` : le Store fabrique une échéance de repli.

---

### 4.2 `password_reset_tokens`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `user_id` | `INTEGER` FK NN | Compte concerné |
| `token_hash` | `TEXT` NN | **Hash SHA-256** du token |
| `expires_at` | `TEXT` NN | Expiration : **10 minutes** — **[récap]** |
| `used_at` | `TEXT` | `NULL` tant que non utilisé |
| `created_at` | `TEXT` NN | Date d'émission |

| Index et contraintes | Rôle |
|---|---|
| `uq_password_reset_tokens_token_hash` | Un token n'existe qu'une fois |
| `idx_password_reset_tokens_user_id`, `_expires_at` | Recherche, purge |
| `ck_password_reset_tokens_*_format` | Trois dates — **[à livrer]** |

**Le token en clair n'est jamais stocké.** **[récap]** Le lien part sur ce qui
est renseigné ; si les deux le sont, l'utilisateur choisit. Réinitialiser
déconnecte toutes les sessions.

> **C'est cette fonctionnalité qui justifie D52**, et que **D56** protège : un
> doublon de compte sur une même boîte enverrait le lien au mauvais.

---

### 4.3 `users`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant interne |
| `username` | `TEXT` NN | Pseudo public. **Casse conservée** |
| `email` | `TEXT` | Contact et connexion, **en minuscules** |
| `phone` | `TEXT` | Contact et connexion, E.164 |
| `password_hash` | `TEXT` NN | Chaîne PHC argon2id, **sel inclus** |
| `bio` | `TEXT` | 500 caractères maximum |
| `avatar_path` | `TEXT` | Chemin, 512 caractères maximum — **[D61]** |
| `role` | `TEXT` NN | `user`, `moderator` ou `admin` |
| `post_visibility` | `TEXT` NN | **Visibilité de tout ce qu'il publie**. Défaut `public` |
| `group_invite_policy` | `TEXT` NN | Qui peut m'ajouter à un groupe |
| `deleted_at` | `TEXT` | Date d'anonymisation |
| `created_at` | `TEXT` NN | Date d'inscription |

| Index et contraintes | Rôle |
|---|---|
| `uq_users_username` | `COLLATE NOCASE`. **Non partiel** |
| `uq_users_email`, `uq_users_phone` | Partiels |
| `ck_users_username` | Longueur, jeu, **au moins une lettre**, préfixe réservé |
| `ck_users_email` | Casse **ASCII**, longueur, forme, un seul `@` |
| `ck_users_phone` | Format E.164 |
| `ck_users_contact` | **Un mail ou un téléphone**, sauf compte anonymisé — **[D52]** |
| `ck_users_bio`, `ck_users_avatar_path` | Longueurs — **[D61]** |
| `ck_users_role`, `_post_visibility`, `_group_invite_policy` | Énumérations |
| `ck_users_*_format` | Deux dates |

*(Tout est `[à livrer]` ; SQL en §10.)*

#### Le contact obligatoire — **[D52]**

La contrainte s'appelait `ck_users_identifier` et prétendait garantir « au
moins un identifiant de connexion ». **Elle ne le faisait pas** : le pseudo en
est un, et il est `NOT NULL`. Ce qu'elle impose, c'est **un moyen de contact
en plus du pseudo** — parce que la réinitialisation du mot de passe a besoin
d'un canal (§4.2).

`deleted_at` et les identifiants sont écrits **dans le même `UPDATE`** (§3.8).

#### Le pseudo — **[D2]** **[D12]** **[D55]**

3 à 30 caractères, lettres, chiffres et tiret bas ; **au moins une lettre**,
donc jamais entièrement numérique ; préfixe `deleted_user_` réservé aux
comptes anonymisés. Casse conservée, unicité `NOCASE`.

#### L'adresse mail — **[D56]**

Le `CHECK` vérifie la casse, la longueur, l'unicité du `@` et l'absence
d'espace. **Trois limites, toutes assumées :**

| Limite | Détail |
|---|---|
| **La casse n'est garantie que sur l'ASCII** | `email = lower(email)` **accepte `École@test.fr`** : aucune majuscule ASCII à replier (§3.6) |
| La forme est grossière | `a@b..c` passe. Une expression régulière stricte en base rejetterait des adresses valides, et ne se corrige pas sans reconstruire la table |
| **L'espace n'est que l'espace** | `NOT GLOB '* *'` ne voit ni tabulation, ni retour ligne, ni espace insécable |

**La conséquence de la première est la plus sérieuse.** `uq_users_email` est
un index **binaire** : `École@test.fr` et `école@test.fr` sont **deux comptes
distincts pour une seule boîte réelle**. L'utilisateur qui demande une
réinitialisation la reçoit pour un compte qu'il ne croit pas avoir créé.

**La garantie repose donc entièrement sur le `.normalize('NFC').toLowerCase()`
de Zod, appelé à l'inscription *et* au changement d'adresse** (§8). C'est le
même défaut, la même parade et la même exigence de test que pour les hashtags
(§4.12) — d'où une décision unique, D56.

#### Le téléphone — **[D12]**

Converti en **E.164**, **pays par défaut France**. Le `CHECK` impose un `+`
puis des chiffres, sur 8 à 16 caractères — borne basse valable pour la France,
à revoir si le périmètre s'ouvre.

#### Connexion à trois identifiants — **[D12]**

`username` en `NOCASE` → sinon `email` si la saisie contient `@` → sinon E.164
puis `phone`. **Aucune collision** : un numéro commence par `+`, interdit dans
un pseudo, et un pseudo contient au moins une lettre.

#### Pourquoi la visibilité est dérivée — **[D50]**

**La visibilité n'est stockée qu'à un seul endroit** : `users.post_visibility`.
Elle n'est jamais recopiée sur chaque publication, et jamais mise à jour en
masse. Voici pourquoi.

**Un compte à un million de publications bascule de `public` à `friends` :**

| | Modèle dérivé (retenu) | Modèle matérialisé |
|---|---|---|
| Écritures | **1 ligne** | **1 000 000** |
| Durée | microsecondes | secondes à minutes |
| Verrou | imperceptible | **exclusif** : plus personne ne publie ni n'écrit (§3.2) |
| `busy_timeout` | sans objet | dépassé → **erreurs visibles** |
| WAL | inchangé | gonfle d'un million de pages |
| `version` | inchangée | **un million d'incréments** |
| Clients | voir D58 | **tout ETag obsolète** → 412 au prochain `PATCH` |
| Reprise sur panne | atomique | à rejouer |

**Le coût du modèle dérivé** est double, et la v2.9 n'en voyait qu'un :

1. **une jointure vers `users`** à la lecture, déjà nécessaire pour
   `deleted_at` et le bannissement — négligeable ;*
2. **[D58] aucun ETag n'est invalidé alors qu'il devrait l'être** — voir
   ci-dessous. C'est le défaut symétrique de celui reproché au modèle
   matérialisé, et il est plus sournois.

Deux conséquences assumées : le changement est **rétroactif**, et les
**tendances** mettent un cycle à le refléter (§4.12).

#### ETag, cache et visibilité — **[D58]**

§4.6 pose que **changer `post_visibility` n'incrémente pas `version`** : la
visibilité n'appartient pas au post. Correct sur le fond, mais si `version`
sert seule d'ETag, la fuite de §7 se rouvre un étage plus haut :

```
1. Le compte de A est public. Le lecteur C met le post 12 en cache (ETag v3).
2. A bascule en « amis ». C n'est pas ami de A.
3. C revient : If-None-Match: v3 → version vaut toujours 3
   → 304 Not Modified → le client réaffiche un contenu devenu privé.
```

**La règle retenue : le contrôle d'accès passe avant la comparaison
d'ETag.** Une requête conditionnelle est d'abord une requête : le serveur
évalue `postVisible()` (§6.3), et un lecteur qui n'a plus accès reçoit **404**
— jamais 304, quel que soit son ETag. Ce n'est qu'ensuite que `version` est
comparée.

S'y ajoute **`Cache-Control: private, no-cache`** sur toute représentation
dépendant de la visibilité : `private` interdit à un cache partagé de la
stocker, `no-cache` impose la revalidation — donc le passage par le contrôle
ci-dessus.

> **L'alternative écartée** était de faire entrer `post_visibility` de
> l'auteur dans le calcul de l'ETag. Elle fonctionne, mais l'ETag cesserait
> d'être `posts.version`, ce qui complique le `If-Match` de l'écriture (§4.6)
> sans rien apporter que le contrôle d'accès ne donne déjà.

> **Ce n'est pas un argument pour matérialiser** : D50 reste le bon choix. Un
> ETag mal invalidé se corrige dans la couche HTTP ; un verrou d'écriture d'
> une minute ne se corrige nulle part.

#### Suppression du compte — **[D4]** **[D14]** **[D64]**

L'`UPDATE` d'anonymisation (§10.6) s'accompagne, **dans la même
transaction** : amitiés, blocages des deux sens, tokens, réactions,
`saved_posts` ; **purge des sessions par `destroyByUserIdSync()`** ; avatar
journalisé en `orphaned` ; `target_snapshot` vidé sur les signalements
traités ; puis les contenus (§5).

**[D14]** `deleted_at IS NULL` est vérifié au login et à chaque requête
authentifiée.

---

### 4.4 `user_sanctions`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `user_id` | `INTEGER` FK NN | Utilisateur sanctionné |
| `moderator_id` | `INTEGER` FK NN | Qui a prononcé |
| `sanction_type` | `TEXT` NN | `warning` ou `ban` |
| `reason` | `TEXT` NN | Motif **libre**, 200 caractères — **[D61]** |
| `details` | `TEXT` | 2000 caractères — **[D61]** |
| `lifted_at` | `TEXT` | Date de levée. `NULL` tant que la sanction est active |
| `lifted_by_id` | `INTEGER` FK | Qui a levé — modérateur ou administrateur |
| `created_at` | `TEXT` NN | Date de prise d'effet |

| Index et contraintes | Rôle |
|---|---|
| `idx_user_sanctions_user_id` | Recherche de la sanction active |
| `ck_user_sanctions_sanction_type` | Énumération |
| `ck_user_sanctions_lifted` | `(lifted_at IS NULL) = (lifted_by_id IS NULL)` |
| `ck_user_sanctions_self`, `_reason`, `_details`, `_*_format` | — |

#### Le bannissement est réversible — **[D24]**

**Un modérateur ou un administrateur peut lever un bannissement**, comme il
peut annuler un avertissement prononcé par erreur. `lifted_at` et
`lifted_by_id` valent donc pour les deux types de sanction, et la contrainte
`ck_user_sanctions_lifted_type`, qui interdisait de lever un `ban`, est
**supprimée**.

> **Cela vaut pour les deux rôles**, comme partout ailleurs en modération :
> `accesModeration()` (§4.15) accorde l'accès à `moderator` **et** `admin`.
> Seule la promotion en modérateur reste réservée à l'administrateur (§4.3).

**Une sanction réversible ne détruit rien.** C'est ce qui décide du sort des
contenus :

| Contenu d'un compte banni | Traitement |
|---|---|
| Publications | **masquées** tant que la sanction est active |
| Commentaires, messages | conservés et masqués de la même façon |
| Profil public | « compte inexistant » |

Le masquage **n'est pas un mécanisme nouveau** : `postVisible()` exclut déjà
les contenus d'un auteur banni (§6.3). Lever la sanction les fait donc
réapparaître sans aucune opération de restauration.

> **Pourquoi pas la suppression.** Une version antérieure supprimait les
> publications d'un compte banni. Avec D30, « supprimé » signifie texte vidé,
> ligne `media` effacée et **fichier détruit sur le disque** : un
> bannissement prononcé par erreur, ou levé après appel, aurait anéanti
> définitivement le contenu de la personne. Une sanction qu'on peut lever ne
> peut pas s'appuyer sur un geste irréversible.
>
> Le masquage n'a par ailleurs aucun coût : le filtre passe par la jointure
> vers `users` que `postVisible()` fait déjà pour `post_visibility` et
> `deleted_at`.

**Seule une sanction active bloque.** La vérification au login, et celle de
chaque requête authentifiée (§10.6), portent donc sur `lifted_at IS NULL` :
sans cette condition, un compte débanni resterait verrouillé.

**Sans cette table, supprimer les sessions d'un compte le déconnecterait
sans l'empêcher de se reconnecter** : la sanction doit être une ligne
consultable, pas l'absence de session.

---

### 4.5 `blocks` — **[D48]** **[D54]** **[D60]**

| Colonne | Type | Rôle |
|---|---|---|
| `blocker_id` | `INTEGER` PK FK NN | Qui a bloqué |
| `blocked_id` | `INTEGER` PK FK NN | Qui est bloqué |
| `created_at` | `TEXT` NN | Date |

| Index et contraintes | Rôle |
|---|---|
| `pk_blocks` | Clé composite |
| `idx_blocks_blocked_id` | **Indispensable** : la lecture est symétrique |
| `ck_blocks_self`, `ck_blocks_created_at_format` | — |

#### Bidirectionnel — **[D48]**

| | A ↔ B |
|---|---|
| Profil, publications, commentaires, réactions | **invisibles des deux côtés** |
| Recherche | chacun disparaît des résultats de l'autre |
| **Conversation privée** : ouvrir, envoyer | **impossible des deux côtés** |
| Messages privés antérieurs | « message indisponible » pour les deux |
| Demande d'ami | impossible |
| Liker, commenter, repartager, enregistrer | impossible |
| Notification | jamais créée, dans aucun sens |

#### Les groupes, et le contournement par un tiers — **[D54]** **[D60]**

Les interdictions portent sur la **relation directe**. Une conversation de
groupe appartient à ses membres, pas à la paire :

| En groupe où A et B sont membres | |
|---|---|
| Rester membre, lire, écrire | **oui, pour les deux** |
| Voir les messages de l'autre | **non** : « message indisponible », des deux côtés |
| Ce que voient les autres | **tout, normalement** |

**[D60] Trois règles d'ajout, et non plus une.** La v2.9 n'interdisait que
l'ajout direct, ce qui laissait un contournement complet : **C pouvait ajouter
B à un groupe où A était déjà**, après le blocage. Pour une fonction dont la
raison d'être est le harcèlement, c'était le scénario à fermer.

| Règle | Portée |
|---|---|
| A ne peut pas ajouter B, ni B ajouter A | relation directe (v2.9) |
| **Personne ne peut ajouter quelqu'un à un groupe où se trouve une personne avec qui il a un blocage**, dans un sens ou l'autre | **nouveau** — ferme le contournement |
| Une adhésion **antérieure** au blocage n'est pas rompue | bloquer n'expulse pas d'un groupe où des tiers ont invité |

La troisième règle laisse subsister le cas des groupes déjà partagés : la
sortie est **« quitter le groupe »**, qui doit rester accessible en un geste.

> **La ligne reste asymétrique, la lecture est symétrique** : la table
> enregistre **qui** a bloqué — information de modération — mais `estBloque()`
> teste les deux ordres (§10.6), d'où l'index sur `blocked_id`.

**Deux effets à connaître :**

- **Les compteurs restent globaux** : un like déposé avant le blocage continue
  d'être compté.
- **Signaler devient impossible après coup**, dans les deux sens : ne voyant
  plus le contenu, aucun des deux ne peut le signaler. D'où le conseil
  « signaler avant de bloquer ».

> **Ce que le blocage ne couvre pas, et n'a pas à couvrir.** Dans un groupe
> partagé, B peut continuer d'écrire *sur* A sans que A le voie. Ce n'est pas
> une faille du blocage : celui-ci coupe la **relation** entre deux personnes,
> pas ce qui se dit ailleurs. Ce qui circule dans le groupe relève de la
> modération du groupe, et les autres membres — qui, eux, voient les
> messages — peuvent **signaler le profil de B** (`target_type = 'user'`).
> A n'a pas à être ce canal, précisément parce qu'il s'est retiré de la
> relation. Sa sortie reste **« quitter le groupe »**, accessible en un geste.

---

### 4.6 `posts`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `user_id` | `INTEGER` FK NN | Auteur |
| `caption` | `TEXT` | Description, **1 à 2200 caractères** |
| `source_post_id` | `INTEGER` FK | Le post effectivement repartagé |
| `root_post_id` | `INTEGER` FK | **Racine de la chaîne** |
| `version` | `INTEGER` NN | Compteur d'ETag. Défaut 1 |
| `published_at` | `TEXT` NN | **Date de publication** |
| `updated_at` | `TEXT` | Dernière modification |
| `deleted_at` | `TEXT` | Suppression logique |
| `deleted_by_id` | `INTEGER` FK | **Toujours renseigné si `deleted_at` l'est** |

> **Pourquoi `published_at` et non `created_at`** : c'est la seule table dont
> la date porte une notion **métier** — affichée, triée, paginée, filtrée par
> les tendances. Ailleurs, `created_at` note une création technique.

> **`caption` est alignée sur `comments.body`** : la chaîne vide était
> acceptée d'un côté, refusée de l'autre, alors qu'elle n'a de sens ni l'un ni
> l'autre — `NULL` dit « pas de description » (repartage nu). Zod applique un
> `trim()` avant validation.

| Index et contraintes | Rôle |
|---|---|
| `idx_posts_published_at_id` | Fil global, **partiel** |
| `idx_posts_user_id_published_at_id` | Fil d'un profil, **partiel** |
| `idx_posts_source_post_id`, `idx_posts_root_post_id` | Repartages, compteur |
| `uq_posts_user_id_source_post_id` | Partiel — **[D7]** |
| `ck_posts_source_post_id`, `ck_posts_root`, `ck_posts_deleted_by` | Cohérence |
| `ck_posts_caption`, `ck_posts_version`, `ck_posts_*_format` | Formats |

#### Les deux index du fil — **[D46]**

Même usage, mêmes lignes, donc **partiels sur `deleted_at IS NULL`** et
**terminés par `id`**. **Toute requête de fil écrit la clause
littéralement** (§3.5).

#### Qui a supprimé — **[D32]** **[D45]**

`deleted_by_id` est **toujours renseigné**. « Retiré par la modération » se
déduit de `deleted_by_id <> user_id`, déduction valable parce que **seuls
l'auteur et un modérateur peuvent supprimer**.

> **Un bannissement ne renseigne rien ici** : il masque les contenus au lieu
> de les supprimer (D24). Seule une décision portant explicitement sur un
> contenu écrit dans cette colonne (§4.15).

#### `version` — concurrence et cache

```sql
UPDATE posts SET caption = ?, version = version + 1, updated_at = ?
WHERE id = ? AND version = ? AND deleted_at IS NULL;
```

**`deleted_at IS NULL` n'est pas optionnel** : la ligne survit à la
suppression avec sa `version`. `changes = 0` impose de relire pour distinguer
**404** de **412**.

**Trois actions incrémentent `version`** : changer le média, retoucher,
modifier la description. **Changer `post_visibility` n'en fait pas partie** —
et c'est précisément pourquoi **D58** impose que le contrôle d'accès précède
la comparaison d'ETag (§4.3).

> **[D38] Modifier une description re-synchronise les hashtags**, dans la même
> transaction, **pour les publications originales seulement**.

#### Le média — **[D19]**

Original : **exactement 1**. Repartage : **aucun**. Règles applicatives,
portant sur les publications **actives**.

#### Le repartage : cadre et contenu — **[D18]** **[D33]** **[D53]**

```
id | user_id | caption            | source_post_id | root_post_id
---+---------+--------------------+----------------+--------------
12 |    A    | Mon chat au soleil | NULL           | NULL
19 |    B    | date ?;djshs       | 12             | 12
25 |    C    | NULL               | 19             | 12
```

| Objet | Ce que c'est | Qui en gouverne la visibilité |
|---|---|---|
| **Le cadre** | La ligne `posts` du repartage | **Son auteur** (D20) |
| **Le contenu** | Le média et la description de la **racine** | **L'auteur de la racine** (D8) |

B, compte en `friends`, repartage un post **public** de A :

| Lecteur | Cadre | Contenu | Résultat |
|---|---|---|---|
| Ami de B, ami de A | oui | oui | tout |
| Ami de B, **pas** ami de A | oui | oui — le post de A est public | tout |
| **Pas** ami de B | **non** | sans objet | le repartage n'apparaît pas |

Si A bascule ensuite en `friends`, la deuxième ligne devient « cadre + contenu
indisponible ». **Aucune fuite**, **aucune contradiction avec D20**.

**Chaînes réelles, profondeur illimitée** ; chaque maillon est à son tour un
cadre soumis à la visibilité de son auteur (D33). `root_post_id` est
renseignée une fois et jamais modifiée.

**Les contrôles à la création portent sur chaque maillon** : « uniquement les
publications publiques » et « pas sa propre publication » — le contrôle sur la
seule racine laissait passer le cas indirect.

---

### 4.7 `media`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `post_id` | `INTEGER` FK NN | Post porteur. **Unique** |
| `media_type`, `file_format` | `TEXT` NN | Type et extension |
| `sanitized_path` | `TEXT` NN | **Version de référence, assainie** — 512 car. |
| `display_path` | `TEXT` NN | Version retouchée, = `sanitized_path` si intacte |
| `transform_params` | `TEXT` | Paramètres, 2000 caractères — **[D61]** |
| `size_bytes` | `INTEGER` NN | **25 Mio maximum** |
| `width` / `height` | `INTEGER` | **Strictement positifs** — **[D61]** |
| `duration_seconds` | `INTEGER` | Réservée aux vidéos |
| `created_at` | `TEXT` NN | Date d'ajout |

| Index et contraintes | Rôle |
|---|---|
| `uq_media_post_id` | Un seul média par post |
| `ck_media_media_type`, `ck_media_file_format` | Énumérations |
| `ck_media_type_format` | **Cohérence** type / format — §10.3 |
| `ck_media_size_bytes`, `ck_media_duration_seconds` | Bornes |
| **`ck_media_dimensions`** | `width` et `height` renseignés ensemble et positifs — **[D61]** |
| `ck_media_*_path`, `ck_media_created_at_format` | Longueurs, date |

> `width` et `height` acceptaient `0`, `-1` ou une chaîne, alors que
> `size_bytes` et `duration_seconds` étaient bornés. Le principe affiché est
> « la base refuse ce que le code oublie » : une ligne de plus le tient.

| Catégorie | `media_type` | Formats |
|---|---|---|
| Images | `photo` | `jpg`, `jpeg`, `png`, `webp`, `gif`, `svg` |
| Vidéos | `video` | `mp4`, `webm` |

**Le format réel est vérifié à la réception**, la taille **avant et après
traitement**, et la valeur est définie **à un seul endroit du code**.

> **Le SVG est retenu, avec trois protections obligatoires** : assainissement
> avant stockage, CSP sur la route média, détection spécifique.

#### Chaîne d'assainissement — **[D9]** **[D29]** **[D43]**

| Type | Traitement |
|---|---|
| Image bitmap | Ré-encodage sharp, **EXIF supprimé** |
| SVG | Assainissement, **métadonnées XML supprimées** |
| Vidéo | **exiftool en remux**, sans recompression |

Elle s'applique aux **médias, aux pièces jointes et aux avatars**. L'upload
brut est supprimé après traitement.

#### Filtres et retouche — **[D44]**

Bitmap uniquement. **Chaque nouveau rendu rend le précédent orphelin**.
**Effacement** : un seul fichier si les deux chemins sont identiques, et
l'`unlink` **tolère `ENOENT`**.

---

### 4.8 `saved_posts`

| Colonne | Type | Rôle |
|---|---|---|
| `user_id` | `INTEGER` PK FK NN | Qui enregistre |
| `post_id` | `INTEGER` PK FK NN | Publication enregistrée |
| `saved_at` | `TEXT` NN | Date |

`pk_saved_posts`, `idx_saved_posts_user_id_saved_at`,
`ck_saved_posts_saved_at_format`.

**[récap] L'onglet vérifie les droits à chaque affichage.**

---

### 4.9 `comments`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `post_id` | `INTEGER` FK NN | Post commenté |
| `user_id` | `INTEGER` FK NN | Auteur |
| `parent_comment_id` | `INTEGER` FK | **Une racine du même post** — **[D42]** |
| `body` | `TEXT` | Texte. **Nullable**, 1 à 2200 caractères |
| `created_at` | `TEXT` NN | Date |
| `updated_at`, `deleted_at` | `TEXT` | Modification, suppression |
| `deleted_by_id` | `INTEGER` FK | Qui a supprimé |

`idx_comments_post_id_created_at`, `idx_comments_user_id`,
`idx_comments_parent_comment_id`, `ck_comments_body`,
`ck_comments_parent_comment_id`, `ck_comments_deleted_by`, trois `_format`.

**[D42] Deux niveaux, sans imbrication.** Le parent enregistré est toujours
une racine **du même `post_id`**. Aucune des deux règles n'est exprimable en
base.

> **Répondre à une réponse reste possible côté interface.** Le bouton existe
> sous chaque message, y compris sous une réponse. Le serveur **remonte alors
> à la racine** : si le `parent_comment_id` reçu désigne lui-même une réponse,
> il est remplacé par le parent de celle-ci. Le client n'a donc rien à
> calculer, et une mention `@pseudo` préremplie dans le corps indique à qui la
> réponse s'adresse — c'est du texte, pas une colonne.
>
> | Contrôle | Nature | Sinon |
> |---|---|---|
> | Le parent désigne une réponse | **Normalisation** : on prend sa racine | — |
> | Le parent appartient à un autre `post_id` | **Refus** | **422** |
>
> Le second reste un refus et non une correction : greffer une réponse sur le
> commentaire d'une autre publication révèle l'existence d'un commentaire sur
> une publication privée.

**[D45] L'auteur du commentaire, ou un modérateur. Personne d'autre** — en
particulier pas l'auteur de la publication.

**[D30-a]** À la suppression, `body` passe à `NULL` et les
`comment_reactions` sont effacées. Les réponses survivent.

> **[D34] Quand un post est supprimé par son auteur, ses commentaires gardent
> leur texte** ; ils ne sont vidés que sur suppression par la **modération**.
> **Conséquence : toute lecture de commentaires joint `posts` et filtre
> `p.deleted_at IS NULL`.**

---

### 4.10 Idempotence et nettoyage

#### `idempotency_reservations` — **[D23]**

| Colonne | Type | Rôle |
|---|---|---|
| `user_id` | `INTEGER` PK FK NN | Propriétaire |
| `key` | `TEXT` PK NN | `Idempotency-Key`, 1 à 128 caractères |
| `request_hash` | `TEXT` NN | SHA-256 |
| `post_id` | `INTEGER` FK | Post créé. `NULL` tant que la réservation est en cours |
| `created_at` | `TEXT` NN | **Immuable** |
| `heartbeat_at` | `TEXT` NN | **Preuve de vie** |
| `expires_at` | `TEXT` NN | 24 h après `created_at`. **Immuable** |

**Quatre écritures, toutes conditionnelles** (§10.6) :

1. **Le heartbeat est conditionnel** sur sa valeur précédente : sinon celui
   d'une requête **déjà dépossédée** écraserait la valeur du repreneur. Si
   `changes` vaut 0, la requête s'arrête **là**
2. **Il remonte la valeur qu'il vient d'écrire** ; la relire à la conclusion
   rouvrirait la course
3. **Il est arrêté avant l'écriture finale**, qui compare à cette valeur :
   sinon un heartbeat glissé entre la lecture et l'`UPDATE` ferait **annuler
   sa propre transaction au propriétaire légitime**
4. **Abandon à 30 secondes, heartbeat toutes les 10** : deux ratés de marge

> **Le heartbeat commite dans sa propre transaction** : il ne peut pas vivre
> dans celle qui crée le post. **Celle-ci n'est ouverte qu'une fois le fichier
> traité** (§3.2).

**Purge** : une réservation **vivante n'est jamais purgée**, même expirée
(§10.6).

#### `media_staging` — **[D22]** **[D44]**

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `file_path` | `TEXT` NN | Chemin. Unique, 512 caractères |
| `state` | `TEXT` NN | `staged` ou `orphaned` |
| `created_at` | `TEXT` NN | Date |

**Portée** : médias, pièces jointes, avatars, **et rendus retouchés
remplacés**.

1. Inscription en `staged` **avant** l'écriture physique
2. Au rattachement, la ligne est **supprimée dans la même transaction**
3. À la suppression ou au remplacement, le chemin est **réinséré** en
   `orphaned` (§10.6)
4. Le fichier est effacé après le commit : **optimisation, pas garantie**

| État | Critère | Action du balayeur |
|---|---|---|
| `staged` | plus d'une heure | Effacer le fichier, puis la ligne |
| `orphaned` | quel que soit l'âge | Effacer le fichier s'il existe, puis la ligne |

> **Les deux `unlink` tolèrent `ENOENT`.**

---

### 4.11 `post_reactions` et `comment_reactions` — **[D63]**

| Colonne | Type | Rôle |
|---|---|---|
| `user_id` | `INTEGER` **PK** FK NN | Qui réagit |
| `post_id` / `comment_id` | `INTEGER` **PK** FK NN | À quoi |
| `reaction_type` | `TEXT` NN | `like` ou `dislike` |
| `created_at` | `TEXT` NN | Date du **premier** vote |

| Index et contraintes | Rôle |
|---|---|
| `pk_post_reactions` | **Clé composite** — remplace `id` et l'ancien `uq_` — **[D63]** |
| `idx_post_reactions_post_id` | Compter les réactions |
| `ck_post_reactions_reaction_type`, `_created_at_format` | — |

L'upsert de D26 est inchangé : le `ON CONFLICT (user_id, post_id)` vise
désormais la clé primaire. `created_at` n'est **pas** écrasé ; retirer son
vote reste un `DELETE`.

> **Les compteurs doivent être `COALESCE`és.** `SUM(reaction_type =
> 'like')` sur un contenu **sans aucune réaction** renvoie `NULL`, pas `0` :
> le front recevrait `null` pour tout contenu neuf. La requête de référence
> (§10.6) applique `COALESCE(…, 0)` aux deux colonnes.

---

### 4.12 Hashtags et tendances

#### `hashtags` — **[D47]** **[D56]**

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `name` | `TEXT` NN | **Minuscules, NFC, sans le `#`**, 1 à 100 caractères |
| `created_at` | `TEXT` NN | Première apparition |

`uq_hashtags_name` (comparaison **exacte**), `ck_hashtags_name`,
`ck_hashtags_created_at_format`.

```ts
const name = raw.normalize('NFC').toLowerCase();
```

> **Le `CHECK` ne protège que l'ASCII, et pas dans le sens que la v2.9
> indiquait.** `name = lower(name)` refuse toute chaîne contenant **au moins
> une majuscule ASCII**, et accepte celles dont les majuscules sont **toutes**
> non-ASCII.
>
> | Saisie | `lower()` réel | `CHECK` | Effet |
> |---|---|---|---|
> | `VACANCES` | `vacances` | refuse | protégé |
> | `Paris`, `NOËL`, `Noël` | replie au moins une lettre | refuse | protégé |
> | `ÉTÉ` | `ÉtÉ` — **le `T` est ASCII** | refuse | protégé |
> | **`Été`** | `Été` | **accepte** | **doublon avec `été`** |
> | **`École`, `Ça`, `Île`** | inchangé | **accepte** | **doublon** |
>
> **Ce qui passe est donc le mot capitalisé ordinaire** — la forme la plus
> courante d'un hashtag français — et non le cas rare des capitales
> accentuées. La v2.9 décrivait l'inverse, et son test l'affirmait : les deux
> sont refaits.
>
> **La normalisation applicative est la seule protection réelle** (D56). Elle
> est encapsulée dans une fonction unique, partagée avec l'adresse mail
> (§4.3), et testée pour elle-même.
>
> **L'alternative écartée** : restreindre le jeu par
> `name NOT GLOB '*[^a-z0-9_]*'` donnerait une garantie en base, mais
> interdirait `#été` tout court — inacceptable pour une application
> française. Sans extension ICU, SQLite ne sait pas faire mieux.

#### `post_hashtags`

| Colonne | Type | Rôle |
|---|---|---|
| `post_id` | `INTEGER` PK FK NN | Post |
| `hashtag_id` | `INTEGER` PK FK NN | Hashtag |

`idx_post_hashtags_hashtag_id` est **indispensable**. **[D38]**
Re-synchronisée à chaque modification de description, **originaux seulement**.

#### `hashtag_trends`

| Colonne | Type | Rôle |
|---|---|---|
| `hashtag_id` | `INTEGER` PK FK NN | Hashtag |
| `period` | `TEXT` PK NN | **`7d`** |
| `post_count` | `INTEGER` NN | Positif ou nul |
| `computed_at` | `TEXT` NN | Date du calcul |

Le recalcul (§10.6) **tient dans une transaction**, ouverte par
`db.transaction()`, **jamais par un `BEGIN` préparé**.

> **C'est ici que se paie le modèle dérivé (D50)** : une bascule sort des
> tendances **au recalcul suivant**.

---

### 4.13 `friendships` — **[D37]** **[D49]**

| Colonne | Type | Rôle |
|---|---|---|
| `low_user_id` | `INTEGER` PK FK NN | Le plus **petit** identifiant |
| `high_user_id` | `INTEGER` PK FK NN | Le plus **grand** |
| `requester_id` | `INTEGER` FK NN | Qui a envoyé la demande |
| `status` | `TEXT` NN | `pending` ou `accepted` |
| `requested_at` | `TEXT` NN | Date |

`pk_friendships`, `idx_friendships_high_user_id`, `ck_friendships_order`,
`ck_friendships_requester`, `ck_friendships_status`, un `_format`.

#### Trois états, six opérations — **[D49]**

| Opération | Précondition | Effet |
|---|---|---|
| Envoyer une demande | aucune ligne | `INSERT`, `pending` |
| Annuler | `pending`, on est le demandeur | **`DELETE`** |
| **Refuser** | `pending`, on est le destinataire | **`DELETE`** |
| Accepter | `pending`, on est le destinataire | `UPDATE status = 'accepted'` |
| **Supprimer un ami** | `accepted` | **`DELETE`** |
| Bloquer | n'importe lequel | **`DELETE`** (D48) |

**Refuser et supprimer un ami sont la même opération en base** : seule la
précondition diffère, et le backend doit la vérifier.

Trois conséquences assumées : un refus **ne laisse aucune trace** ; une
demande refusée **peut être renvoyée immédiatement**, le seul recours étant le
**blocage** ; aucun historique d'amitié n'existe.

#### Le problème de l'ordre

`(3,7)` et `(7,3)` disent la même chose : sans règle, une suppression
n'effacerait qu'une des deux lignes — **accès maintenu aux posts réservés aux
amis, sans erreur visible**.

```ts
const low = Math.min(idA, idB);
const high = Math.max(idA, idB);
```

`requester_id` conserve la direction : c'est lui qui dit qui peut annuler et
qui peut accepter.

---

### 4.14 Messagerie

#### `conversations`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `name` | `TEXT` | `NULL` pour une conversation à deux, **1 à 100 caractères** sinon — **[D61]** |
| `is_group` | `INTEGER` NN | 0 ou 1 |
| `created_by_id` | `INTEGER` FK NN | Créateur |
| `created_at` | `TEXT` NN | Date |

`ck_conversations_is_group`, `ck_conversations_name`, un `_format`.

> **Rien n'empêche deux conversations privées entre les mêmes personnes**, ni
> une conversation `is_group = 0` à trois membres : règles applicatives.

#### `conversation_members`

| Colonne | Type | Rôle |
|---|---|---|
| `conversation_id` | `INTEGER` PK FK NN | Conversation |
| `user_id` | `INTEGER` PK FK NN | Membre |
| `added_by_id` | `INTEGER` FK NN | Qui l'a ajouté |
| `added_at` | `TEXT` NN | Date d'ajout |
| `last_read_at` | `TEXT` | Dernier message lu |

`pk_conversation_members`, `idx_conversation_members_user_id`, deux `_format`.

**[D16]** Aucun compteur de non-lus n'est stocké (§10.6) ; le badge global est
la même requête **sans `GROUP BY`**.

> **[D60] L'ajout d'un membre est filtré** par les blocages présents dans le
> groupe (§4.5).

#### `messages`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `conversation_id` | `INTEGER` FK NN | Conversation |
| `author_id` | `INTEGER` FK NN | Expéditeur |
| `body` | `TEXT` | Texte. Facultatif, **1 à 5000 caractères** — **[D61]** |
| `sent_at` | `TEXT` NN | Date d'envoi |
| `deleted_at` | `TEXT` | Suppression logique |

`idx_messages_conversation_id_sent_at_id`, **`ck_messages_body`**, deux
`_format`.

> **`messages.body` n'avait aucune borne, et c'est la colonne où
> l'omission coûtait le plus.** §3.2 rappelle qu'une écriture longue tient le
> verrou d'écriture **de tout le moteur** : un message de plusieurs mébioctets
> aurait bloqué l'application entière, sans qu'aucune règle ne s'y oppose. La
> borne de 5000 caractères est un ordre de grandeur usuel pour un message
> privé — **confirmée le 27/09** — et l'absence de borne, elle, n'était pas
> défendable.

> **Pas de `deleted_by_id`, contrairement à `posts` et `comments`.** Un
> message n'est supprimable que par son auteur : il n'est pas signalable
> (§4.15), donc aucune modération ne s'y applique, et il n'y a qu'un acteur
> possible à tracer. La colonne ne deviendrait nécessaire que si le
> signalement des messages entrait un jour dans le périmètre — ce qui n'est
> pas prévu.

#### `message_attachments` — **[D10]** **[D36]** **[D43]**

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `message_id` | `INTEGER` FK NN | Message porteur. **Unique** |
| `media_type`, `file_format` | `TEXT` NN | Type et extension |
| `file_path` | `TEXT` NN | **Version assainie**, 512 caractères |
| `size_bytes` | `INTEGER` NN | **25 Mio maximum** |
| `width` / `height` / `duration_seconds` | `INTEGER` | Dimensions, durée |
| `created_at` | `TEXT` NN | Date |

`uq_message_attachments_message_id`, les deux énumérations,
`ck_message_attachments_type_format`, `_size_bytes`, `_dimensions`, un
`_format`.

**Pas de `deleted_at`** : la ligne disparaît avec le message.

---

### 4.15 `reports`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `reporter_id` | `INTEGER` FK NN | Qui signale |
| `target_type` | `TEXT` NN | `post`, `comment` ou `user` |
| `post_id` / `comment_id` / `reported_user_id` | `INTEGER` FK | Cible, **vidée à la suppression** |
| `target_snapshot` | `TEXT` | **Instantané JSON figé**, nullable |
| `reason` | `TEXT` NN | Motif fermé |
| `details` | `TEXT` | Obligatoire si `other`, 2000 caractères — **[D61]** |
| `status` | `TEXT` NN | `pending`, `resolved` ou `dismissed` |
| `moderator_id` | `INTEGER` FK | Qui a traité |
| **`reported_at`** | `TEXT` **NN** | Date du signalement |
| `resolved_at` | `TEXT` | Date de traitement |

> `reported_at` était déclarée sans `NN` en §4.15 et traitée comme
> obligatoire en §10.2. C'est la seconde lecture qui est juste :
> `ck_reports_resolution` la présuppose.

| Index et contraintes | Rôle |
|---|---|
| `idx_reports_status_reported_at` | File des signalements en attente |
| `idx_reports_post_id` / `_comment_id` / `_reported_user_id` | Partiels |
| `uq_reports_reporter_id_*` | Un signalement par personne et par cible |
| `ck_reports_target_type`, `_reason`, `_status` | Énumérations |
| `ck_reports_target`, `_resolution`, `_self`, `_details` | Cohérence, longueur |

> **Un message ne peut pas être signalé — et c'est cohérent.** `target_type`
> ne connaît que `post`, `comment` et `user` : c'est le périmètre du
> récapitulatif. Un contenu problématique échangé en groupe remonte par le
> **profil** de son auteur, signalé par les membres qui le voient (§4.5).
> Rien ne dépend donc du signalement d'un message pris isolément.

#### Le lien est retiré, la preuve reste — **[D31]**

Le backend **vide la clé par un `UPDATE` explicite**, retrouvé par les index
partiels.

> **`ck_reports_target` accepte donc un `target_type` sans cible, et c'est
> voulu.** Après le retrait, un signalement conserve `target_type = 'post'`
> avec `post_id IS NULL` : il dit **ce qui** a été signalé, plus **lequel**.
> « Exactement une » ferait échouer le retrait (§3.8) ; la garantie doit être
> apportée **à la création**, par le backend (§8).

**`target_snapshot`** est figé à la création : sans lui, supprimer son contenu
serait une façon fiable d'échapper à toute sanction.

#### Rétention — **[D35]**

`target_snapshot` **vidé** à l'anonymisation sur les signalements traités ;
signalements traités **purgés au-delà de 12 mois**. **[D40]**
`notifications.report_id` est `ON DELETE SET NULL`.

#### Traitement d'un signalement — **[D32]** **[D39]** **[D45]**

| Décision | Sur le signalement | Sur la cible |
|---|---|---|
| Ignorer | `dismissed`, `moderator_id`, `resolved_at` | rien |
| **Supprimer le contenu** | `resolved`, `moderator_id`, `resolved_at` | `deleted_at` et **`deleted_by_id` = le modérateur** |
| Avertir | `resolved`, … | ligne dans `user_sanctions` |
| Bannir | idem | ligne `ban` ; les contenus sont **masqués**, pas supprimés (§4.4) |

#### Accès de modération — **[D39]**

`accesModeration()` accorde l'accès quand le rôle relu vaut `moderator` ou
`admin`, **et que la ressource est la cible d'un signalement ou son contexte
immédiat** : le post portant un commentaire signalé, le média d'un post
signalé. C'est une **alternative** à `postVisible()`, et elle ignore le
blocage.

---

### 4.16 `notifications`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | `INTEGER` PK NN | Identifiant |
| `recipient_id` | `INTEGER` FK NN | Destinataire |
| `actor_id` | `INTEGER` FK | Qui a déclenché. `NULL` si système |
| `notification_type` | `TEXT` NN | Huit valeurs |
| `post_id` / `comment_id` / `message_id` | `INTEGER` FK | Cible |
| `report_id` / `sanction_id` | `INTEGER` FK | Cible, **`SET NULL`** |
| `is_read` | `INTEGER` NN | 0 ou 1 |
| `created_at` | `TEXT` NN | Date |

| Index et contraintes | Rôle |
|---|---|
| `idx_notifications_recipient_id_is_read_created_at` | **Compteur de non lues** |
| `idx_notifications_recipient_id_created_at` | **Page dédiée** |
| `ck_notifications_target` | Au plus une cible, cohérente — §10.3 |
| `ck_notifications_self`, `_notification_type`, `_is_read`, `_format` | — |

> Le premier index ne sert **pas** la page dédiée : celle-ci liste les deux
> valeurs de `is_read` triées par date, et SQLite trierait en mémoire.

#### Table de correspondance — **[D21]** **[D57]**

| Type | Cible | `actor_id` |
|---|---|---|
| `like` | **`post_id` ou `comment_id`** — **[D57]** | l'auteur de l'action |
| `reshare` | `post_id` (le repartage) | idem |
| `comment`, `reply` | `comment_id` | idem |
| `message` | `message_id` | idem |
| `moderation`, au signaleur | `report_id` | **`NULL`** |
| `moderation`, au sanctionné | `sanction_id` | **`NULL`** |
| `friend_request`, `friend_accepted` | aucune | l'auteur de l'action |

> **[D57] Aimer un commentaire ne produisait aucune notification utilisable.**
> `comment_reactions` existe, avec son énumération, mais
> `ck_notifications_target` imposait
> `comment_id IS NULL OR notification_type IN ('comment','reply')` : une
> notification `like` portant un `comment_id` était **refusée par la base**.
> La seule ligne acceptée était un `like` **sans cible** — « quelqu'un a aimé
> quelque chose », non cliquable.
>
> Le `CHECK` autorise désormais `comment_id` pour le type `like`.
> **`actor_id` et la cible suffisent à l'affichage** : « X a aimé votre
> commentaire » quand `comment_id` est renseigné, « votre publication » quand
> c'est `post_id`. Les deux autres voies — un neuvième type `comment_like`, ou
> acter le silence — coûtaient plus cher pour le même résultat.

> **[D59] Un repartage ne notifie que si son cadre est visible du
> destinataire.** B, compte en `friends`, repartage le post public de A : sans
> règle, A apprend **qui** a repartagé et **que** ça a eu lieu, puis tombe sur
> « contenu indisponible » — la notification révèle exactement ce que D53
> masque. La création est donc conditionnée à
> `postVisible(destinataire, repartage)`, au même titre que la règle de
> blocage. C'est une ligne de plus en §8, pas une colonne de plus.

**[D48]** Aucune notification quand un blocage existe, dans un sens ou dans
l'autre. **[D41]** Les notifications lues sont purgées au-delà de 6 mois.

---

## 5. Suppression logique généralisée

### 5.1 Le principe — **[récap]**

> « **Le contenu est bien supprimé** — c'est ce qui garantit qu'il ne circule
> plus — seul le cadre reste. »

| Contenu supprimé | Ce qui est effacé | Ce qui reste |
|---|---|---|
| **Publication** | `caption` → `NULL` ; ligne `media` et fichiers ; `post_hashtags` ; `post_reactions` ; `saved_posts` | Ligne `posts`, **et ses commentaires avec leur texte** (D34) |
| **Commentaire** | `body` → `NULL` ; `comment_reactions` | Ligne `comments`, arborescence |
| **Message** | `body` → `NULL` ; pièce jointe et fichier | Ligne `messages` |
| **Compte** | Identifiants, bio, avatar, pseudo remplacé ; amitiés, blocages, tokens, réactions, `saved_posts` ; sessions ; `target_snapshot` traités ; puis ses contenus | Ligne `users` |

Tout se fait **dans une transaction** ; l'effacement disque intervient après
le commit, avec `media_staging` comme filet.

| Situation | Affichage |
|---|---|
| Publication d'origine d'un repartage supprimée | « publication indisponible » |
| Message supprimé | « message indisponible » |
| Message échangé avec une personne bloquée, des deux côtés | « message indisponible » |
| Contenu d'une notification supprimé | « contenu indisponible » |
| Profil d'un compte supprimé, ou banni **tant que la sanction est active** | « compte inexistant » |

Quand `deleted_by_id <> user_id` : « contenu retiré par la modération ».

### 5.2 Les clés étrangères — **[D51]** **[D62]**

**Aucun compte ni contenu n'est jamais réellement supprimé**, donc **aucune de
ces clauses ne se déclenche** dans le fonctionnement normal. Elles documentent
l'intention et conditionnent les équivalences strictes (§3.8).

> **[D62] L'audit couvre désormais toutes les FK, pas seulement celles vers
> `users`.** La v2.9 en inventoriait 26 et laissait une vingtaine d'autres
> hériter du `NO ACTION` par défaut **par omission**. C'est sans effet
> aujourd'hui, mais §5.4 liste **trois purges bien réelles**, et c'est l'une
> d'elles qui a rendu D40 nécessaire : la même vérification devait être passée
> partout.

**Vers `users` — `NO ACTION`, dix colonnes** (attribution et historique) :
`conversations.created_by_id`, `conversation_members.added_by_id`,
`user_sanctions.user_id`, `_moderator_id`, `_lifted_by_id`,
`reports.reporter_id`, `_reported_user_id`, `_moderator_id`,
`posts.deleted_by_id`, `comments.deleted_by_id`.

**Vers `users` — `SET NULL`** : `notifications.actor_id`.

**Vers `users` — `CASCADE`, quinze colonnes** : `password_reset_tokens`,
`posts.user_id`, `comments.user_id`, les deux tables de réactions,
`saved_posts`, les deux colonnes de `blocks`, les trois de `friendships`,
`conversation_members.user_id`, `messages.author_id`,
`notifications.recipient_id`, `idempotency_reservations.user_id`.

**Hors `users` — nouveau :**

| Clause | Colonnes | Motif |
|---|---|---|
| `CASCADE` | `media.post_id`, `saved_posts.post_id`, `post_hashtags.post_id` et `.hashtag_id`, `hashtag_trends.hashtag_id`, `comments.post_id`, `post_reactions.post_id`, `comment_reactions.comment_id`, `message_attachments.message_id`, `messages.conversation_id`, `conversation_members.conversation_id` | Données sans existence hors de leur porteur |
| `SET NULL` | `notifications.post_id`, `_comment_id`, `_message_id`, `_report_id`, `_sanction_id` | Cohérent avec D40 et « au plus une cible » : la notification survit, affiche « contenu indisponible » |
| **`NO ACTION`** | `posts.source_post_id`, `posts.root_post_id` | **Un repartage survit à la suppression de sa source** : c'est le principe même de §5.1 |
| **`NO ACTION`** | `comments.parent_comment_id` | Les réponses survivent au parent (D30-a) |
| **`NO ACTION`** | `reports.post_id`, `_comment_id` | Vidées **explicitement** par D31, jamais en cascade |
| **`NO ACTION`** | `idempotency_reservations.post_id` | La reprise idempotente exige un **404 rendu par test applicatif** (§4.10), pas une cible qui s'évapore |

### 5.3 Ce que ça coûte

| Index | Partiel ? | Pourquoi |
|---|---|---|
| `uq_posts_user_id_source_post_id` | **Oui** — **[D7]** | Republier après suppression est légitime |
| `idx_posts_published_at_id` | **Oui** — **[D46]** | Ne pas parcourir des lignes destinées au rejet |
| `idx_posts_user_id_published_at_id` | **Oui** — **[D46]** | Même usage, même filtre |
| `uq_users_email`, `uq_users_phone` | **Oui**, mais pour une autre raison | **Optimisation de taille, pas garantie** : un index unique non partiel accepte déjà plusieurs `NULL` (§3.4). Le `WHERE` n'indexe pas les lignes sans mail |
| `uq_users_username` | **Non** — **[D2]** | Réutiliser un pseudo anonymisé serait une usurpation |

> Tous portent le même motif technique. **Ne pas « uniformiser ».** Et les
> requêtes écrivent la clause **littéralement** (§3.5).

### 5.4 Ce qui est supprimé par du code, pas par le moteur

**Aucun `ON DELETE CASCADE` ne se déclenche jamais dans le fonctionnement
normal.** Tout ce tableau décrit des `DELETE` **explicites**.

| Table | Supprimée par le code lors de |
|---|---|
| `post_reactions`, `comment_reactions` | Suppression du contenu, anonymisation |
| `post_hashtags` | Suppression de la publication, re-synchronisation |
| `saved_posts` | Suppression de la publication, anonymisation |
| `media`, `message_attachments` | Suppression du contenu porteur |
| `friendships`, `blocks`, `password_reset_tokens` | Anonymisation |
| `sessions` | Aucune FK — purge **synchrone dans la transaction** (D64) |
| `idempotency_reservations` | **Purge réelle** : expirée **et** sans heartbeat récent |
| `reports` | **Purge réelle** : traités de plus de 12 mois |
| `notifications` | **Purge réelle** : lues de plus de 6 mois |

---

## 6. Sécurité

### 6.1 Injection SQL — couvert

Drizzle génère exclusivement des requêtes paramétrées. `sql.raw()` est la
seule porte ouverte, et un `?` ne remplace ni un nom de colonne ni un sens de
tri — liste blanche obligatoire.

### 6.2 Mots de passe

Chaîne PHC argon2id complète, **sel inclus**. `m=19456 / t=2 / p=1`.

### 6.3 Contrôle d'accès

| État | Source | Effet |
|---|---|---|
| Visibilité du compte auteur | `users.post_visibility` | Tout ce qu'il publie, **cadre compris** |
| Visibilité de la racine | son auteur | Le **contenu** d'un repartage |
| Amitié **acceptée** | `friendships.status` | Une demande en attente n'ouvre rien |
| Blocage | `blocks` | **Bidirectionnel**, sauf en groupe (D48, D54, D60) |
| Bannissement **actif** | `user_sanctions`, `lifted_at IS NULL` | Connexion refusée, contenus masqués — levée possible (D24) |
| Rôle | `users.role`, **relu en base** | Modération |
| Suppression logique | `deleted_at` | Contenu remplacé par un cadre |
| **Cache HTTP** | **[D58]** | **Le contrôle passe avant la comparaison d'ETag** |

#### Les fonctions de référence — **[D17]**

| Fonction | Ce qu'elle vérifie |
|---|---|
| `postVisible(lecteur, post)` | Non supprimé ; auteur actif et **sans bannissement actif** ; `public`, **ou** amitié `accepted`, **ou lecteur = auteur** |
| `estBloque(a, b)` | **Symétrique** (D48) |
| `repartageAffichable(lecteur, post)` | `postVisible` sur le **cadre**, chaque **maillon**, puis la **racine** (D53) |
| `accesModeration(lecteur, ressource)` | Rôle relu, **et** cible d'un signalement ou son contexte |
| `commentairesLisibles(lecteur, …)` | Joint `posts`, filtre `p.deleted_at IS NULL` (D34) |
| `filActif(…)` | Écrit `deleted_at IS NULL` littéralement (D46) |
| **`peutNotifier(acteur, destinataire, cible)`** | Blocage dans les deux sens (D48) **et** visibilité du cadre (D59) |

**Au plus trois maillons plus la racine sont rendus.**

### 6.4 Sauvegardes

**Ne jamais copier `2stagram.db` avec `cp`.** **`db.backup()` est asynchrone** :

```js
await db.backup(`/backups/app-${Date.now()}.db`);
```

Sans l'`await`, la sauvegarde échoue silencieusement. L'appel produit **un
seul fichier cohérent**, WAL rejoué dedans.

| Fichier | Volume Docker | Sauvegarde |
|---|---|---|
| `2stagram.db` | oui | via `db.backup()` |
| `2stagram.db-wal` | oui | non — rejoué dans le fichier produit |
| `2stagram.db-shm` | oui | **non** — mémoire partagée transitoire |

### 6.5 Accès aux fichiers — **[D10]** **[D39]**

**Aucun dossier d'uploads n'est servi statiquement.**

| Route | Vérifie |
|---|---|
| Médias de publications | `postVisible()`, **ou `accesModeration()`** |
| Pièces jointes | **L'appartenance à la conversation**, et le blocage |

Les deux portent la **CSP restrictive** exigée par le SVG, ne servent que des
fichiers assainis (§4.7), et suivent **D58** : contrôle d'accès avant toute
réponse conditionnelle.

---

## 7. La fuite par le repartage est fermée — **[D8]** **[D33]** **[D53]** **[D58]**

```
1. Le compte de A est public. A publie.
2. B repartage — autorisé.
3. A bascule son compte en « amis ».
4. Le repartage de B pointe vers un contenu désormais privé.
```

L'affichage lit **toujours la visibilité actuelle**, à chaque niveau :

| Niveau | Décide de | Gouverné par |
|---|---|---|
| Le post lu | l'affichage du **cadre** | son auteur (D53) |
| Chaque maillon intermédiaire | l'affichage de **sa description** | son auteur (D33) |
| La racine | l'affichage du **contenu** | l'auteur de la racine (D8) |

**À la création**, les mêmes maillons sont vérifiés publics.

> **La lecture doit atteindre le serveur pour que tout cela s'applique.**
> C'était le trou de la v2.9 : `version` n'étant pas incrémentée par une
> bascule de visibilité, un client pouvait recevoir un `304` et réafficher un
> contenu devenu privé. **D58** ferme ce chemin — contrôle d'accès avant
> comparaison d'ETag, et `Cache-Control: private, no-cache`.

**Un repartage n'affiche d'un contenu que ce à quoi le lecteur aurait accès
directement**, à chaque niveau, à chaque requête.

---

## 8. Ce que la base ne garantit pas

### Authentification

| Règle | Pourquoi |
|---|---|
| Résoudre l'identifiant dans l'ordre pseudo → email → téléphone **[D12]** | Règle applicative |
| Vérifier `deleted_at` et l'absence de ban **à chaque requête authentifiée** | Rattrape une purge de sessions manquée |
| Relire `users.role` sur toute route de modération **[D13]** | La session est figée |
| **Purger les sessions par `destroyByUserIdSync()`, dans la transaction** **[D64]** | `db.transaction()` est synchrone |
| **Lier `userId` avec le bon type dans l'index d'expression** | Un plan correct peut rendre zéro ligne |
| Fabriquer une échéance de repli pour un cookie sans `expires` | `expires_at` est `NOT NULL` |
| Réserver la promotion en modérateur à l'administrateur **[récap]** | Porte sur le rôle de l'appelant |

### Normalisation et validation d'entrée

| Règle | Pourquoi |
|---|---|
| **`normalize('NFC').toLowerCase()` sur l'adresse mail, aux deux chemins** **[D56]** | **Le `CHECK` accepte `École@test.fr`** (§4.3) |
| **Idem sur les hashtags** **[D56]** | **Le `CHECK` accepte `Été` et `École`** (§4.12) |
| Valider le pseudo à l'inscription **et** au changement **[D2]** **[D55]** | Idem |
| Téléphone en E.164, FR par défaut **[D12]** | Le `CHECK` refuse, il ne corrige pas |
| `trim()` avant validation des textes | La base ne distingue pas une chaîne d'espaces |

### Visibilité, cache et accès

| Règle | Pourquoi |
|---|---|
| **Évaluer l'accès avant de répondre `304`** **[D58]** | Sinon un ETag valide réaffiche un contenu privé |
| **`Cache-Control: private, no-cache` sur tout ce qui dépend de la visibilité** **[D58]** | Un cache partagé servirait la ressource à un tiers |
| Composer les fonctions de §6.3 **[D17]** | Une variante réécrite sera fausse |
| Distinguer cadre et contenu d'un repartage **[D53]** | Deux visibilités sur une même ligne |
| Vérifier le blocage dans les deux sens, partout **[D48]** | La table est asymétrique, la règle ne l'est pas |
| **Filtrer l'ajout en groupe par les blocages présents** **[D60]** | Sinon un tiers réintroduit un bloqué |
| Ne pas appliquer le blocage aux messages de groupe **[D54]** | Il porte sur la relation directe |
| Contrôler chaque maillon, à l'affichage et à la création **[D33]** | §7 |
| Écrire `deleted_at IS NULL` littéralement **[D46]** | Sinon l'index partiel est ignoré |
| Filtrer `posts.deleted_at` en listant des commentaires **[D34]** | Leur texte survit |
| Ne jamais matérialiser la visibilité sur `posts` **[D50]** | Une écriture de masse bloque le moteur |

### Intégrité

| Règle | Pourquoi |
|---|---|
| **Exactement une cible à la création** d'un signalement ou d'une notification | Le `CHECK` n'impose qu'« au plus une », volontairement |
| **Ne pas notifier si le cadre n'est pas visible du destinataire** **[D59]** | La notification révélerait ce que D53 masque |
| Ne pas notifier quand un blocage existe **[D48]** | Porte sur une autre table |
| Vérifier chaque maillon public avant de créer un repartage **[D33]** | Porte sur d'autres lignes |
| Interdire le repartage de soi-même à chaque maillon **[D18]** | Le cas indirect |
| Un post original : exactement un média ; un repartage : aucun **[D19]** | Porte sur une autre table |
| Renseigner `root_post_id` à l'insertion | Calcul applicatif |
| Filtrer `deleted_at` dans l'`UPDATE` de `version`, distinguer 404 de 412 | La ligne survit |
| Re-synchroniser `post_hashtags`, originaux seulement **[D38]** | Les `#` d'un repartage ne comptent pas |
| `parent_comment_id` : même `post_id`, parent forcément racine **[D42]** | Deux niveaux |
| Un commentaire n'est supprimable que par son auteur ou un modérateur **[D45]** | La déduction en dépend |
| Vérifier la précondition d'une opération d'amitié **[D49]** | Refus et suppression sont le même `DELETE` |
| `actor_id = NULL` sur les notifications de modération | Protège le modérateur |
| Figer, vider et purger `target_snapshot` **[D35]** | Données personnelles |
| Retirer le lien d'un signalement quand son contenu est supprimé **[D31]** | Aucune cascade |
| `details` obligatoire si `reason = 'other'` | Règle métier |
| Retrouver le fil existant ; `is_group = 0` ⇒ deux membres | Les membres sont ailleurs |
| Un message : texte **ou** une pièce jointe **[D36]** | Les pièces jointes sont ailleurs |
| Trier les identifiants avant d'insérer une amitié | Le `CHECK` refuse, il ne corrige pas |
| Ne vider les commentaires que sur suppression par la modération **[D34]** | §5.1 |
| Renseigner `deleted_by_id` à chaque suppression **[D32]** | `NULL` signifiait deux choses |
| Heartbeat conditionnel, arrêté avant l'écriture finale **[D23]** | Sinon la requête se déposséde elle-même |
| Ne pas purger une réservation au heartbeat récent **[D23]** | Elle est en cours |
| Ouvrir la transaction de création après le traitement du fichier | Un traitement long bloque tout |

### Fichiers

| Règle | Pourquoi |
|---|---|
| Inscrire dans `media_staging` **avant** l'écriture **[D22]** | Ordre d'opérations |
| Supprimer la ligne de staging dans la transaction de rattachement | Sinon le balayeur efface un fichier rattaché |
| Réinsérer en `orphaned` à la suppression et au remplacement **[D44]** | La ligne a disparu au rattachement |
| Balayer `staged` > 1 h, `orphaned` sans condition d'âge | Sinon un effacement raté n'est jamais rattrapé |
| Tolérer `ENOENT` des deux côtés | Balayeur et `unlink` peuvent viser le même fichier |
| Effacer une seule fois si `display_path` = `sanitized_path` | Sinon second `unlink` en erreur |
| Vérifier le format réel, et la taille **avant et après** traitement | Un ré-encodage peut faire grossir |
| Appliquer la chaîne d'assainissement aux **pièces jointes et aux avatars** **[D43]** | EXIF et SVG, mêmes risques |

### Requêtes à encapsuler

| Requête | Piège |
|---|---|
| Liste d'amis, nombre d'amis | Regarder les **deux** colonnes, filtrer `accepted` |
| Vérification de blocage | Les **deux** sens |
| Non-lus d'une conversation | `COALESCE(last_read_at, added_at)`, exclure l'auteur |
| Badge global | `COUNT(*)` **sans `GROUP BY`** |
| **Compteurs de réactions** | **`COALESCE(SUM(…), 0)`** : `NULL` sur zéro ligne |
| Fil global et fil de profil | `deleted_at IS NULL` littéral |
| Commentaires d'un utilisateur | Joindre `posts`, filtrer `p.deleted_at` |
| Purge des sessions | `json_extract` à l'identique, **et le bon type** |
| Visibilité d'un repartage | Cadre, maillons, racine |
| Compteur de repartages | `root_post_id`, exclure les supprimés |
| Extraction et normalisation des hashtags | NFC, minuscules, originaux seulement |
| Recalcul des tendances | `db.transaction()`, visibilité, suppression, repartages exclus |

---

## 10. Annexe — SQL des contraintes

### 10.1 Énumérations, formats et longueurs

```sql
-- users
CHECK (role IN ('user', 'moderator', 'admin'))
CHECK (post_visibility IN ('public', 'friends'))
CHECK (group_invite_policy IN ('public', 'friends'))

-- ck_users_username  [D2] [D12] [D55]
CHECK (length(username) BETWEEN 3 AND 30
       AND lower(username) NOT GLOB '*[^a-z0-9_]*'
       AND username GLOB '*[a-zA-Z]*'
       AND (deleted_at IS NOT NULL OR lower(username) NOT GLOB 'deleted_user_*'))

-- ck_users_email  [D56] : ne garantit la casse que sur l'ASCII
CHECK (email IS NULL OR (
    email = lower(email)
    AND length(email) BETWEEN 6 AND 254
    AND email LIKE '%_@_%._%'
    AND NOT email GLOB '*@*@*'
    AND NOT email GLOB '* *'))

CHECK (phone IS NULL OR (
    phone GLOB '+[0-9]*'
    AND NOT substr(phone, 2) GLOB '*[^0-9]*'
    AND length(phone) BETWEEN 8 AND 16))

CHECK (deleted_at IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL) -- ck_users_contact [D52]
CHECK (bio IS NULL OR length(bio) BETWEEN 1 AND 500)
CHECK (avatar_path IS NULL OR length(avatar_path) BETWEEN 1 AND 512)     -- [D61]

-- énumérations restantes
CHECK (media_type IN ('photo', 'video'))
CHECK (file_format IN ('jpg','jpeg','png','webp','gif','svg','mp4','webm'))
CHECK (reaction_type IN ('like', 'dislike'))
CHECK (sanction_type IN ('warning', 'ban'))
CHECK (target_type IN ('post', 'comment', 'user'))                       -- reports
CHECK (reason IN ('spam','harassment','offensive_content','other'))      -- reports
CHECK (status IN ('pending', 'resolved', 'dismissed'))                   -- reports
CHECK (status IN ('pending', 'accepted'))                                -- friendships
CHECK (notification_type IN ('like','comment','reply','reshare',
       'friend_request','friend_accepted','message','moderation'))
CHECK (is_read IN (0, 1))
CHECK (is_group IN (0, 1))
CHECK (period IN ('7d'))
CHECK (state IN ('staged', 'orphaned'))

-- bornes de longueur et de valeur  [D61]
CHECK (caption IS NULL OR length(caption) BETWEEN 1 AND 2200)            -- posts
CHECK (body    IS NULL OR length(body)    BETWEEN 1 AND 2200)            -- comments
CHECK (body    IS NULL OR length(body)    BETWEEN 1 AND 5000)            -- messages
CHECK (name = lower(name) AND length(name) BETWEEN 1 AND 100)            -- hashtags  [D56]
CHECK (name IS NULL OR length(name) BETWEEN 1 AND 100)                   -- conversations
CHECK (length(reason)  BETWEEN 1 AND 200)                                -- user_sanctions
CHECK (details IS NULL OR length(details) BETWEEN 1 AND 2000)            -- sanctions, reports
CHECK (transform_params IS NULL OR length(transform_params) <= 2000)
CHECK (length(sanitized_path) BETWEEN 1 AND 512)                         -- idem display_path,
CHECK (length(file_path)      BETWEEN 1 AND 512)                         -- media_staging, attachments
CHECK (length(key) BETWEEN 1 AND 128)                                    -- idempotency
CHECK (version > 0)                                                      -- posts
CHECK (post_count >= 0)                                                  -- hashtag_trends
CHECK (size_bytes BETWEEN 1 AND 26214400)                                -- 25 Mio [D28]
```

### 10.2 Format des dates — 35 colonnes

```sql
-- obligatoire
CHECK (<col> GLOB
  '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')
-- facultative
CHECK (<col> IS NULL OR <col> GLOB '…même motif…')
```

| Table | Colonnes |
|---|---|
| `sessions` | `expires_at` |
| `password_reset_tokens` | `expires_at`, `used_at`*, `created_at` |
| `users` | `deleted_at`*, `created_at` |
| `user_sanctions` | `lifted_at`*, `created_at` |
| `blocks` | `created_at` |
| `posts` | `published_at`, `updated_at`*, `deleted_at`* |
| `media` | `created_at` |
| `saved_posts` | `saved_at` |
| `comments` | `created_at`, `updated_at`*, `deleted_at`* |
| `idempotency_reservations` | `created_at`, `heartbeat_at`, `expires_at` |
| `media_staging` | `created_at` |
| `post_reactions`, `comment_reactions` | `created_at` (×2) |
| `hashtags` | `created_at` |
| `hashtag_trends` | `computed_at` |
| `friendships` | `requested_at` |
| `conversations` | `created_at` |
| `conversation_members` | `added_at`, `last_read_at`* |
| `messages` | `sent_at`, `deleted_at`* |
| `message_attachments` | `created_at` |
| `reports` | `reported_at`, `resolved_at`* |
| `notifications` | `created_at` |

*Les colonnes marquées prennent la seconde forme.* **Le `CHECK` valide la
forme, pas la validité de la date** (§3.7).

### 10.3 Cohérence entre colonnes

```sql
-- ck_media_type_format  (et ck_message_attachments_type_format, identique)
CHECK ((media_type = 'photo' AND file_format IN ('jpg','jpeg','png','webp','gif','svg'))
    OR (media_type = 'video' AND file_format IN ('mp4','webm')))

CHECK (duration_seconds IS NULL
    OR (media_type = 'video' AND duration_seconds > 0))                  -- ck_*_duration_seconds

-- ck_media_dimensions  [D61]
CHECK ((width IS NULL AND height IS NULL)
    OR (width > 0 AND height > 0))

-- posts
CHECK (source_post_id IS NULL OR source_post_id <> id)
CHECK ((source_post_id IS NULL) = (root_post_id IS NULL))
CHECK ((deleted_at IS NULL) = (deleted_by_id IS NULL))                   -- idem comments [D32]

CHECK (parent_comment_id IS NULL OR parent_comment_id <> id)

CHECK (blocker_id <> blocked_id)
CHECK (low_user_id < high_user_id)
CHECK (requester_id IN (low_user_id, high_user_id))

-- user_sanctions  [D24] : la levée vaut pour les deux types de sanction
CHECK (user_id <> moderator_id)
CHECK ((lifted_at IS NULL) = (lifted_by_id IS NULL))

-- reports  [D31]
CHECK (reported_user_id IS NULL OR reporter_id <> reported_user_id)
CHECK (
  (post_id IS NOT NULL) + (comment_id IS NOT NULL) + (reported_user_id IS NOT NULL) <= 1
  AND (post_id IS NULL OR target_type = 'post')
  AND (comment_id IS NULL OR target_type = 'comment')
  AND (reported_user_id IS NULL OR target_type = 'user'))
CHECK ((status = 'pending' AND resolved_at IS NULL AND moderator_id IS NULL)
    OR (status IN ('resolved','dismissed')
        AND resolved_at IS NOT NULL AND moderator_id IS NOT NULL))

-- notifications  [D5] [D21] [D57]
CHECK (actor_id IS NULL OR actor_id <> recipient_id)
CHECK (
  (post_id IS NOT NULL) + (comment_id IS NOT NULL) + (message_id IS NOT NULL)
  + (report_id IS NOT NULL) + (sanction_id IS NOT NULL) <= 1
  AND (post_id     IS NULL OR notification_type IN ('like', 'reshare'))
  AND (comment_id  IS NULL OR notification_type IN ('like', 'comment', 'reply'))
  AND (message_id  IS NULL OR notification_type = 'message')
  AND (report_id   IS NULL OR notification_type = 'moderation')
  AND (sanction_id IS NULL OR notification_type = 'moderation'))
```

### 10.4 Index uniques et clés composites

```sql
CREATE UNIQUE INDEX uq_users_username ON users (username COLLATE NOCASE);
CREATE UNIQUE INDEX uq_users_email    ON users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX uq_users_phone    ON users (phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX uq_hashtags_name  ON hashtags (name);
CREATE UNIQUE INDEX uq_media_post_id  ON media (post_id);
CREATE UNIQUE INDEX uq_message_attachments_message_id ON message_attachments (message_id);
CREATE UNIQUE INDEX uq_media_staging_file_path ON media_staging (file_path);

CREATE UNIQUE INDEX uq_posts_user_id_source_post_id
  ON posts (user_id, source_post_id)
  WHERE source_post_id IS NOT NULL AND deleted_at IS NULL;               -- [D7]

CREATE UNIQUE INDEX uq_reports_reporter_id_post_id
  ON reports (reporter_id, post_id) WHERE post_id IS NOT NULL;
-- idem comment_id, reported_user_id

-- [D63] les réactions n'ont plus d'index unique : PRIMARY KEY (user_id, post_id)
--       et PRIMARY KEY (user_id, comment_id) portent l'unicité
```

### 10.5 Index de lecture

```sql
CREATE INDEX idx_posts_published_at_id
  ON posts (published_at, id) WHERE deleted_at IS NULL;                  -- [D46]
CREATE INDEX idx_posts_user_id_published_at_id
  ON posts (user_id, published_at, id) WHERE deleted_at IS NULL;         -- [D46]
CREATE INDEX idx_posts_root_post_id   ON posts (root_post_id);
CREATE INDEX idx_posts_source_post_id ON posts (source_post_id);

CREATE INDEX idx_blocks_blocked_id ON blocks (blocked_id);               -- [D48]
CREATE INDEX idx_post_reactions_post_id ON post_reactions (post_id);
CREATE INDEX idx_conversation_members_user_id ON conversation_members (user_id);
CREATE INDEX idx_messages_conversation_id_sent_at_id
  ON messages (conversation_id, sent_at, id);

CREATE INDEX idx_reports_post_id ON reports (post_id) WHERE post_id IS NOT NULL;
-- idem comment_id, reported_user_id

CREATE INDEX idx_notifications_recipient_id_created_at
  ON notifications (recipient_id, created_at);
CREATE INDEX idx_sessions_user_id
  ON sessions (json_extract(data, '$.userId'));                          -- type de la valeur !
```

### 10.6 Requêtes de référence

```sql
-- état du compte, à chaque requête authentifiée  [D13] [D14]
SELECT u.role FROM users u
WHERE u.id = ? AND u.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_sanctions s
                  WHERE s.user_id = u.id AND s.sanction_type = 'ban'
                    AND s.lifted_at IS NULL);          -- sanction ACTIVE [D24]

-- anonymisation  [D4] [D52]
UPDATE users SET username = 'deleted_user_' || id, email = NULL, phone = NULL,
  password_hash = '', bio = NULL, avatar_path = NULL, deleted_at = ?
WHERE id = ?;

-- réactions  [D26] [D63] — le ON CONFLICT vise la clé primaire
INSERT INTO post_reactions (user_id, post_id, reaction_type, created_at)
VALUES (?, ?, ?, ?)
ON CONFLICT (user_id, post_id) DO UPDATE SET reaction_type = excluded.reaction_type;

-- compteurs : COALESCE obligatoire, SUM vaut NULL sur zéro ligne 
SELECT COALESCE(SUM(reaction_type = 'like'),    0) AS likes,
       COALESCE(SUM(reaction_type = 'dislike'), 0) AS dislikes
FROM post_reactions WHERE post_id = ?;

-- non-lus d'une conversation  [D16]
SELECT COUNT(*) FROM messages m
JOIN conversation_members cm
  ON cm.conversation_id = m.conversation_id AND cm.user_id = ?
WHERE m.conversation_id = ? AND m.author_id <> ? AND m.deleted_at IS NULL
  AND m.sent_at > COALESCE(cm.last_read_at, cm.added_at);
-- badge global : la même, sans le filtre de conversation et sans GROUP BY

-- idempotence  [D23]
UPDATE idempotency_reservations SET heartbeat_at = :maintenant
WHERE user_id = ? AND key = ? AND post_id IS NULL AND heartbeat_at = :precedent;

UPDATE idempotency_reservations SET request_hash = ?, heartbeat_at = :maintenant
WHERE user_id = ? AND key = ? AND post_id IS NULL
  AND heartbeat_at < :il_y_a_30_secondes;

UPDATE idempotency_reservations SET post_id = ?
WHERE user_id = ? AND key = ? AND post_id IS NULL
  AND heartbeat_at = :dernier_heartbeat_ecrit;

DELETE FROM idempotency_reservations
WHERE expires_at < :maintenant
  AND (post_id IS NOT NULL OR heartbeat_at < :il_y_a_30_secondes);

-- journal des fichiers  [D22] [D44]
INSERT INTO media_staging (file_path, state, created_at) VALUES (?, 'orphaned', ?)
ON CONFLICT (file_path) DO UPDATE SET state = 'orphaned';

-- amis acceptés  [D37]
SELECT CASE WHEN low_user_id = ? THEN high_user_id ELSE low_user_id END AS friend_id
FROM friendships
WHERE (low_user_id = ? OR high_user_id = ?) AND status = 'accepted';

-- blocage, symétrique  [D48]
SELECT 1 FROM blocks
WHERE (blocker_id = :a AND blocked_id = :b)
   OR (blocker_id = :b AND blocked_id = :a) LIMIT 1;

-- compteur de repartages  [D18]
SELECT COUNT(*) FROM posts WHERE root_post_id = ? AND deleted_at IS NULL;

-- modification concurrente  [D58 : l'accès est vérifié AVANT]
UPDATE posts SET caption = ?, version = version + 1, updated_at = ?
WHERE id = ? AND version = ? AND deleted_at IS NULL;

-- recalcul des tendances, dans db.transaction()
DELETE FROM hashtag_trends WHERE period = '7d';
INSERT INTO hashtag_trends (hashtag_id, period, post_count, computed_at)
SELECT ph.hashtag_id, '7d', COUNT(*), ?
FROM post_hashtags ph
JOIN posts p ON p.id = ph.post_id
JOIN users u ON u.id = p.user_id
WHERE p.published_at > ? AND p.deleted_at IS NULL AND p.source_post_id IS NULL
  AND u.post_visibility = 'public' AND u.deleted_at IS NULL
GROUP BY ph.hashtag_id;
```