import express from 'express';
import type { Express, ErrorRequestHandler } from 'express';
import helmet from 'helmet';

const handleError: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  next,
) => {
  if (response.headersSent) return next(error);
  const type = error instanceof Error && 'type' in error ? error.type : '';
  const isInvalidJson = type === 'entity.parse.failed';
  const isTooLarge = type === 'entity.too.large';
  response.status(isInvalidJson ? 400 : isTooLarge ? 413 : 500).json({
    code: isInvalidJson
      ? 'INVALID_JSON'
      : isTooLarge
        ? 'BODY_TOO_LARGE'
        : 'INTERNAL_ERROR',
    message: isInvalidJson
      ? 'Corps JSON invalide.'
      : isTooLarge
        ? 'Corps trop volumineux.'
        : 'Erreur interne.',
    details: null,
  });
};

/**
 * Creates the HTTP entry point without mounting business routes.
 * @returns An application independent from its listening port for testing.
 * @throws If middleware configuration is invalid.
 */
export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use((request, response) => {
    response.status(404).json({
      code: 'NOT_FOUND',
      message: 'Ressource introuvable.',
      details: null,
    });
  });
  app.use(handleError);
  return app;
}
