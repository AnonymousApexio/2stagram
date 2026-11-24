import type Database from 'better-sqlite3';
import { expect } from 'vitest';
import { migrateDatabase, openDatabase } from '../../src/lib/database.ts';

export const VALID_AT = '2026-11-24T10:00:00.000Z';

type Row = Record<string, string | number | null>;

const VALID_ROWS: Record<string, Row> = {
  users: {
    id: 1,
    username: 'kleiton',
    email: 'kleiton@example.com',
    password_hash: 'hash',
    role: 'user',
    group_invite_policy: 'friends',
    created_at: VALID_AT,
  },
  sessions: {
    sid: 'session-1',
    data: '{"cookie":{},"userId":1}',
    expires_at: VALID_AT,
  },
  password_reset_tokens: {
    user_id: 1,
    token_hash: 'a'.repeat(64),
    expires_at: VALID_AT,
    created_at: VALID_AT,
  },
  user_sanctions: {
    user_id: 1,
    moderator_id: 2,
    sanction_type: 'warning',
    reason: 'spam',
    created_at: VALID_AT,
  },
};

/** Opens an isolated in-memory database with every migration applied. */
export function createTestDatabase(): Database.Database {
  const database = openDatabase(':memory:');
  migrateDatabase(database);
  return database;
}

/** Inserts the reference row of a table, with some columns replaced. */
export function insertValid(
  database: Database.Database,
  table: string,
  overrides: Row = {},
): void {
  const row = { ...VALID_ROWS[table], ...overrides };
  const columns = Object.keys(row);
  const placeholders = columns.map((column) => `@${column}`).join(', ');
  database
    .prepare(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
    )
    .run(row);
}

/** Asserts that an action is refused by the named CHECK constraint. */
export function expectCheck(action: () => unknown, constraint: string): void {
  expect(action).toThrow(`CHECK constraint failed: ${constraint}`);
}

/** Inserts the two accounts most tests rely on: ids 1 and 2. */
export function insertTwoUsers(database: Database.Database): void {
  insertValid(database, 'users');
  insertValid(database, 'users', {
    id: 2,
    username: 'moderator',
    email: 'moderator@example.com',
    role: 'moderator',
  });
}
