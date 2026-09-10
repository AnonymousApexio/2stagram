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
  let failure = {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Erreur interne.',
  };
  if (type === 'entity.parse.failed') {
    failure = {
      status: 400,
      code: 'INVALID_JSON',
      message: 'Corps JSON invalide.',
    };
  } else if (type === 'entity.too.large') {
    failure = {
      status: 413,
      code: 'BODY_TOO_LARGE',
      message: 'Corps trop volumineux.',
    };
  } else if (
    type === 'charset.unsupported' ||
    type === 'encoding.unsupported'
  ) {
    failure = {
      status: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: 'Format de requête non pris en charge.',
    };
  } else if (
    error instanceof Error &&
    'status' in error &&
    error.status === 400
  ) {
    failure = {
      status: 400,
      code: 'INVALID_BODY',
      message: 'Corps de requête invalide.',
    };
  }
  response.status(failure.status).json({
    code: failure.code,
    message: failure.message,
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
