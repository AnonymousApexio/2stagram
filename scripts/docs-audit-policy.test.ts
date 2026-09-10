import { describe, expect, it } from 'vitest';
import { evaluateDocsAudit } from './docs-audit-policy.ts';

const NOW = Date.parse('2026-09-10T12:00:00Z');
const ICNS = 'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr';
const HEIF = 'https://github.com/advisories/GHSA-5p2g-fcmc-qvqq';

function advisory(url = ICNS) {
  return {
    name: 'image-size',
    dependency: 'image-size',
    severity: 'high',
    url,
  };
}

function entry(name: string, via: unknown[], severity = 'high') {
  return { name, severity, via, fixAvailable: false };
}

function report(entries: ReturnType<typeof entry>[] = []) {
  const counts: Record<string, number> = {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: entries.length,
  };
  for (const item of entries) {
    counts[item.severity] = (counts[item.severity] ?? 0) + 1;
  }
  return {
    auditReportVersion: 2,
    vulnerabilities: Object.fromEntries(
      entries.map((item) => [item.name, item]),
    ),
    metadata: { vulnerabilities: counts },
  };
}

function knownReport() {
  return report([
    entry('image-size', [advisory(), advisory(HEIF)]),
    entry('@docusaurus/mdx-loader', ['image-size']),
    entry('@docusaurus/core', ['@docusaurus/mdx-loader']),
  ]);
}

describe('documentation audit exception', () => {
  it('should_accept_known_causes_when_exception_is_active', () => {
    expect(evaluateDocsAudit(knownReport(), NOW)).toEqual({
      accepted: ['image-size', '@docusaurus/mdx-loader', '@docusaurus/core'],
      blocked: [],
    });
  });

  it.each(['2026-09-09T22:00:00Z', '2026-10-09T21:59:59.999Z'])(
    'should_accept_when_inside_the_approved_period_%s',
    (date) => {
      expect(
        evaluateDocsAudit(knownReport(), Date.parse(date)).blocked,
      ).toEqual([]);
    },
  );

  it.each([
    '2026-09-09T21:59:59.999Z',
    '2026-10-09T22:00:00Z',
    '2027-01-01T00:00:00Z',
    'invalid',
  ])('should_block_known_causes_when_outside_the_period_%s', (date) => {
    const result = evaluateDocsAudit(knownReport(), Date.parse(date));
    expect(result.accepted).toEqual([]);
    expect(result.blocked).toHaveLength(3);
  });

  it('should_pass_when_no_vulnerability_remains_after_expiry', () => {
    expect(evaluateDocsAudit(report(), Date.parse('2027-01-01'))).toEqual({
      accepted: [],
      blocked: [],
    });
  });

  it('should_block_new_advisories_and_their_dependents_when_mixed_with_known_ones', () => {
    const data = knownReport();
    data.vulnerabilities['image-size']?.via.push(
      advisory('https://github.com/advisories/GHSA-new'),
    );
    expect(evaluateDocsAudit(data, NOW).blocked).toHaveLength(3);
  });

  it.each(['high', 'critical'])(
    'should_block_an_unrelated_%s_vulnerability',
    (severity) => {
      const data = report([
        entry('image-size', [advisory()]),
        entry(
          'another-package',
          [advisory('https://github.com/advisories/GHSA-new')],
          severity,
        ),
      ]);
      expect(evaluateDocsAudit(data, NOW)).toEqual({
        accepted: ['image-size'],
        blocked: ['another-package'],
      });
    },
  );

  it('should_block_when_a_known_advisory_becomes_critical', () => {
    const data = report([
      entry(
        'image-size',
        [{ ...advisory(), severity: 'critical' }],
        'critical',
      ),
    ]);
    expect(evaluateDocsAudit(data, NOW).blocked).toEqual(['image-size']);
  });

  it.each([
    { ...advisory(), severity: 'critical' },
    { ...advisory(), dependency: 'another-package' },
    { ...advisory(), name: 'another-package' },
    { ...advisory(), url: `${ICNS}/unexpected` },
    null,
  ])('should_block_when_advisory_details_do_not_match_%j', (cause) => {
    expect(
      evaluateDocsAudit(report([entry('image-size', [cause])]), NOW).blocked,
    ).toEqual(['image-size']);
  });

  it('should_block_when_a_fix_becomes_available', () => {
    const data = knownReport();
    const image = data.vulnerabilities['image-size'];
    if (!image) throw new Error('Missing fixture');
    image.fixAvailable = true;
    expect(evaluateDocsAudit(data, NOW).blocked).toHaveLength(3);
  });

  it.each([
    entry('@docusaurus/core', ['missing-package']),
    entry('@docusaurus/core', ['@docusaurus/core']),
    entry('another-package', ['image-size']),
  ])('should_block_unresolved_or_out_of_scope_chains_%j', (item) => {
    const data = report([entry('image-size', [advisory()]), item]);
    expect(evaluateDocsAudit(data, NOW).blocked).toEqual([item.name]);
  });

  it('should_block_when_only_one_branch_of_a_dependency_is_accepted', () => {
    const data = report([
      entry('image-size', [advisory()]),
      entry('@docusaurus/core', ['image-size', 'missing-package']),
    ]);
    expect(evaluateDocsAudit(data, NOW).blocked).toEqual(['@docusaurus/core']);
  });

  it('should_keep_the_high_threshold_when_only_moderate_findings_exist', () => {
    const data = report([entry('another-package', [advisory()], 'moderate')]);
    expect(evaluateDocsAudit(data, NOW)).toEqual({ accepted: [], blocked: [] });
  });

  it.each([
    null,
    {},
    [],
    { error: { code: 'ENETUNREACH' } },
    { ...report(), error: { code: 'EAUDIT' } },
    { ...report(), auditReportVersion: 3 },
    { ...report(), metadata: {} },
    { ...report(), vulnerabilities: null },
    { ...report(), metadata: { vulnerabilities: { high: 1 } } },
    { ...report(), vulnerabilities: { 'image-size': {} } },
    report([entry('image-size', [])]),
    report([entry('image-size', [advisory()], 'unknown')]),
  ])('should_reject_when_the_report_is_invalid_or_incomplete_%j', (data) => {
    expect(() => evaluateDocsAudit(data, NOW)).toThrow();
  });
});
