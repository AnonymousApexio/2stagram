import pino from 'pino';
import { createApp } from './app.ts';

const LOGGER = pino();
const PORT = Number(process.env.PORT ?? 3000);
const SERVER = createApp().listen(PORT, process.env.HOST ?? '127.0.0.1', () => {
  LOGGER.info({ port: PORT }, 'Serveur démarré');
});

SERVER.on('error', (error) => {
  LOGGER.fatal(
    { code: 'code' in error ? error.code : 'SERVER_ERROR' },
    'Échec du démarrage',
  );
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    SERVER.close((error) => {
      process.exitCode = error ? 1 : 0;
    });
    setTimeout(() => SERVER.closeAllConnections(), 5000).unref();
  });
}
