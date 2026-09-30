# Décisions — 2stagram

**Version 4.7 — 29 septembre 2026.** Un fichier sur deux — la carte est dans [`Readme.md`](Readme.md).

> **Sections portées par ce fichier : §0.** La numérotation est **commune aux deux fichiers** : un renvoi tel que `§4.3` désigne toujours la même section, et les sections §1 à §8 et §10 sont dans `tables-et-contraintes.md`. Les renvois sont textuels, pas cliquables — on les suit par une recherche dans le fichier.

---

## 0. Décisions, alignement et journal

### 0.1 Table des décisions — D1 à D64

| # | Sujet | Décision |
|---|---|---|
| D1 | Contact obligatoire | *(reformulée par **D52**)* |
| D2 | Pseudo anonymisé | Préfixe `deleted_user_` réservé, en base et dans Zod |
| D3 | Booléens Drizzle | `mode: 'boolean'` |
| D4 | Anonymisation | Suppressions explicites |
| D5 | Cibles de notification | « Au plus une cible » |
| D6 | Clés primaires | Simple si référençable, composite sinon — **appliquée par D63** |
| D7 | Repartage après suppression | Unicité partielle sur les repartages actifs |
| D8 | Visibilité du **contenu** repartagé | Visibilité actuelle de l'auteur de la racine |
| D9 | Métadonnées | Nettoyées ; **exiftool** en remux pour la vidéo |
| D10 | Pièces jointes | Route vérifiant l'appartenance à la conversation |
| D11 | Longueur d'un commentaire | 2200 caractères |
| D12 | Identifiants | Pays par défaut **France** ; pseudo jamais entièrement numérique |
| D13 | Rôle | Relu en base à chaque requête protégée |
| D14 | Compte supprimé | `deleted_at` vérifié au login |
| D15 | Index | Fil, messagerie, signalements, notifications |
| D16 | Non-lus | Pas de compteur stocké |
| D17 | Visibilité | Fonctions de repository composées |
| D18 | Chaînes de repartages | Chaînes réelles, `root_post_id` |
| D19 | Média | Exactement un par post original, aucun sur un repartage |
| D20 | Visibilité | `post_visibility` gouverne tout ce qu'un compte publie |
| D21 | Cibles de notification | Cinq colonnes — **étendue par D57** |
| D22 | `media_staging` | Portée élargie, cycle de vie fixé |
| D23 | Idempotence | `heartbeat_at`, écritures conditionnelles |
| D24 | Bannissement | **Réversible v3.2** : levée par un modérateur ou un administrateur ; les contenus sont **masqués**, pas supprimés |
| D25 | ~~Actions du bloqué~~ | **Annulée par D48** |
| D26 | Réactions | `ON CONFLICT DO UPDATE`, `created_at` préservé |
| D27 | Nommage | Clé étrangère = `<rôle>_id` |
| D28 | Taille des médias | **25 Mio** = 26 214 400 octets |
| D29 | Version de référence | `sanitized_path` |
| D30 | Effacement | **a** commentaires, **b** médias, **c** pièces jointes |
| D31 | Signalements | Lien retiré, `target_snapshot` conservé |
| D32 | Traçabilité | `deleted_by_id` toujours renseigné |
| D33 | Chaînes | Chaque maillon contrôlé |
| D34 | Commentaires d'un post supprimé | Vidés **seulement sur suppression par la modération** — le bannissement ne supprime plus rien (D24) |
| D35 | Rétention | Signalements traités purgés à 12 mois |
| D36 | Pièces jointes | Une seule par message |
| D37 | `friendships` | Clé primaire composite |
| D38 | Hashtags | Re-synchronisés à l'édition, repartages exclus |
| D39 | Modération | Accès à la cible et à son contexte immédiat |
| D40 | Purges | `report_id`, `sanction_id` en `SET NULL` — **généralisée par D62** |
| D41 | Notifications | Lues purgées à 6 mois |
| D42 | Commentaires | Deux niveaux **sans imbrication** : répondre à une réponse est possible, le serveur rattache à la racine et une mention `@pseudo` désigne le destinataire |
| D43 | Pièces jointes | Même chaîne d'assainissement |
| D44 | Retouche | L'ancien rendu passe en `orphaned` |
| D45 | Suppression d'un commentaire | Son auteur ou un modérateur |
| D46 | Index du fil | Partiels, terminés par `id` |
| D47 | Hashtags | Unicité, NFC applicatif — **portée précisée par D56** |
| D48 | Blocage | **Bidirectionnel** |
| D49 | Amitié | Aucun état « refusé » |
| D50 | Modèle de visibilité | **Dérivé** — **coût complété par D58** |
| D51 | Clés étrangères vers `users` | Clause `ON DELETE` explicite |
| D52 | Contact obligatoire | Un mail **ou** un téléphone, en plus du pseudo |
| D53 | Cadre et contenu d'un repartage | Deux visibilités distinctes |
| D54 | Blocage et groupes | Les interdictions portent sur la relation directe |
| D55 | Pseudo | Au moins une lettre |
| **D56** | **`lower()` et l'ASCII** | `ck_hashtags_name` et `ck_users_email` ne couvrent **que l'ASCII** : la garantie est portée par Zod, aux deux chemins |
| **D57** | **Like d'un commentaire** | `comment_id` autorisé pour le type `like` |
| **D58** | **ETag et cache** | Le contrôle d'accès passe **avant** la comparaison d'ETag ; `Cache-Control: private, no-cache` |
| **D59** | **Notification de repartage** | Créée seulement si le **cadre** est visible du destinataire |
| **D60** | **Ajout en groupe** | Interdit s'il existe un blocage entre l'ajouté et un membre |
| **D61** | **Bornes de longueur** | Toute colonne `TEXT` libre en porte une, `messages.body` comprise |
| **D62** | **`ON DELETE` généralisé** | Clause explicite sur **toutes** les FK, pas seulement celles vers `users` |
| **D63** | **Réactions** | Clé primaire composite, application de D6 |
| **D64** | **Purge des sessions** | Méthode **synchrone** du Store, partageant la connexion |

