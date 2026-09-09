import express from 'express';
import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.ts';

const logger = vi.hoisted(() => ({ info: vi.fn(), fatal: vi.fn() }));
vi.mock('./app.ts', () => ({ createApp: vi.fn() }));
vi.mock('pino', () => ({ default: () => logger }));

const signals = ['SIGINT', 'SIGTERM'] as const;
let app = express();
let server = createServer();
let previousExitCode: typeof process.exitCode;
let previousListeners = new Map(
  signals.map((signal) => [signal, process.listeners(signal)]),
);

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.stubEnv('PORT', undefined);
  vi.stubEnv('HOST', undefined);
  previousExitCode = process.exitCode;
  previousListeners = new Map(
    signals.map((signal) => [signal, process.listeners(signal)]),
  );
  app = express();
  server = createServer(app);
  vi.mocked(createApp).mockReturnValue(app);
  vi.spyOn(app, 'listen').mockReturnValue(server);
});

afterEach(() => {
  for (const signal of signals) {
    for (const listener of process.listeners(signal)) {
      if (!previousListeners.get(signal)?.includes(listener)) {
        process.removeListener(signal, listener);
      }
    }
  }
  process.exitCode = previousExitCode;
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('server lifecycle', () => {
  it('should_listen_locally_when_no_address_is_configured', async () => {
    await import('./server.ts');
    expect(app.listen).toHaveBeenCalledWith(
      3000,
      '127.0.0.1',
      expect.any(Function),
    );
  });

  it('should_use_configured_address_when_environment_is_set', async () => {
    vi.stubEnv('PORT', '4321');
    vi.stubEnv('HOST', '0.0.0.0');
    await import('./server.ts');
    expect(app.listen).toHaveBeenCalledWith(
      4321,
      '0.0.0.0',
      expect.any(Function),
    );
  });

  it('should_log_readiness_when_listening_starts', async () => {
    await import('./server.ts');
    const onReady = vi.mocked(app.listen).mock.calls[0]?.at(-1);
    expect(onReady).toBeTypeOf('function');
    if (typeof onReady === 'function') onReady();
    expect(logger.info).toHaveBeenCalledWith({ port: 3000 }, 'Serveur démarré');
  });

  it.each([
    {
      error: Object.assign(new Error('private detail'), { code: 'EADDRINUSE' }),
      code: 'EADDRINUSE',
    },
    { error: new Error('private detail'), code: 'SERVER_ERROR' },
  ])(
    'should_fail_safely_when_startup_fails_with_$code',
    async ({ error, code }) => {
      await import('./server.ts');
      server.emit('error', error);
      expect(process.exitCode).toBe(1);
      expect(logger.fatal).toHaveBeenCalledWith({ code }, 'Échec du démarrage');
    },
  );

  it.each(signals)(
    'should_close_connections_when_%s_is_received',
    async (signal) => {
      const close = vi.spyOn(server, 'close').mockImplementation((callback) => {
        callback?.();
        return server;
      });
      const closeAll = vi
        .spyOn(server, 'closeAllConnections')
        .mockImplementation(() => {});
      await import('./server.ts');
      const stop = process.listeners(signal).at(-1);
      expect(stop).toBeTypeOf('function');
      stop?.(signal);
      expect(close).toHaveBeenCalledOnce();
      expect(process.exitCode).toBe(0);
      vi.advanceTimersByTime(4999);
      expect(closeAll).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(closeAll).toHaveBeenCalledOnce();
    },
  );

  it('should_report_failure_when_graceful_shutdown_fails', async () => {
    vi.spyOn(server, 'close').mockImplementation((callback) => {
      callback?.(new Error('cannot close'));
      return server;
    });
    await import('./server.ts');
    process.listeners('SIGTERM').at(-1)?.('SIGTERM');
    expect(process.exitCode).toBe(1);
  });
});
