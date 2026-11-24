import type Database from 'better-sqlite3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { destroyByUserIdSync } from '../../src/lib/sessions.ts';
import { createTestDatabase, insertValid } from './database-helpers.ts';

let database: Database.Database;

function countSessions(userId: number): number {
  return database
    .prepare(
      `SELECT count(*) FROM sessions WHERE json_extract(data, '$.userId') = ?`,
    )
    .pluck()
    .get(userId) as number;
}

beforeEach(() => {
  database = createTestDatabase();
  insertValid(database, 'sessions', { sid: 'a', data: '{"userId":1}' });
  insertValid(database, 'sessions', { sid: 'b', data: '{"userId":1}' });
  insertValid(database, 'sessions', { sid: 'c', data: '{"userId":2}' });
});

describe('destroyByUserIdSync', () => {
  it('should_leave_no_session_when_destroy_by_user_id_sync_called', () => {
    const destroyedCount = destroyByUserIdSync(database, 1);
    expect(destroyedCount).toBe(2);
    expect(countSessions(1)).toBe(0);
    expect(countSessions(2)).toBe(1);
  });

  it('should_restore_sessions_when_transaction_rolls_back', () => {
    const purgeThenFail = database.transaction(() => {
      destroyByUserIdSync(database, 1);
      throw new Error('failure after the purge');
    });
    expect(purgeThenFail).toThrow('failure after the purge');
    expect(countSessions(1)).toBe(2);
  });

  it('should_use_session_index_when_purging', () => {
    const prepare = vi.spyOn(database, 'prepare');
    destroyByUserIdSync(database, 1);
    const purgeSql = String(prepare.mock.calls[0]?.[0]);
    prepare.mockRestore();
    const plan = database.prepare(`EXPLAIN QUERY PLAN ${purgeSql}`).all(1) as {
      detail: string;
    }[];
    expect(plan.map((row) => row.detail).join(' ')).toContain(
      'idx_sessions_user_id',
    );
  });
});
