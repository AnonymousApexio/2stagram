# Amendement 0001 — Règles du squelette

Version 1.0, adoptée le 10 septembre 2026 par le responsable technique.
Cet amendement fixe les règles applicables aux contributions. Les consignes
AGENTS.md et les guides du dépôt en reprennent les décisions.

## 1. Propriété des états

TanStack Query possède les données serveur, notamment le profil courant et les
compteurs de messages et notifications. Les mutations et événements Socket.io
actualisent ou invalident ce cache, sans copie dans Zustand.

L'état local d'un composant reste dans React. Zustand sert uniquement à l'état
client partagé qui le nécessite ; aucun store n'est créé par anticipation.

## 2. Grand ajout et tests

L'ajout d'une route ne classe pas à lui seul une modification en grand ajout.
Une route qui implémente un contrat déjà validé est évaluée selon son impact.
La classification reste requise pour une intégration externe, une évolution de
schéma ou de contrat, un flux critique (auth, permissions, export, suppression)
ou une refonte transverse.

Les tests unitaires et d'intégration adaptés restent obligatoires. Les E2E
métier sont limités aux parcours inscription, publication et signalement ;
ils sont lancés pour les grands ajouts une fois les parcours disponibles.
Un parcours nécessaire mais absent doit être implémenté avec la fonctionnalité,
jamais annoncé comme validé. Les tests d'intégration existants tournent à chaque PR.

## 3. CSS Modules et aperçu de retouche

Les styles sont définis dans les CSS Modules, sur les tokens de la charte.
Seuls `variables.css` et `reset.css` restent globaux au point d'entrée.

Pour les paramètres continus du futur éditeur de retouche, l'exception suivante
est autorisée : transmettre au composant de prévisualisation uniquement des
propriétés CSS personnalisées numériques, finies et bornées par le contrat.
Les noms de propriétés sont fixes ; les règles de filtre et de présentation
restent dans son CSS Module. Les chaînes CSS arbitraires sont interdites.
Un choix entre préréglages utilise des classes CSS.

À l'intégration de l'éditeur, adapter le lint uniquement pour ce composant et
ces propriétés et tester le refus des valeurs hors contrat. L'accord de principe
n'est pas à redemander ; le contrat des paramètres reste à définir. Le squelette
conserve son interdiction générale des styles inline tant que l'éditeur est absent.

## 4. Exception documentaire temporaire

Le responsable technique accepte temporairement les deux avis `image-size`
identifiés dans le [suivi des dépendances](./dependances.md), exclusivement dans
la génération Docusaurus. L'acceptation commence le 10 septembre 2026 à 00:00 (heure de Paris)
et expire le 10 octobre 2026 à 00:00 (heure de Paris), borne exclue, sans reconduction automatique.
Le suivi définit les mesures, le contrôle exécutable et les conditions de clôture.

## Application

Les `AGENTS.md`, les guides et la CI appliquent ces décisions. Le périmètre reste
un squelette : aucune page métier, route, table ou fonctionnalité de retouche
n'est ajoutée par cet amendement. Les validations de contrat et les revues de
fonctionnalités conservent leur rôle.
