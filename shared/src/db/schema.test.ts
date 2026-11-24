import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';
import {
  nowIso,
  passwordResetTokens,
  sessions,
  userSanctions,
  users,
} from './schema.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const TABLES = [sessions, users, passwordResetTokens, userSanctions];

describe('schema declaration', () => {
  it('should_produce_check_compatible_date_when_default_applies', () => {
    expect(nowIso()).toMatch(ISO_DATE);
  });

  it.each(TABLES.map((table) => [getTableConfig(table).name, table] as const))(
    'should_declare_a_format_check_for_every_date_column_of_%s',
    (name, table) => {
      const config = getTableConfig(table);
      const dateChecks = config.columns
        .filter((column) => column.name.endsWith('_at'))
        .map((column) => `ck_${name}_${column.name}_format`);
      const checks = config.checks.map((check) => check.name);
      expect(checks).toEqual(expect.arrayContaining(dateChecks));
    },
  );

  it.each(TABLES.map((table) => [getTableConfig(table).name, table] as const))(
    'should_declare_on_delete_explicitly_for_every_foreign_key_of_%s',
    (name, table) => {
      for (const foreignKey of getTableConfig(table).foreignKeys) {
        const reference = foreignKey.reference();
        expect(reference.foreignTable).toBeDefined();
        expect(
          foreignKey.onDelete,
          `${name}.${reference.columns[0]?.name}`,
        ).toBeDefined();
      }
    },
  );
});