> **Numérotation continue de D1 à D64.** D25 est conservée, annulée mais
> visible.

### 0.2 État du récapitulatif fonctionnel

**L'alignement avec le récapitulatif est terminé.** Les neuf passages qui
contredisaient le schéma sont corrigés, et le récapitulatif est en **version 2**
du 28 septembre 2026 : il redevient la référence métier sans réserve.

| # | Passage corrigé | Décision |
|---|---|---|
| R1 | Libellé « Bannissement définitif » → « Bannissement » | D24 |
| R2 | « Repartager deux fois la même publication » → « le même post » | D18 |
| R3 | Paramètre « Republication visible par tous ou non » supprimé | D20 |
| R4 | Modification et suppression séparées en deux règles | D32, D45 |
| R5 | Section Blocage réécrite : bidirectionnelle, avec l'exception des groupes | D48, D54, D60 |
| R6 | « 25 Mo » → « 25 Mio » (26 214 400 octets) | D28 |
| R7 | Notifications : like d'un commentaire, silence sur blocage et repartage privé | D57, D59 |
| R8 | Pseudo avec une lettre, réponses à un niveau, refus sans trace, message non signalable | D42, D49, D55 |
| R9 | Métadonnées nettoyées y compris en vidéo ; « version non retouchée » | D9, D29 |

**R10, fait en version 2** : la section « Points à signaler aux développeurs »
du récapitulatif a été **supprimée**. Elle demandait des corrections
déjà faites, et garder deux listes de la même chose est précisément ce qui
avait produit le décalage entre les documents. Aucun des deux documents ne
porte plus de liste de ce type.

### 0.3 Journal des versions

**À partir de la v3.3, ce journal est la seule section qui grossit** : la
table des décisions et la numérotation ne bougent plus. Le contenu technique
de chaque correction vit dans sa section, pas ici.

