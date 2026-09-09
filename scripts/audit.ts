import { spawnSync } from 'node:child_process';

const ENV = { ...process.env };
// npm 12 can forward .npmrc policy as a forbidden CLI option.
// Removing it from the environment lets npm read .npmrc and package.json again.
delete ENV.npm_config_allow_scripts;
const NPM_PATH = ENV.npm_execpath;
if (!NPM_PATH) throw new Error('Lancer cet audit avec npm run.');

const RESULT = spawnSync(
  process.execPath,
  [NPM_PATH, 'audit', '--audit-level=high', ...process.argv.slice(2)],
  { env: ENV, stdio: 'inherit' },
);
process.exitCode = RESULT.status ?? 1;
