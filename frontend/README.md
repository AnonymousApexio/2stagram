# Frontend

React + Vite, TypeScript strict. Le point d'entrée affiche uniquement le nom du
projet. Aucun écran métier ni composant de catalogue n'est encore implémenté.
Lire AGENTS.md avant d'intégrer une maquette.

Depuis la racine : npm ci, npm run setup, npm run dev:frontend.
Tests : npm test -w @2stagram/frontend. Build : npm run build.
Contrôle navigateur du socle : npm run test:smoke après installation de Chromium
avec npm exec --no -- playwright install chromium.

La charte dans styles/ est provisoire. Les composants futurs utiliseront les
CSS Modules, les contrats shared et les états prévus dans les consignes.
