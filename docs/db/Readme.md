# Schéma de base de données — 2stagram

**Version 4.7 — 29 septembre 2026.** Validée par Nat. **Référence pour les
autres documents du projet.**

La documentation tient en **deux fichiers, plus cette carte**. Ils forment un
seul document : même numéro de version, numérotation de sections commune.

23 tables, 10 domaines, 64 décisions. SQLite, Drizzle, better-sqlite3. Le
schéma est défini dans `shared/src/db/schema.ts` — **c'est le seul fichier à
modifier**.

---

## Les fichiers

| Fichier | Sections | Ce qu'il contient |
|---|---|---|
| [`tables-et-contraintes.md`](tables-et-contraintes.md) | §1 à §8, §10 | **La référence.** Les 23 tables, les contraintes, les pièges de SQLite, la sécurité, l'annexe SQL |
| [`decisions-de-conception.md`](decisions-de-conception.md) | §0 | **Le pourquoi.** Les 64 décisions D1 à D64, l'état du récapitulatif, le journal des versions |

---

## Par où commencer

**Je cherche une règle précise** — une colonne nullable ou non, une contrainte,
un format de date → `tables-et-contraintes.md` §4 pour les tables, §10 pour le SQL des
contraintes.

**Je veux comprendre pourquoi c'est comme ça** → `decisions-de-conception.md` §0.1. Les 64
décisions y sont numérotées ; le document renvoie à elles sous la forme
**[D50]**.

**Je code l'authentification ou la publication** → `tables-et-contraintes.md` §4, la table
concernée. Chaque règle y est écrite avec la décision qui la fonde.

---

## Renvois

**La numérotation est commune aux deux fichiers.** `§4.3` désigne la même
section vue de n'importe où, et le tableau ci-dessus dit dans quel fichier elle
se trouve. Les renvois sont **textuels, pas cliquables** : c'est délibéré — un
lien d'un fichier à l'autre casse à la première renumérotation. On les suit
avec une recherche dans le fichier.

Les décisions se citent **[D1]** à **[D64]** et vivent dans `decisions-de-conception.md`.

---

## Ce qui fait foi

| Question | Document |
|---|---|
| Une règle métier — qui voit quoi, ce qui se passe à tel geste | **Récapitulatif fonctionnel v2** (Kleiton) |
| Le schéma — colonnes, types, contraintes, index | **`tables-et-contraintes.md`** |

En cas de contradiction avec un autre document du projet, **celui-ci l'emporte
pour le schéma**, et le récapitulatif pour le métier.

---

## Dépendances

Outils dont le schéma dépend, en plus de la stack du projet.

| Dépendance | Pourquoi | Statut |
|---|---|---|
| `libphonenumber-js` (`/max`) | Numéros au format E.164, France par défaut | **Validé** |
| Assainissement SVG | XSS stocké | À la charge du service média |
| **exiftool** | Métadonnées vidéo, en remux | **Validé**, `libimage-exiftool-perl` |
| Extension **JSON1** | `idx_sessions_user_id` | Active par défaut, à vérifier au démarrage |
| Client SMTP, fournisseur SMS | Réinitialisation du mot de passe | Différés |

---

## État

| | |
|---|---|
| Décisions prises | 64 sur 64 |
| Points ouverts | 1 — la réinitialisation du mot de passe par SMS (récapitulatif, « Décisions ouvertes ») |
| Relecture | Validée par Nat le 28/09 |