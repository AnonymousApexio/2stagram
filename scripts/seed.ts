import { argon2id, hash } from 'argon2';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { assertDevelopment, seedDatabase } from '../backend/src/db/seed.ts';
import { migrateDatabase, openDatabase } from '../backend/src/lib/database.ts';

// Development-only password of every seeded account.
const SEED_PASSWORD = 'motdepasse-dev';
// Fixed salt: the same hash on every run, so the seed stays reproducible.
const SEED_SALT = Buffer.from('2stagram-seed-salt');

assertDevelopment(process.env.NODE_ENV);

const passwordHash = await hash(SEED_PASSWORD, {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  salt: SEED_SALT,
});
const databasePath = process.env.DATABASE_PATH ?? 'db/2stagram.db';
mkdirSync(dirname(databasePath), { recursive: true });
const database = openDatabase(databasePath);
try {
  migrateDatabase(database);
  seedDatabase(database, { environment: process.env.NODE_ENV, passwordHash });
  console.log('Seed appliqué.');
} finally {
  database.close();
}
