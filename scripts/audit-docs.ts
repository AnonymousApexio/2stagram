import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import {
  DOCS_AUDIT_EXPIRES_AT,
  evaluateDocsAudit,
} from './docs-audit-policy.ts';

const ENV = { ...process.env };
// npm 12 must read its script policy from config, not a forwarded CLI option.
delete ENV.npm_config_allow_scripts;
const NPM_PATH = ENV.npm_execpath;
if (!NPM_PATH || process.argv.length !== 2) {
  throw new Error('Utiliser npm run audit:docs sans argument supplémentaire.');
}

const RESULT = spawnSync(
  process.execPath,
  [NPM_PATH, 'audit', '--json', '--audit-level=high'],
  {
    cwd: new URL('../docs-site/', import.meta.url),
    env: ENV,
    encoding: 'utf8',
    timeout: 60_000,
    killSignal: 'SIGKILL',
    maxBuffer: 10 * 1024 * 1024,
  },
);
const RAW_REPORT = RESULT.stdout ?? '';
writeFileSync(
  new URL('../docs-site/audit-report.json', import.meta.url),
  RAW_REPORT,
);
process.stdout.write(RAW_REPORT);
process.stderr.write(RESULT.stderr ?? '');

try {
  if (
    RESULT.error ||
    RESULT.signal ||
    (RESULT.status !== 0 && RESULT.status !== 1)
  ) {
    throw new Error('Échec de npm audit : le contrôle reste bloquant.');
  }
  const report: unknown = JSON.parse(RAW_REPORT);
  const { accepted, blocked } = evaluateDocsAudit(report);
  if (RESULT.status === 1 && accepted.length === 0 && blocked.length === 0) {
    throw new Error(
      'Échec npm sans alerte correspondante : contrôle non validé.',
    );
  }
  if (accepted.length > 0) {
    console.warn(
      `Exception documentaire jusqu'au ${DOCS_AUDIT_EXPIRES_AT} (exclu) : ` +
        `${accepted.join(', ')}. Les avis restent présents dans le rapport.`,
    );
  }
  if (blocked.length > 0) {
    console.error(`Alertes bloquantes : ${blocked.join(', ')}.`);
  }
  console.log(
    `Audit documentaire : ${accepted.length} exceptions, ${blocked.length} blocages.`,
  );
  process.exitCode = blocked.length > 0 ? 1 : 0;
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Audit documentaire invalide.',
  );
  process.exitCode = 1;
}
