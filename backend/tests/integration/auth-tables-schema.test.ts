import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  VALID_AT,
  createTestDatabase,
  expectCheck,
  insertTwoUsers,
  insertValid,
} from './database-helpers.ts';

type Overrides = Record<string, string | number | null>;

let database: Database.Database;

beforeEach(() => {
  database = createTestDatabase();
  insertTwoUsers(database);
});

/** The 8 date columns of this pull request; other columns keep valid values. */
const DATE_COLUMNS: [string, string, Overrides][] = [
  ['sessions', 'expires_at', {}],
  ['password_reset_tokens', 'expires_at', {}],
  ['password_reset_tokens', 'used_at', {}],
  ['password_reset_tokens', 'created_at', {}],
  ['users', 'deleted_at', { id: 3, username: 'third', email: null }],
  ['users', 'created_at', { id: 3, username: 'third', email: 'c@example.com' }],
  ['user_sanctions', 'lifted_at', { lifted_by_id: 2 }],
  ['user_sanctions', 'created_at', {}],
];

describe('date format', () => {
  it.each(DATE_COLUMNS)(
    'should_reject_date_when_milliseconds_missing_on_%s_%s',
    (table, column, overrides) => {
      expectCheck(
        () =>
          insertValid(database, table, {
            ...overrides,
            [column]: '2026-11-24T10:00:00Z',
          }),
        `ck_${table}_${column}_format`,
      );
    },
  );

  it.each([
    '2026-11-24T10:00:00X500Z',
    '2026-11-24T10:00:00.000',
    '2026-11-24T10:00:00.000+01:00',
    '2026-11-24 10:00:00',
  ])('should_reject_date_when_format_is_%s', (value) => {
    expectCheck(
      () => insertValid(database, 'sessions', { expires_at: value }),
      'ck_sessions_expires_at_format',
    );
  });

  it('should_accept_date_when_calendar_invalid_but_format_valid', () => {
    expect(() =>
      insertValid(database, 'sessions', {
        expires_at: '2026-13-45T99:99:99.999Z',
      }),
    ).not.toThrow();
  });
});

describe('password_reset_tokens', () => {
  it('should_reject_token_when_hash_already_exists', () => {
    insertValid(database, 'password_reset_tokens');
    expect(() => insertValid(database, 'password_reset_tokens')).toThrow(
      'UNIQUE constraint failed',
    );
  });
});

describe('user_sanctions', () => {
  const insertSanction = (overrides: Overrides) =>
    insertValid(database, 'user_sanctions', overrides);

  it('should_reject_sanction_when_moderator_sanctions_himself', () => {
    expectCheck(
      () => insertSanction({ user_id: 2, moderator_id: 2 }),
      'ck_user_sanctions_self',
    );
  });

  it.each([[{ lifted_at: VALID_AT }], [{ lifted_by_id: 2 }]])(
    'should_reject_lift_when_its_twin_column_is_missing_%#',
    (overrides) => {
      expectCheck(() => insertSanction(overrides), 'ck_user_sanctions_lifted');
    },
  );

  it('should_reject_sanction_type_when_value_is_suspension', () => {
    expectCheck(
      () => insertSanction({ sanction_type: 'suspension' }),
      'ck_user_sanctions_sanction_type',
    );
  });

  it.each([
    ['reason', 200, 'ck_user_sanctions_reason'],
    ['details', 2000, 'ck_user_sanctions_details'],
  ])('should_bound_%s_when_length_is_checked', (column, max, constraint) => {
    expect(() => insertSanction({ [column]: 'x'.repeat(max) })).not.toThrow();
    expectCheck(
      () => insertSanction({ [column]: 'x'.repeat(max + 1) }),
      constraint,
    );
    expectCheck(() => insertSanction({ [column]: '' }), constraint);
  });
});
