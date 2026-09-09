const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];
const APPROVED_AT = Date.parse('2026-09-10T00:00:00+02:00');
/** Exclusive deadline of the approved, non-renewing documentation exception. */
export const DOCS_AUDIT_EXPIRES_AT = '2026-10-10T00:00:00+02:00';
const ADVISORIES = new Set([
  'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
  'https://github.com/advisories/GHSA-5p2g-fcmc-qvqq',
]);

interface Vulnerability {
  severity: string;
  via: unknown[];
  fixAvailable: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readVulnerabilities(report: unknown): Map<string, Vulnerability> {
  if (
    !isRecord(report) ||
    report.error !== undefined ||
    report.auditReportVersion !== 2 ||
    !isRecord(report.vulnerabilities) ||
    !isRecord(report.metadata) ||
    !isRecord(report.metadata.vulnerabilities)
  )
    throw new Error('Rapport npm absent, incomplet ou non reconnu.');

  const entries = new Map<string, Vulnerability>();
  const counts = new Map(SEVERITIES.map((severity) => [severity, 0]));
  for (const [name, value] of Object.entries(report.vulnerabilities)) {
    if (
      !isRecord(value) ||
      value.name !== name ||
      typeof value.severity !== 'string' ||
      !counts.has(value.severity) ||
      !Array.isArray(value.via) ||
      value.via.length === 0
    )
      throw new Error(`Entrée d'audit invalide : ${name}.`);
    entries.set(name, {
      severity: value.severity,
      via: value.via,
      fixAvailable: value.fixAvailable,
    });
    counts.set(value.severity, (counts.get(value.severity) ?? 0) + 1);
  }
  const totals = report.metadata.vulnerabilities;
  if (
    totals.total !== entries.size ||
    SEVERITIES.some((severity) => totals[severity] !== counts.get(severity))
  )
    throw new Error('Le détail du rapport ne correspond pas aux totaux npm.');
  return entries;
}

function isAccepted(
  name: string,
  entries: Map<string, Vulnerability>,
  path: Set<string> = new Set(),
): boolean {
  const entry = entries.get(name);
  if (
    !entry ||
    path.has(name) ||
    entry.severity !== 'high' ||
    entry.fixAvailable !== false ||
    (name !== 'image-size' && !name.startsWith('@docusaurus/'))
  )
    return false;
  const nextPath = new Set([...path, name]);
  return entry.via.every((cause) => {
    if (typeof cause === 'string') return isAccepted(cause, entries, nextPath);
    return (
      name === 'image-size' &&
      isRecord(cause) &&
      cause.name === 'image-size' &&
      cause.dependency === 'image-size' &&
      cause.severity === 'high' &&
      typeof cause.url === 'string' &&
      ADVISORIES.has(cause.url)
    );
  });
}

/**
 * Checks every high/critical finding and its causes without hiding the raw report.
 * @param report - Untrusted JSON returned by npm audit in the docs-site directory.
 * @param now - Current epoch time; injectable for deadline boundary tests.
 * @returns Accepted and blocking package names, including transitive findings.
 * @throws If the report is incomplete, inconsistent or has an unknown format.
 */
export function evaluateDocsAudit(
  report: unknown,
  now: number = Date.now(),
): { accepted: string[]; blocked: string[] } {
  const entries = readVulnerabilities(report);
  const isActive =
    now >= APPROVED_AT && now < Date.parse(DOCS_AUDIT_EXPIRES_AT);
  const result: { accepted: string[]; blocked: string[] } = {
    accepted: [],
    blocked: [],
  };
  for (const [name, entry] of entries) {
    if (entry.severity !== 'high' && entry.severity !== 'critical') continue;
    if (isActive && isAccepted(name, entries)) result.accepted.push(name);
    else result.blocked.push(name);
  }
  return result;
}
