import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';

const BUSY_TIMEOUT_MS = 5000;
const MIGRATIONS_FOLDER = fileURLToPath(
  new URL('../../drizzle', import.meta.url),
);

/**
 * Opens a SQLite connection with the pragmas required by docs/db §3.1:
 * WAL journal, foreign keys enforced and a busy timeout.
 *
 * Every application connection must be opened through this function.
 *
 * @param filePath - Database file path, or `:memory:` for an in-memory base.
 * @returns The open better-sqlite3 connection.
 * @throws If the file cannot be opened or created.
 */
export function openDatabase(filePath: string): Database.Database {
  const database = new Database(filePath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.pragma(`busy_timeout = ${BUSY_TIMEOUT_MS}`);
  return database;
}

/**
 * Applies the pending drizzle-kit migrations of backend/drizzle.
 *
 * Already applied migrations are skipped, so running it twice changes nothing.
 *
 * @param database - Connection returned by {@link openDatabase}.
 * @throws If a migration fails; the whole batch is then rolled back.
 */
export function migrateDatabase(database: Database.Database): void {
  migrate(drizzle({ client: database }), {
    migrationsFolder: MIGRATIONS_FOLDER,
  });
}
