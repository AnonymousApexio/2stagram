import request from 'supertest';
import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.ts';

afterEach(() => vi.restoreAllMocks());

describe('HTTP bootstrap', () => {
  it.each([new Error('private path / SQL'), { internal: 'private detail' }])(
    'should_hide_internal_details_when_middleware_fails_%#',
    async (error) => {
      vi.spyOn(express, 'json').mockReturnValue((request, response, next) =>
        next(error),
      );
      const response = await request(createApp()).get('/');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Erreur interne.',
        details: null,
      });
    },
  );

  it('should_return_json_error_when_route_is_unknown', async () => {
    const response = await request(createApp()).get('/api/v1/unknown');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      code: 'NOT_FOUND',
      message: 'Ressource introuvable.',
      details: null,
    });
  });

  it('should_reject_invalid_json_when_body_is_malformed', async () => {
    const response = await request(createApp())
      .post('/api/v1/unknown')
      .set('Content-Type', 'application/json')
      .send('{broken');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      code: 'INVALID_JSON',
      message: 'Corps JSON invalide.',
      details: null,
    });
  });

  it('should_reject_large_json_when_body_exceeds_limit', async () => {
    const response = await request(createApp())
      .post('/api/v1/unknown')
      .send({ text: 'a'.repeat(110 * 1024) });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      code: 'BODY_TOO_LARGE',
      message: 'Corps trop volumineux.',
      details: null,
    });
  });

  it.each([
    ['Content-Type', 'application/json; charset=bogus'],
    ['Content-Encoding', 'bogus'],
  ])(
    'should_reject_unsupported_format_when_%s_is_%s',
    async (header, value) => {
      const response = await request(createApp())
        .post('/api/v1/unknown')
        .set('Content-Type', 'application/json')
        .set(header, value)
        .send('{}');
      expect(response.status).toBe(415);
      expect(response.body).toEqual({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Format de requête non pris en charge.',
        details: null,
      });
    },
  );

  it('should_reject_invalid_body_when_compressed_json_is_corrupt', async () => {
    const response = await request(createApp())
      .post('/api/v1/unknown')
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'gzip')
      .send('not-gzip');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      code: 'INVALID_BODY',
      message: 'Corps de requête invalide.',
      details: null,
    });
  });

  it('should_send_security_headers_when_request_is_received', async () => {
    const response = await request(createApp()).get('/');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