| Version | Ce qui a changé |
|---|---|
| **v4.7** | Fichiers renommés pour dire leur contenu : `tables-et-contraintes.md`, `decisions-de-conception.md`, `Readme.md`. Tous les renvois suivent |
| v4.6 | **La liste de livraison et les tests à écrire sortent de la documentation partagée** : ce sont des outils de travail de l'Admin BDD. Les dépendances passent dans le `README`, le point ouvert renvoie au récapitulatif |
| v4.5 | Dernières traces des relectures externes retirées : plus aucune adresse nominative, plus de renvoi vers un numéro de ligne, et les identifiants `DB-01`, `LOG-01`, `[Cn]` et `[Tn]` — jamais définis ici — sont remplacés par la règle qu'ils désignaient |
| v4.4 | Adresses nominatives retirées de `tables-et-contraintes.md` §4.3 et du `README`. Les règles restent, la comparaison disparaît |
| v4.3 | **D42 précisée** : répondre à une réponse est possible dans l'interface. Le serveur remonte à la racine — normalisation, pas refus. Le refus reste pour un parent d'un autre post |
| v4.2 | **Liste des écarts avec les documents de Louis et d'Erin supprimée** : leur code a évolué depuis. Chaque règle qu'elle portait reste écrite dans `tables-et-contraintes.md`, à sa table |
| v4.1 | Récapitulatif renuméroté en **version 2** : la v1 officielle reste la base, et la refonte devient sa v2. Les quatre documents s'y réfèrent désormais sous ce numéro |
| v4.0 | Relecture de Nat : version du récapitulatif propagée partout, test de levée de bannissement retourné (D24), chemin `shared/src/db/schema.ts` et base `2stagram.db` alignés sur le dépôt. **Document découpé en trois fichiers** — voir `Readme.md` |
| v3.7 | **Liste de livraison de `schema.ts` expliquée** : ce qu'elle contient, et l'ordre des cinq priorités |
| v3.6 | Récapitulatif passé en **version 3** : sa liste de points à signaler aux développeurs est remplacée par un renvoi vers celle de la documentation du schéma, qui devient la seule. §0.2 clôt l'alignement |
| v3.5 | Borne de `messages.body` **confirmée à 5000 caractères**. Il ne reste plus qu'un point ouvert : la réinitialisation par SMS |
| v3.4 | **Tableau de bord des points ouverts supprimé** : il faisait doublon avec les spécifications, qui portent désormais chacune leur urgence, leur effet et leur suivi |
| v3.3 | §0 restructuré pour que la numérotation cesse de se décaler. Les onze points de Louis et Erin tranchés jusqu'au code, le récapitulatif aligné |
| v3.2 | **D24 révisée** : bannissement réversible, contenus **masqués** au lieu d'être supprimés. `ck_user_sanctions_lifted_type` retirée, les deux requêtes de contrôle passent sur `lifted_at IS NULL`, D34 réduite |
| v3.1 | Alignement réécrit par destinataire, C5 requalifié en limite assumée, statut « validable en l'état » |
| v3.0 | **La faille `lower()` rétablie à l'endroit** : `Été` et `École` passent le `CHECK`, `ÉTÉ` et `Paris` sont refusés (§3.6, §4.12). D56 étend le constat à l'adresse mail. Six décisions nouvelles : accès de modération, `SET NULL` sur les cibles purgeables, rétention des notifications, commentaires à deux niveaux, assainissement des pièces jointes, rendu retouché orphelin |
| v2.9 | `ck_users_contact`, cadre et contenu d'un repartage, blocage en groupe, **inventaire complet des contraintes (§10)** |
| v2.8 | Blocage bidirectionnel, modèle de visibilité arbitré, inventaire des `ON DELETE` |
| v2.7 | Courses du heartbeat, portée de D34 et D39, index partiels |
| v2.6 | Sept défauts qui auraient cassé en exécution |
| v2.5 | Fuite résiduelle dans les chaînes, cycle de vie de `media_staging`, sauvegardes |
| v2.3 | Mise en conformité avec le récapitulatif |
| v2.2 | Corrections factuelles |

---