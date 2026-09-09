# Fiche de tâche

Codex peut préparer cette fiche depuis une demande simple. L'équipe valide les
points métier ; il ne faut pas transformer un exemple en contrat approuvé.
Conserver la fiche dans l'outil de suivi ou la documentation partagée.

## Besoin et critères

- Problème à résoudre, résultat attendu :
- Critères d'acceptation vérifiables :
- Périmètre et hors périmètre :
- Dépendances et points encore ouverts :

## Contrat et maquette

- Écran/capture/charte validée (frontend) :
- Méthode et chemin des routes existantes ou proposées :
- Entrées, sorties, erreurs, pagination :
- Schémas Zod partagés et tables concernés :
- Composants à réutiliser :
- Sécurité et données sensibles :

## Cas limites et tests proposés

Un test par comportement, nommé should_X_when_Y. Distinguer unitaire isolé,
intégration HTTP/BDD et, si nécessaire, E2E. Justifier chaque cas sans objet.

- Valeur absente/null/vide, bornes numériques :
- Chaîne très longue, Unicode, emojis :
- Collection vide ou volumineuse :
- Double soumission, concurrence, rejeu :
- Permissions sur la ressource précise :
- Entrée hostile, propriétés non autorisées :
- Échec à mi-parcours, panne/timeout externe :
- Temporalité/UTC si concerné :
- Frontend : chargement, vide, erreur, succès et trois largeurs :

## Validation avant développement

- Documentation accessible et critères complets :
- Alignement frontend/backend/design/BDD/infra si concernés :
- Présentation au Scrum Master avec dépendances :
- Approche validée par le responsable technique :
- Routes et liste de tests backend validées, date/référence :

Pour le backend, la phase 1 s'arrête à la proposition. Après validation, écrire
et lancer les tests rouges avant le code de production. Ne pas remplir les
lignes de validation à la place des personnes responsables.

## Livraison

- Fichiers créés/modifiés :
- Commandes et résultats (rouge puis vert en backend) :
- Couverture globale avant/après et sur le code changé :
- Captures frontend à 360/768/1280 px et contenus longs :
- Cas volontairement non traités et justification :
- Docs/ADR/contrat/changelog à jour :
- Grand ajout, E2E et relecteurs requis :
