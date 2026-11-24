import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  VALID_AT,
  createTestDatabase,
  expectCheck,
  insertValid,
} from './database-helpers.ts';

let database: Database.Database;
const insertUser = (overrides: Record<string, string | number | null>) =>
  insertValid(database, 'users', overrides);

beforeEach(() => {
  database = createTestDatabase();
});

describe('ck_users_username', () => {
  it.each([
    '___',
    '12345',
    '123_',
    'ab',
    'a'.repeat(31),
    'kléiton',
    'kle-iton',
  ])('should_reject_username_when_value_is_%s', (username) => {
    expectCheck(() => insertUser({ username }), 'ck_users_username');
  });

  it.each(['k_12345', 'Kleiton', 'a'.repeat(30)])(
    'should_accept_username_when_value_is_%s',
    (username) => {
      expect(() => insertUser({ username })).not.toThrow();
    },
  );

  it.each(['deleted_user_5', 'DELETED_USER_5'])(
    'should_reject_reserved_prefix_when_account_is_active_%s',
    (username) => {
      expectCheck(() => insertUser({ username }), 'ck_users_username');
    },
  );

  it.each(['deleted_user_5', 'DELETED_USER_5'])(
    'should_accept_reserved_prefix_when_account_is_deleted_%s',
    (username) => {
      expect(() =>
        insertUser({ username, email: null, deleted_at: VALID_AT }),
      ).not.toThrow();
    },
  );

  it('should_reject_username_when_it_differs_only_by_case', () => {
    insertUser({ username: 'Kleiton' });
    expect(() =>
      insertUser({ id: 2, username: 'kleiton', email: 'other@example.com' }),
    ).toThrow('UNIQUE constraint failed');
  });
});

describe('ck_users_email', () => {
  it.each(['Kleiton@example.com', 'a@@b.cd', 'a b@example.com', 'a@b.c'])(
    'should_reject_email_when_value_is_%s',
    (email) => {
      expectCheck(() => insertUser({ email }), 'ck_users_email');
    },
  );

  it('should_accept_email_when_non_ascii_capital_is_used', () => {
    // Known limit (D56): lower() only folds ASCII, Zod normalises the rest.
    expect(() => insertUser({ email: 'École@test.fr' })).not.toThrow();
  });
});

describe('ck_users_phone', () => {
  it.each(['0612345678', '+33abc45678', '+331234', '+' + '1'.repeat(16)])(
    'should_reject_phone_when_value_is_%s',
    (phone) => {
      expectCheck(() => insertUser({ phone }), 'ck_users_phone');
    },
  );

  it('should_accept_phone_when_value_is_e164', () => {
    expect(() => insertUser({ phone: '+33612345678' })).not.toThrow();
  });
});

describe('ck_users_contact', () => {
  it('should_reject_account_when_only_phone_is_given', () => {
    expectCheck(
      () => insertUser({ email: null, phone: '+33612345678' }),
      'ck_users_contact',
    );
  });

  it('should_reject_account_when_no_contact_is_given', () => {
    expectCheck(() => insertUser({ email: null }), 'ck_users_contact');
  });

  it('should_accept_anonymisation_when_contacts_are_erased', () => {
    insertUser({ phone: '+33612345678' });
    expect(() =>
      database
        .prepare(
          `UPDATE users SET username = 'deleted_user_' || id, email = NULL,
           phone = NULL, password_hash = '', bio = NULL, avatar_path = NULL,
           deleted_at = ? WHERE id = ?`,
        )
        .run(VALID_AT, 1),
    ).not.toThrow();
  });
});

describe('user lengths and enumerations', () => {
  it.each([
    ['bio', 500, 'ck_users_bio'],
    ['avatar_path', 512, 'ck_users_avatar_path'],
  ])('should_bound_%s_when_length_is_checked', (column, max, constraint) => {
    expect(() => insertUser({ [column]: 'é'.repeat(max) })).not.toThrow();
    database.exec('DELETE FROM users');
    expectCheck(
      () => insertUser({ [column]: 'é'.repeat(max + 1) }),
      constraint,
    );
    expectCheck(() => insertUser({ [column]: '' }), constraint);
  });

  it.each([
    ['role', 'superadmin', 'ck_users_role'],
    ['post_visibility', 'private', 'ck_users_post_visibility'],
    ['group_invite_policy', 'nobody', 'ck_users_group_invite_policy'],
  ])('should_reject_%s_when_value_is_%s', (column, value, constraint) => {
    expectCheck(() => insertUser({ [column]: value }), constraint);
  });

  it('should_default_post_visibility_to_public_when_omitted', () => {
    insertUser({});
    const row = database.prepare('SELECT post_visibility FROM users').get();
    expect(row).toEqual({ post_visibility: 'public' });
  });
});
