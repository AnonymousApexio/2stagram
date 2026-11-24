import { faker } from '@faker-js/faker';
import { userSanctions, users } from '@2stagram/shared/db';
import type Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const SEED = 2026;
const REFERENCE_DATE = new Date('2026-01-01T00:00:00.000Z');
const USER_COUNT = 10;

/** Options of {@link seedDatabase}. */
export interface SeedOptions {
  /** Value of NODE_ENV; the seed only runs for `development`. */
  environment: string | undefined;
  /** argon2id hash shared by every seeded account. */
  passwordHash: string;
}

/**
 * Refuses to go further outside development.
 *
 * @param environment - Value of NODE_ENV.
 * @throws If the environment is not `development`.
 */
export function assertDevelopment(environment: string | undefined): void {
  if (environment !== 'development') {
    throw new Error('Le seed ne tourne qu’avec NODE_ENV=development.');
  }
}

function roleOf(index: number): (typeof users.$inferInsert)['role'] {
  if (index === 0) return 'admin';
  return index === 1 ? 'moderator' : 'user';
}

function buildUsers(passwordHash: string): (typeof users.$inferInsert)[] {
  const seededUsers: (typeof users.$inferInsert)[] = [];
  for (let index = 0; index < USER_COUNT; index += 1) {
    const word = faker.word
      .noun()
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    const username = `${word.slice(0, 20)}_${index + 1}`;
    seededUsers.push({
      id: index + 1,
      username,
      email: `${username}@example.com`,
      passwordHash,
      bio: faker.lorem.sentence(),
      role: roleOf(index),
      groupInvitePolicy: index % 2 === 0 ? 'friends' : 'public',
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    });
  }
  return seededUsers;
}

/**
 * Fills an empty database with reproducible development data: the same
 * accounts on every run, thanks to a fixed seed and reference date.
 *
 * @param database - Migrated connection, without data.
 * @param options - Environment guard and shared password hash.
 * @throws If NODE_ENV is not `development`, or if a row breaks a constraint.
 */
export function seedDatabase(
  database: Database.Database,
  options: SeedOptions,
): void {
  assertDevelopment(options.environment);
  faker.seed(SEED);
  faker.setDefaultRefDate(REFERENCE_DATE);
  const seededUsers = buildUsers(options.passwordHash);
  const db = drizzle({ client: database });
  database.transaction(() => {
    db.insert(users).values(seededUsers).run();
    db.insert(userSanctions)
      .values({
        userId: 3,
        moderatorId: 2,
        sanctionType: 'warning',
        reason: 'Contenu signalé à plusieurs reprises.',
        createdAt: REFERENCE_DATE.toISOString(),
      })
      .run();
  })();
}
