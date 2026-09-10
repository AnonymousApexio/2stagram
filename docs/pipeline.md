# Pipeline d'intégration continue

Cette documentation reprend la conception de la PR #4 et décrit les workflows
du squelette TypeScript de la PR #3, après consolidation. Les commandes et les
critères de grand ajout suivent l'[amendement 0001](./amendement-0001.md).

Les fichiers YAML préparent les contrôles. Les protections de branche,
approbations requises et réglages SonarCloud doivent être vérifiés dans GitHub ;
leur activation n'est pas attestée par ce document.

## 1. Objectif

Vérifier le format, le code, les tests, les dépendances et les images avant
fusion. Une protection de `main` doit rendre les checks et la revue humaine
obligatoires. Un scan SonarCloud absent n'est pas une Quality Gate validée.

## 2. Déclenchement

| Événement                                                           | Contrôles                                                       |
| ------------------------------------------------------------------- | --------------------------------------------------------------- |
| Ouverture, mise à jour ou réouverture d'une PR, toute branche cible | CI (`quality`, `docker`, `browser-smoke`) et audit documentaire |
| Push sur `main`, notamment après fusion                             | CI ; audit documentaire si ses fichiers surveillés changent     |
| Lancement manuel de CI                                              | Mêmes jobs que CI                                               |
| PR portant le label `grand-ajout`, ou lancement manuel des E2E      | Parcours métier Playwright                                      |
| Chaque jour ou lancement manuel de Documentation                    | Audit documentaire ; build du site uniquement en manuel         |

Le workflow CI écoute les push sur `main`, mais ne les interdit pas lui-même.
L'interdiction du push direct se règle dans la protection de branche.

## 3. Les sept portes du projet

La numérotation suit la convention §4.4 et le plan §2. Elle identifie les
conditions de fusion, pas sept jobs exécutés dans cet ordre. L'ancienne
décomposition de la PR #4 en sept contrôles techniques ne remplace pas ces portes.

| #   | Porte             | Mise en œuvre                                                                                | Condition à satisfaire                                                                   |
| --- | ----------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Build             | `npm run build`, job `docker`                                                                | Shared et frontend construits, images et démarrage vérifiés                              |
| 2   | Tests unitaires   | Vitest dans `npm run test:coverage`                                                          | Tous les tests passent ; les tests HTTP d'intégration restent distincts                  |
| 3   | Couverture        | Vitest, rapports et SonarCloud                                                               | 70 % lignes/branches nouvelles ou modifiées et aucune baisse globale                     |
| 4   | Analyse statique  | Format, ESLint, types, SonarCloud, audits et SBOM dans `quality` ; audit documentaire séparé | Aucun blocage, avec la seule exception documentaire datée approuvée                      |
| 5   | Revue humaine     | Approbations GitHub                                                                          | Responsable technique, DevOps pour cette PR et revue sécurité des entrées HTTP           |
| 6   | E2E conditionnels | Job `critical-journeys`                                                                      | Parcours requis par un grand ajout réussis ; absence de parcours justifiée pour le socle |
| 7   | Fusion            | Protection de `main` et action humaine                                                       | Toutes les portes applicables satisfaites, aucun contournement                           |

Les portes 3, 4, 5 et 7 ne sont pas entièrement attestées par les seuls tests
locaux : configuration SonarCloud, comparaison de couverture, protections et
approbations restent à contrôler. Les smokes navigateur complètent les portes
techniques mais ne remplacent pas les E2E métier.

`npm run test:cov` reste un alias de `npm run test:coverage` pour les anciennes
contributions. La configuration Vitest inclut backend, frontend, shared et les
tests d'outillage ; les tests HTTP restent des tests d'intégration.

## 4. Ordre d'exécution

Le job `quality` exécute les étapes dans cet ordre :

1. Installation reproductible avec `npm ci`.
2. `npm run check` : format, lint, types, couverture, puis build.
3. Audit applicatif et génération de `sbom.json`.
4. Vérification Conventional Commits pour les commits d'une PR.
5. Archivage des rapports, également tenté si une étape précédente échoue.
6. Analyse SonarCloud et attente de sa Quality Gate, si configurée et autorisée.

