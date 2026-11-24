import { describe, expect, it } from 'vitest';
import { createTestDatabase } from './database-helpers.ts';

/**
 * Expected content of the database, from docs/db §4 and §10 (v4.8).
 * Each pull request of the schema ticket adds its tables here.
 * Columns map to their NOT NULL flag.
 */
const EXPECTED_TABLES = {
  sessions: {
    columns: { sid: true, data: true, expires_at: true },
    checks: ['ck_sessions_expires_at_format'],
    indexes: ['idx_sessions_expires_at', 'idx_sessions_user_id'],
    foreignKeys: [],
  },
  users: {
    columns: {
      id: true,
      username: true,
      email: false,
      phone: false,
      password_hash: true,
      bio: false,
      avatar_path: false,
      role: true,
      post_visibility: true,
      group_invite_policy: true,
      deleted_at: false,
      created_at: true,
    },
    checks: [
      'ck_users_username',
      'ck_users_email',
      'ck_users_phone',
      'ck_users_contact',
      'ck_users_bio',
      'ck_users_avatar_path',
      'ck_users_role',
      'ck_users_post_visibility',
      'ck_users_group_invite_policy',
      'ck_users_deleted_at_format',
      'ck_users_created_at_format',
    ],
    indexes: ['uq_users_username', 'uq_users_email', 'uq_users_phone'],
    foreignKeys: [],
  },
  password_reset_tokens: {
    columns: {
      id: true,
      user_id: true,
      token_hash: true,
      expires_at: true,
      used_at: false,
      created_at: true,
    },
    checks: [
      'ck_password_reset_tokens_expires_at_format',
      'ck_password_reset_tokens_used_at_format',
      'ck_password_reset_tokens_created_at_format',
    ],
    indexes: [
      'uq_password_reset_tokens_token_hash',
      'idx_password_reset_tokens_user_id',
      'idx_password_reset_tokens_expires_at',
    ],
    foreignKeys: ['user_id -> users CASCADE'],
  },
  user_sanctions: {
    columns: {
      id: true,
      user_id: true,
      moderator_id: true,
      sanction_type: true,
      reason: true,
      details: false,
      lifted_at: false,
      lifted_by_id: false,
      created_at: true,
    },
    checks: [
      'ck_user_sanctions_sanction_type',
      'ck_user_sanctions_self',
      'ck_user_sanctions_lifted',
      'ck_user_sanctions_reason',
      'ck_user_sanctions_details',
      'ck_user_sanctions_lifted_at_format',
      'ck_user_sanctions_created_at_format',
    ],
    indexes: ['idx_user_sanctions_user_id'],
    foreignKeys: [
      'user_id -> users NO ACTION',
      'moderator_id -> users NO ACTION',
      'lifted_by_id -> users NO ACTION',
    ],
  },
} as const;

const TABLE_NAMES = Object.keys(EXPECTED_TABLES).sort();
const database = createTestDatabase();

function readTables(): string[] {
  return database
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table'
       AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\'
       AND name NOT LIKE '\\_\\_drizzle%' ESCAPE '\\' ORDER BY name`,
    )
    .pluck()
    .all() as string[];
}

function readColumns(table: string): Record<string, boolean> {
  const rows = database.pragma(`table_xinfo(${table})`) as {
    name: string;
    notnull: number;
  }[];
  return Object.fromEntries(rows.map((row) => [row.name, row.notnull === 1]));
}

function readChecks(table: string): string[] {
  const ddl = database
    .prepare(`SELECT sql FROM sqlite_master WHERE name = ?`)
    .pluck()
    .get(table) as string;
  return [...ddl.matchAll(/CONSTRAINT "(ck_\w+)" CHECK/g)].map(
    (match) => match[1] ?? '',
  );
}

function readIndexes(table: string): string[] {
  return database
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ?
       AND name NOT LIKE 'sqlite\\_autoindex%' ESCAPE '\\'`,
    )
    .pluck()
    .all(table) as string[];
}

function readForeignKeys(table: string): string[] {
  const rows = database.pragma(`foreign_key_list(${table})`) as {
    from: string;
    table: string;
    on_delete: string;
  }[];
  return rows.map((row) => `${row.from} -> ${row.table} ${row.on_delete}`);
}

describe('schema inventory', () => {
  it('should_declare_exactly_the_documented_tables', () => {
    expect(readTables()).toEqual(TABLE_NAMES);
  });

  it.each(TABLE_NAMES)('should_match_documented_columns_for_%s', (table) => {
    const expected = EXPECTED_TABLES[table as keyof typeof EXPECTED_TABLES];
    expect(readColumns(table)).toEqual(expected.columns);
  });

  it.each(TABLE_NAMES)(
    'should_declare_every_documented_check_on_%s',
    (table) => {
      const expected = EXPECTED_TABLES[table as keyof typeof EXPECTED_TABLES];
      expect(readChecks(table).sort()).toEqual([...expected.checks].sort());
    },
  );

  it.each(TABLE_NAMES)(
    'should_declare_every_documented_index_on_%s',
    (table) => {
      const expected = EXPECTED_TABLES[table as keyof typeof EXPECTED_TABLES];
      expect(readIndexes(table).sort()).toEqual([...expected.indexes].sort());
    },
  );

  it.each(TABLE_NAMES)(
    'should_match_documented_on_delete_for_foreign_keys_of_%s',
    (table) => {
      const expected = EXPECTED_TABLES[table as keyof typeof EXPECTED_TABLES];
      expect(readForeignKeys(table).sort()).toEqual(
        [...expected.foreignKeys].sort(),
      );
    },
  );
});
