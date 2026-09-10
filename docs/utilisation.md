# Installation et utilisation du squelette

Installer Node 24 (au moins 24.15), avec npm 11 ou 12. Dans le dossier du projet :

```bash
npm ci
npm run setup
npm run dev
```

Le titre provisoire est visible sur http://127.0.0.1:5173. Le frontend ne contient
encore aucun parcours utilisateur. Le backend écoute sur le port 3000.

Pour Docker, utiliser `npm start` après `npm run setup`, puis ouvrir
http://127.0.0.1:8080. `WEB_PORT` dans `.env` permet de choisir un autre port.
`npm run stop` conserve les volumes pour les prochains démarrages.

## Documentation des fonctionnalités

Les guides d'inscription, de publication, de messagerie et de modération seront
écrits avec les fonctionnalités et leurs captures. Ils ne sont pas simulés dans
ce squelette.
