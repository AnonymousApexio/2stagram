import { sessions } from '@2stagram/shared/db';
import type Database from 'better-sqlite3';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';

/**
 * Deletes every session of an account, synchronously (docs/db §4.1, D64).
 *
 * Being synchronous on the given connection, it can run inside the same
 * `database.transaction()` as an anonymisation, a password reset or a ban.
 *
 * @param database - The connection shared with Drizzle and the session store.
 * @param userId - Account id, as serialised in the session data.
 * @returns Number of deleted sessions.
 */
export function destroyByUserIdSync(
  database: Database.Database,
  userId: number,
): number {
  return drizzle({ client: database })
    .delete(sessions)
    .where(eq(sql`json_extract(${sessions.data}, '$.userId')`, userId))
    .run().changes;
}
