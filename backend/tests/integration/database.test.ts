import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { migrateDatabase, openDatabase } from '../../src/lib/database.ts';
import { createTestDatabase } from './database-helpers.ts';

function readSchema(database: ReturnType<typeof openDatabase>): unknown[] {
  return database
    .prepare(
      `SELECT name, sql FROM sqlite_master UNION ALL
       SELECT hash, created_at FROM __drizzle_migrations ORDER BY 1`,
    )
    .all();
}

describe('database connection', () => {
  it('should_enable_foreign_keys_when_connection_opens', () => {
    const database = openDatabase(':memory:');
    expect(database.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('should_set_busy_timeout_when_connection_opens', () => {
    const database = openDatabase(':memory:');
    expect(database.pragma('busy_timeout', { simple: true })).toBe(5000);
  });

  it('should_provide_json1_when_connection_opens', () => {
    const database = openDatabase(':memory:');
    const row = database.prepare(`SELECT json_valid('{}') AS isValid`).get();
    expect(row).toEqual({ isValid: 1 });
  });

  it('should_enable_wal_when_database_is_a_file', () => {
    const directory = mkdtempSync(join(tmpdir(), '2stagram-'));
    const database = openDatabase(join(directory, 'test.db'));
    try {
      expect(database.pragma('journal_mode', { simple: true })).toBe('wal');
    } finally {
      database.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('migrations', () => {
  it('should_apply_all_migrations_when_database_empty', () => {
    const database = createTestDatabase();
    const tables = database
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
      .pluck()
      .all();
    expect(tables).toEqual(expect.arrayContaining(['users', 'sessions']));
    expect(database.pragma('foreign_key_check')).toEqual([]);
  });

  it('should_change_nothing_when_migrations_replayed', () => {
    const database = createTestDatabase();
    const before = readSchema(database);
    migrateDatabase(database);
    expect(readSchema(database)).toEqual(before);
  });
});