SonarCloud consomme `coverage/lcov.info`. Le scan s'active lorsque
`SONAR_PROJECT_KEY` est renseigné et, pour une PR, lorsque sa branche provient
du même dépôt. Il nécessite aussi `SONAR_ORGANIZATION` et le secret `SONAR_TOKEN`.
Les PR issues d'un fork ne reçoivent pas ce secret.

Le job `docker` dépend de la réussite de `quality` (`needs: quality`). Il vérifie
les deux images, attend les services et teste la page via nginx. Le nettoyage
des conteneurs est tenté même après un échec.

`browser-smoke` s'exécute en parallèle de `quality`. Il teste le démarrage du
frontend à 360, 768 et 1280 pixels ; ce n'est pas une suite E2E métier.
La revue humaine et les checks requis conditionnent ensuite la fusion.

Le [schéma PNG initial](./pipeline.png) est conservé comme archive de conception.
Il ne décrit pas l'ordonnancement consolidé ci-dessus.

## 5. Parcours E2E

Le workflow E2E se déclenche manuellement ou pour une PR portant `grand-ajout`.
Il réévalue les labels à leur ajout/retrait et aux mises à jour de la PR.

Selon l'amendement 0001, un grand ajout concerne une intégration externe, une
évolution de schéma ou de contrat, un flux critique ou une refonte transverse.
**L'ajout d'une route ne suffit pas à lui seul.** La classification est humaine.

Les parcours prévus sont inscription, publication et signalement.
La messagerie reste contrôlée manuellement. Aucun parcours métier n'est encore
implémenté : `npm run test:e2e` échoue avec « No tests found » jusqu'à leur ajout.
Un parcours nécessaire doit accompagner sa fonctionnalité.

## 6. Couverture, rapports et documentation

Vitest exige 70 % des lignes et branches par fichier inclus. La couverture du
nouveau code et l'absence de baisse globale nécessitent aussi une comparaison
avant/après et les réglages SonarCloud décrits dans [outillage.md](./outillage.md).

| Artefact                                     | Producteur                         | Usage                                     |
| -------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| `coverage/lcov.info`                         | Vitest                             | SonarCloud                                |
| `coverage/coverage-summary.json` et rapports | Vitest                             | Comparaison et artefact `quality-reports` |
| `sbom.json`                                  | `npm sbom --sbom-format cyclonedx` | Inventaire dans `quality-reports`         |
| Images Docker                                | Docker Compose                     | Contrôle local au job, sans publication   |
| `test-results/`                              | Smoke Playwright                   | Diagnostic en cas d'échec                 |
| `docs-site/audit-report.json`                | Audit documentaire                 | Rapport complet conservé 30 jours en CI   |

L'audit documentaire s'exécute sur toutes les PR pour que son check puisse être
requis sans rester en attente à cause d'un filtre de chemins. Le build manuel
du site dépend de cet audit et sa génération est limitée à dix minutes.

L'audit applicatif bloque à partir de `high`. L'audit documentaire applique
uniquement l'exception temporaire des deux avis `image-size`, jusqu'au
10 octobre 2026 à 00:00, heure de Paris, borne exclue. Les vulnérabilités restent
présentes ; voir [le suivi des dépendances](./dependances.md).

## 7. Secrets et actions

- Les secrets sont fournis via GitHub Secrets, jamais dans les sources.
- `.env` et ses variantes sont ignorés ; `.env.example` décrit les variables.
- `npm run setup` crée un secret local aléatoire sans écraser un `.env` existant.
- Les workflows utilisent `contents: read` et n'exposent pas Sonar aux forks.
- Les actions sont épinglées à des SHA de commit complets. Dependabot surveille
  leurs mises à jour dans `.github/dependabot.yml`.

Références : [OWASP CI/CD Security](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)
et [sécurité GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use).

## 8. Vérifier avant de pousser

Avec Node 24.15 ou plus récent dans la branche 24 et npm 11 ou 12 :

```bash
npm ci
npm run check
npm run audit:dependencies
npm exec --no -- playwright install chromium
npm run test:smoke
```

Pour les modifications documentaires :

```bash
npm ci --prefix docs-site
npm run audit:docs
npm run docs:site
```

Les hooks Husky sont installés par `npm ci` dans un dépôt Git : `lint-staged`
au pré-commit, puis `commitlint` sur le message. Ils complètent les contrôles CI.
La configuration GitHub restant à vérifier est détaillée dans
[outillage.md](./outillage.md#activation-dans-github).
