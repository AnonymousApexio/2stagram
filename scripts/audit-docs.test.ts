import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { runNpm, writeReport } = vi.hoisted(() => ({
  runNpm: vi.fn(),
  writeReport: vi.fn(),
}));
vi.mock('node:child_process', () => ({ spawnSync: runNpm }));
vi.mock('node:fs', () => ({ writeFileSync: writeReport }));

const ARGV = process.argv;
const EXIT_CODE = process.exitCode;
const CLEAN = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {},
  metadata: {
    vulnerabilities: {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      total: 0,
    },
  },
});
const KNOWN = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {
    'image-size': {
      name: 'image-size',
      severity: 'high',
      fixAvailable: false,
      via: [
        {
          name: 'image-size',
          dependency: 'image-size',
          severity: 'high',
          url: 'https://github.com/advisories/GHSA-w3rx-r6r6-pgpr',
        },
      ],
    },
  },
  metadata: {
    vulnerabilities: {
      info: 0,
      low: 0,
      moderate: 0,
      high: 1,
      critical: 0,
      total: 1,
    },
  },
});

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('npm_execpath', '/test/npm-cli.cjs');
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-11T00:00:00Z'));
  vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.argv = [process.execPath, 'scripts/audit-docs.ts'];
  process.exitCode = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  process.argv = ARGV;
  process.exitCode = EXIT_CODE;
});

describe('documentation audit command', () => {
  it('should_preserve_the_report_and_scope_when_accepting_known_findings', async () => {
    runNpm.mockReturnValue({
      status: 1,
      signal: null,
      stdout: KNOWN,
      stderr: '',
    });
    await import('./audit-docs.ts');
    expect(process.exitCode).toBe(0);
    expect(writeReport).toHaveBeenCalledWith(expect.any(URL), KNOWN);
    expect(process.stdout.write).toHaveBeenCalledWith(KNOWN);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('2026-10-10T00:00:00+02:00'),
    );
    expect(runNpm).toHaveBeenCalledWith(
      process.execPath,
      ['/test/npm-cli.cjs', 'audit', '--json', '--audit-level=high'],
      expect.objectContaining({
        cwd: new URL('../docs-site/', import.meta.url),
        timeout: 60_000,
        killSignal: 'SIGKILL',
      }),
    );
  });

  it('should_pass_when_npm_succeeds_without_findings', async () => {
    runNpm.mockReturnValue({
      status: 0,
      signal: null,
      stdout: CLEAN,
      stderr: '',
    });
    await import('./audit-docs.ts');
    expect(process.exitCode).toBe(0);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should_refuse_execution_when_npm_context_is_missing', async () => {
    vi.stubEnv('npm_execpath', undefined);
    await expect(import('./audit-docs.ts')).rejects.toThrow(
      'npm run audit:docs',
    );
    expect(runNpm).not.toHaveBeenCalled();
  });

  it('should_refuse_arguments_when_the_scope_could_be_changed', async () => {
    process.argv.push('--prefix=backend');
    await expect(import('./audit-docs.ts')).rejects.toThrow('sans argument');
    expect(runNpm).not.toHaveBeenCalled();
  });

  it.each([
    { status: 2, stdout: CLEAN },
    { status: 1, stdout: CLEAN },
    { status: 1 },
    { status: null, signal: 'SIGKILL', stdout: KNOWN },
    {
      status: null,
      error: new Error('Spawn failed'),
      stdout: undefined,
      stderr: undefined,
    },
    { status: 1, stdout: '{invalid' },
    { status: 1, stdout: JSON.stringify({ error: { code: 'ENETUNREACH' } }) },
    { status: 1, stdout: KNOWN.replace('GHSA-w3rx-r6r6-pgpr', 'GHSA-new') },
  ])('should_fail_closed_when_npm_or_the_policy_rejects_%j', async (result) => {
    runNpm.mockReturnValue({ signal: null, stderr: '', ...result });
    await import('./audit-docs.ts');
    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalled();
  });
});
