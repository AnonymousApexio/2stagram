# Travailler avec Codex

Ouvrir **le dossier 2stagram**, puis une nouvelle session Codex. Les règles
communes sont dans AGENTS.md ; ce fichier demande de lire les consignes frontend,
backend et shared selon la mission. Pas besoin de recopier toutes les règles.
La détection automatique suit la racine du projet jusqu'au dossier de travail ;
les renvois explicites couvrent les autres périmètres.
[Référence officielle OpenAI](https://learn.chatgpt.com/fr-FR/docs/agent-configuration/agents-md).

## Frontend

Joindre la capture du responsable design et décrire simplement le résultat attendu :

> Applique AGENTS.md. Intègre l'écran [nom] d'après cette capture.
> La fiche [référence] et la charte sont validées.

Codex doit examiner l'existant, réutiliser les composants, respecter les contrats
et intégrer les états chargement, vide, erreur et succès. S'il manque une décision,
il prépare une question ciblée ; il ne crée pas de contrat d'API au hasard.

Lancer npm run dev, ouvrir le navigateur et vérifier à **360, 768 et 1280 px** :

- aucun débordement horizontal ni texte illisible/coupé ;
- zones tactiles utilisables et comportement clavier ;
- fidélité à la maquette, hover/focus, quatre états ;
- pseudo très long, description longue et mot sans espace.

Décrire à Codex ce qui ne va pas ; refaire la vérification après correction.
Codex peut inspecter le rendu s'il dispose d'un navigateur ou de captures, mais
cela ne remplace pas le contrôle du développeur et la validation du responsable design.
Ne pas accepter Tailwind ou un nouveau paquet hors stack.
Préparer ensuite la PR avec captures et résultats des tests pour le responsable technique.

## Backend

Une seule demande en langage naturel suffit pour commencer :

> Applique AGENTS.md. Fonctionnalité : [besoin en une ou deux phrases].
> Fiche de tâche : [référence ou critères d'acceptation].

**Première réponse : routes proposées et liste de tests seulement.** Codex
s'arrête pour validation. La fiche doit respecter la Definition of Ready
(documentation, alignement des pôles, présentation au Scrum Master, validation du responsable technique).

Après validation réelle, répondre :

> Je valide les routes et la liste de tests ci-dessus. Passe à la phase 2.

Codex doit écrire les tests, les exécuter et montrer les échecs avant de coder
l'implémentation, puis fournir les résultats verts. Refuser une simple affirmation
« tests OK » sans commande et résultat. Le responsable technique relit ensuite code et tests à la PR.
Un test sans assertion utile n'est pas une preuve de fiabilité.

## Ce que l'équipe garde en main

Les AGENTS.md sont des consignes, pas une garantie. Les contrôles locaux, la CI
et la revue humaine se complètent. La validation ne s'invente pas : une tâche
non validée reste au cadrage. Aucun push, merge, publication ou message à un
collègue n'est effectué sans autorisation.

Le modèle [de fiche](./gabarit-tache.md), la [revue](./revue-pr.md) et
[l'état du socle](./conformite.md) servent de référence commune.
