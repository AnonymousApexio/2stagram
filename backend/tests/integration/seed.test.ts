import { describe, expect, it } from 'vitest';
import { seedDatabase } from '../../src/db/seed.ts';
import { createTestDatabase } from './database-helpers.ts';

const PASSWORD_HASH = '$argon2id$v=19$m=19456,t=2,p=1$test';

function seedAndRead(): unknown[] {
  const database = createTestDatabase();
  seedDatabase(database, {
    environment: 'development',
    passwordHash: PASSWORD_HASH,
  });
  return database.prepare('SELECT * FROM users ORDER BY id').all();
}

describe('development seed', () => {
  it.each(['production', 'test', undefined])(
    'should_refuse_seed_when_node_env_is_not_development_%s',
    (environment) => {
      const database = createTestDatabase();
      expect(() =>
        seedDatabase(database, { environment, passwordHash: PASSWORD_HASH }),
      ).toThrow('development');
      expect(database.prepare('SELECT count(*) FROM users').pluck().get()).toBe(
        0,
      );
    },
  );

  it('should_produce_identical_data_when_seed_rerun', () => {
    const firstRun = seedAndRead();
    expect(firstRun.length).toBeGreaterThan(0);
    expect(seedAndRead()).toEqual(firstRun);
  });

  it('should_report_no_row_from_foreign_key_check_when_seed_applied', () => {
    const database = createTestDatabase();
    seedDatabase(database, {
      environment: 'development',
      passwordHash: PASSWORD_HASH,
    });
    expect(database.pragma('foreign_key_check')).toEqual([]);
  });
});
