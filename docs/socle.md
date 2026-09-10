# Périmètre du squelette

Le dépôt fournit le socle technique pour les futures fonctionnalités.
Les règles de contribution et les décisions sont documentées dans le dépôt.

## Préparation

- Installer les versions épinglées dans les manifestes et les lockfiles.
- Préparer Vite, React et Express avec des points d'entrée minimaux.
- Configurer TypeScript, ESLint, Prettier, Vitest et Playwright.
- Préparer Docker, nginx, les hooks Git et les workflows GitHub Actions.
- Rendre les commandes et la documentation exécutables et cohérentes.

Le frontend démarre avec un titre provisoire. Il ne consomme aucune route
d'API et ne contient aucune page métier. Aucun composant du catalogue n'est
encore implémenté. Le backend écoute et renvoie une erreur JSON pour les routes
inconnues. Les dossiers métier restent réservés aux futures tâches.

## Vérifications du démarrage

Les tests d'intégration HTTP vérifient notamment :

- `should_return_json_error_when_route_is_unknown`
- `should_reject_invalid_json_when_body_is_malformed`
- `should_reject_large_json_when_body_exceeds_limit`
- `should_send_security_headers_when_request_is_received`

Ils vérifient aussi la réponse 500 sans fuite de détails internes. Des tests
unitaires couvrent les adresses du serveur, les erreurs de démarrage, les signaux
d'arrêt et le montage React avec ou sans élément racine. Ces tests de
caractérisation du socle ne sont pas des fonctionnalités métier.

La couverture inclut tous les fichiers TypeScript applicatifs, même non importés
par les tests, et les points d'entrée. Seuls les tests et déclarations de types
sont exclus du périmètre src/. La commande et la politique d'audit documentaire
sont également testées et incluses dans la couverture. Les autres scripts et
configurations restent vérifiés par leurs commandes propres.

Le contrôle navigateur du socle est distinct des trois futurs parcours E2E :
inscription, publication et signalement. Il valide uniquement le chargement et
l'absence de débordement à 360, 768 et 1280 px.

## À fournir avant les fonctionnalités

- Schéma Drizzle et table de sessions validés par le responsable BDD.
- Contrats d'API et schémas Zod des domaines.
- Maquettes, charte et spécifications des composants.
- Contrat commun de recadrage et de filtres.
- Identifiants du dépôt GitHub et de l'organisation SonarCloud.

Les bibliothèques prévues pour l'authentification, les uploads et le temps réel
sont installées, mais leurs fonctionnalités ne sont pas activées.

## Place dans le plan du projet

La consolidation a été confrontée à la stack v1.6, à la convention v1.0 et au
plan v2.1. Les 40 versions de paquets de l'annexe de la stack correspondent aux
manifestes applicatifs. Ce contrôle de versions ne vaut ni audit de sécurité
sans réserve, ni validation des fonctionnalités.

| Sections du plan       | Livré dans cette PR                                      | Suite nécessaire                                                                  |
| ---------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 0. Stack               | Workspaces et outils retenus, ADR                        | Revue technique du socle                                                          |
| 1. BDD                 | Dépendances, emplacement `shared/src/db/`, volume        | Schéma validé avec `sessions`, pragmas, migrations, seed et sauvegardes           |
| 2. Docker et CI        | Images, proxy, hooks, contrôles et documentation         | Protections GitHub, SonarCloud et approbations effectives                         |
| 3. Design              | Variables CSS explicitement provisoires                  | Charte, maquettes et catalogue avant les écrans                                   |
| 4 à 14. Backend métier | Dépendances et couches réservées                         | Contrats, tests et fonctionnalités, sans endpoint anticipé                        |
| 15, 16 et 18. Frontend | Montage React et dossiers réservés                       | Pages, composants, services et états après maquettes/contrats                     |
| 12 et 17. Retouche     | Outils client et serveur installés                       | Contrat commun puis aperçu client et rendu final serveur                          |
| 19. Transverse         | Helmet, limite JSON, erreurs normalisées, TypeDoc et ADR | Logs HTTP avec redaction, sessions/CSRF, rate limits et OpenAPI au fil des routes |
| 20. Ordonnancement     | Socle utilisable par les pôles en parallèle              | Auth après schéma `sessions`, front après maquettes et contrats                   |

Les sections métier non réalisées ne sont pas des oublis à combler dans cette
PR : leur Definition of Ready et leurs validations restent requises. La
consolidation ne doit pas empiéter sur le schéma BDD ou les fonctionnalités
portées par les autres contributions.

## Divergences documentaires résolues

- Le plan cite encore la stack v1.4 ; le contrôle de cette PR utilise la v1.6
  fournie, notamment TypeScript natif Node 24, TypeDoc et Docusaurus isolé.
- Le plan §1 note `shared/db/schema.ts` ; l'arborescence réelle réserve
  `shared/src/db/schema.ts`. Il ne faut pas créer un second schéma parallèle.
- Le plan §19 attribue le préfixe à nginx ; la règle du dépôt place `/api/v1`
  dans Express et la future constante frontend. Les proxys le conservent sans
  réécriture ni double préfixe, conformément au [contrat API](./api/README.md).
- La répartition Query/Zustand du plan §18 et le critère « nouvelle route »
  de la convention §4.4 suivent l'[amendement 0001](./amendement-0001.md).
  Cet amendement encadre aussi les styles du futur aperçu de retouche.
- L'annexe d'outillage de la convention laisse les runners à décider ; la
  stack les fixe à Vitest et Playwright. Les [sept portes](./pipeline.md)
  gardent la numérotation de la convention, pas celle de l'ancien schéma PNG.

Les documents originaux restent hors du dépôt. Ces précisions rendent le socle
compréhensible par l'équipe sans recopier des documents privés ni prétendre
modifier leur statut d'approbation.
