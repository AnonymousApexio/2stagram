# AGENTS.md — frontend

Lire ../AGENTS.md. Si le contrat partagé change, lire aussi ../shared/AGENTS.md
et les règles backend.

## À partir d'une demande et d'une capture

1. Lire la fiche validée, la maquette, la charte, le contrat et les composants
   existants. Lister brièvement les composants réutilisés/créés, données et états.
2. Si le cadrage est déjà validé, intégrer dans ce périmètre. Sinon demander
   seulement le contrat, la maquette ou la décision métier manquante avant le
   code qui en dépend. Ne pas réclamer un accord déjà donné.
   Les états absents d'une capture suivent les composants validés ; soumettre
   un choix s'il n'existe aucun modèle.
3. Implémenter, vérifier le rendu quand un navigateur est disponible et corriger.
   Fournir les captures disponibles, fichiers modifiés et contrôles réalisés.
   Le développeur et le responsable design conservent la validation visuelle finale.

La charte du squelette est **provisoire** et le catalogue n'est pas implémenté.
Ne pas déclarer conforme un écran à une charte qui n'a pas été fournie.

## Stack et responsabilités

- React 19 fonctionnel + Hooks, Vite, React Router 8 pour naviguer.
- TypeScript strict, exports nommés, props explicites, TSDoc anglais sur les
  composants/hooks exportés. Fichiers PostCard.tsx, usePosts.ts,
  PostCard.module.css ; autres modules kebab-case.
- Réutiliser avant de créer : navigation, carte post, commentaire/formulaire,
  carte utilisateur, amitié, uploader, modale, messagerie, notification,
  visibilité, loader, erreurs, toasts.
- Composant → hook TanStack Query → service par domaine → API. fetch appartient
  aux services : aucune URL/requête dans les composants, aucun useEffect pour
  charger les données serveur. Préfixe /api/v1 dans une constante de service.
- Consommer uniquement le contrat validé. Schémas importés de @2stagram/shared,
  types dérivés avec z.infer, jamais réécrits côté frontend.
- **TanStack Query conserve les données serveur, sans recopie dans Zustand**,
  y compris profils et compteurs. L'état local reste dans React ; Zustand sert
  uniquement à l'état client partagé qui le nécessite. Les événements serveur
  mettent à jour ou invalident Query. Aucun store n'est créé par anticipation.
  Arbitrage applicable : ../docs/amendement-0001.md, sans nouvel accord à demander.
- Formulaires react-hook-form + resolver Zod. Pour tout écran connecté au serveur :
  chargement, vide, erreur, succès. Gérer envoi en cours, erreur et nouvelle
  tentative sans double soumission.
- socket.io-client pour le temps réel : actualiser/invalider Query, sans cache
  dupliqué dans Zustand. Pas de WebSocket maison ni de polling applicatif.
- react-easy-crop pour le recadrage ; filtres CSS pour l'aperçu, sharp serveur
  pour le rendu final. Attendre le contrat des paramètres avant cette feature.
- Vidéo native <video preload="metadata">, aucune bibliothèque ni vignette serveur.

## CSS et responsive

- CSS Modules sur les variables de la charte du responsable design. Seules exceptions
  globales : styles/variables.css et styles/reset.css, importées une fois au
  point d'entrée. Pas de :global pour contourner la portée locale.
- Pas de Tailwind, Bootstrap, MUI, CSS-in-JS ni nouveau paquet. Styles inline
  interdits, sauf l'exception approuvée pour l'aperçu de retouche : propriétés
  CSS personnalisées aux noms fixes, valeurs numériques finies et bornées par
  le contrat ; règles de filtres et de présentation dans le CSS Module.
  À l'intégration de l'éditeur, adapter le lint uniquement pour ce composant et
  ces propriétés, avec vérification des bornes. Aucun assouplissement général.
  Des préréglages utilisent des classes. Voir ../docs/amendement-0001.md §3.
- Couleurs, espacements, typographies et états hover/focus pris dans les tokens.
  Ne pas inventer la charte. Mobile d'abord, Flexbox/Grid, dimensions fluides
  (%, fr, min(), max(), clamp()), polices en rem.
- Aucune largeur/hauteur fixe en pixels sur un conteneur. Images/vidéos :
  max-width: 100%, ratio préservé, jamais étirées.
- Breakpoints validés et documentés par la charte : reporter leur valeur dans
  les media queries, car var() ne fonctionne pas dans leurs conditions.
  Les largeurs de test ne constituent pas de nouveaux breakpoints.
- Vérifier **360, 768 et 1280 px** : aucun débordement horizontal, texte lisible,
  zones tactiles d'au moins 44 × 44 px, hover/focus conformes.
- Tester pseudo très long, description de 2 000 caractères, mot sans espace,
  Unicode/emojis. Prévoir min-width: 0 et overflow-wrap où nécessaire ;
  ne pas rendre le contenu complet inaccessible par troncature.
- Composants ciblés ; au-delà de 200 lignes, envisager une séparation.
  La logique réutilisable va dans un hook, sans dupliquer la logique métier.

## Accessibilité et sécurité

- Balises sémantiques : button, a, nav, main, article, label ; aucun div/span
  cliquable. button type="button" hors soumission de formulaire.
- Associer chaque champ à un label ; alt adapté, boutons à icône nommés,
  navigation clavier et focus visible, contrastes de la charte.
- Une modale gère focus, retour au déclencheur et fermeture clavier.
  Afficher les erreurs près des champs avec un message permettant de corriger.
- Afficher les chaînes externes comme texte. Aucun HTML brut :
  dangerouslySetInnerHTML interdit, DOMPurify n'est pas installé dans la stack.
- Aucun secret/token dans le frontend ni stockage navigateur. Cookie de session
  httpOnly : ne pas chercher à le lire depuis JavaScript.
- Masquer un bouton ne protège pas la ressource. Le serveur revérifie accès,
  taille et format des uploads, indépendamment du contrôle côté client.

## Vérifier et livrer

Vitest + Testing Library, tests colocalisés .test.ts(x), should_X_when_Y.
Tester les comportements/états visibles par rôle et texte, pas les classes CSS
ou les snapshots seuls. Simuler le réseau en unitaire.

Après intégration : npm run check, rendu aux trois largeurs et contenus longs.
Les smokes du squelette ne remplacent pas les tests de l'écran.
Joindre dans la PR captures, écarts assumés, états vérifiés et tests exécutés.
La revue humaine reste requise même si Codex a inspecté des captures.
