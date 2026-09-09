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
