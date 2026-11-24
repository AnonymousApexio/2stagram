import { sql, type SQL } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';

/** Shape enforced on every `_at` column: ISO 8601 UTC with milliseconds. */
const ISO_DATE_GLOB = sql.raw(
  `'[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`,
);

/**
 * Returns the current date in the format required by the date checks.
 *
 * @returns The current UTC date, for example `2026-11-24T10:00:00.000Z`.
 */
export function nowIso(): string {
  return new Date().toISOString();
}

function requiredDate(name: string, column: AnySQLiteColumn) {
  return check(name, sql`${column} GLOB ${ISO_DATE_GLOB}`);
}

function optionalDate(name: string, column: AnySQLiteColumn) {
  return check(name, sql`${column} IS NULL OR ${column} GLOB ${ISO_DATE_GLOB}`);
}

function optionalLength(column: AnySQLiteColumn, maxLength: number): SQL {
  return sql`${column} IS NULL OR length(${column}) BETWEEN 1 AND ${sql.raw(String(maxLength))}`;
}

/** Account roles (docs/db §4.3). */
export const USER_ROLES = ['user', 'moderator', 'admin'] as const;
/** Visibility applied to everything an account publishes [D20]. */
export const POST_VISIBILITIES = ['public', 'friends'] as const;
/** Who may add an account to a group conversation. */
export const GROUP_INVITE_POLICIES = ['public', 'friends'] as const;
/** Sanction kinds (docs/db §4.4). */
export const SANCTION_TYPES = ['warning', 'ban'] as const;

/** Server-side sessions read by the express-session store (docs/db §4.1). */
export const sessions = sqliteTable(
  'sessions',
  {
    sid: text('sid').primaryKey(),
    data: text('data').notNull(),
    expiresAt: text('expires_at').notNull(),
  },
  (table) => [
    index('idx_sessions_expires_at').on(table.expiresAt),
    // drizzle-kit 0.31 splits this expression on its comma: in every migration
    // that creates or rebuilds `sessions`, replace the generated line with the
    // SQL of docs/db §10.5.
    index('idx_sessions_user_id').on(
      sql`json_extract(${table.data}, '$.userId')`,
    ),
    requiredDate('ck_sessions_expires_at_format', table.expiresAt),
  ],
);

/** Accounts (docs/db §4.3). */
export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey(),
    username: text('username').notNull(),
    email: text('email'),
    phone: text('phone'),
    passwordHash: text('password_hash').notNull(),
    bio: text('bio'),
    avatarPath: text('avatar_path'),
    role: text('role', { enum: USER_ROLES }).notNull(),
    postVisibility: text('post_visibility', { enum: POST_VISIBILITIES })
      .notNull()
      .default('public'),
    groupInvitePolicy: text('group_invite_policy', {
      enum: GROUP_INVITE_POLICIES,
    }).notNull(),
    deletedAt: text('deleted_at'),
    createdAt: text('created_at').notNull().$defaultFn(nowIso),
  },
  (table) => [
    uniqueIndex('uq_users_username').on(sql`${table.username} COLLATE NOCASE`),
    uniqueIndex('uq_users_email')
      .on(table.email)
      .where(sql`${table.email} IS NOT NULL`),
    uniqueIndex('uq_users_phone')
      .on(table.phone)
      .where(sql`${table.phone} IS NOT NULL`),
    check(
      'ck_users_username',
      sql`length(${table.username}) BETWEEN 3 AND 30
        AND lower(${table.username}) NOT GLOB '*[^a-z0-9_]*'
        AND ${table.username} GLOB '*[a-zA-Z]*'
        AND (${table.deletedAt} IS NOT NULL
          OR lower(${table.username}) NOT GLOB 'deleted_user_*')`,
    ),
    check(
      'ck_users_email',
      sql`${table.email} IS NULL OR (${table.email} = lower(${table.email})
        AND length(${table.email}) BETWEEN 6 AND 254
        AND ${table.email} LIKE '%_@_%._%'
        AND NOT ${table.email} GLOB '*@*@*'
        AND NOT ${table.email} GLOB '* *')`,
    ),
    check(
      'ck_users_phone',
      sql`${table.phone} IS NULL OR (${table.phone} GLOB '+[0-9]*'
        AND NOT substr(${table.phone}, 2) GLOB '*[^0-9]*'
        AND length(${table.phone}) BETWEEN 8 AND 16)`,
    ),
    // Email is mandatory except for an anonymised account (D52, revised).
    check(
      'ck_users_contact',
      sql`${table.deletedAt} IS NOT NULL OR ${table.email} IS NOT NULL`,
    ),
    check('ck_users_bio', optionalLength(table.bio, 500)),
    check('ck_users_avatar_path', optionalLength(table.avatarPath, 512)),
    check(
      'ck_users_role',
      sql`${table.role} IN ('user', 'moderator', 'admin')`,
    ),
    check(
      'ck_users_post_visibility',
      sql`${table.postVisibility} IN ('public', 'friends')`,
    ),
    check(
      'ck_users_group_invite_policy',
      sql`${table.groupInvitePolicy} IN ('public', 'friends')`,
    ),
    optionalDate('ck_users_deleted_at_format', table.deletedAt),
    requiredDate('ck_users_created_at_format', table.createdAt),
  ],
);

/** Password reset links, stored as SHA-256 hashes (docs/db §4.2). */
export const passwordResetTokens = sqliteTable(
  'password_reset_tokens',
  {
    id: integer('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: text('expires_at').notNull(),
    usedAt: text('used_at'),
    createdAt: text('created_at').notNull().$defaultFn(nowIso),
  },
  (table) => [
    uniqueIndex('uq_password_reset_tokens_token_hash').on(table.tokenHash),
    index('idx_password_reset_tokens_user_id').on(table.userId),
    index('idx_password_reset_tokens_expires_at').on(table.expiresAt),
    requiredDate('ck_password_reset_tokens_expires_at_format', table.expiresAt),
    optionalDate('ck_password_reset_tokens_used_at_format', table.usedAt),
    requiredDate('ck_password_reset_tokens_created_at_format', table.createdAt),
  ],
);

/** Warnings and reversible bans (docs/db §4.4, D24). */
export const userSanctions = sqliteTable(
  'user_sanctions',
  {
    id: integer('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'no action' }),
    moderatorId: integer('moderator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'no action' }),
    sanctionType: text('sanction_type', { enum: SANCTION_TYPES }).notNull(),
    reason: text('reason').notNull(),
    details: text('details'),
    liftedAt: text('lifted_at'),
    liftedById: integer('lifted_by_id').references(() => users.id, {
      onDelete: 'no action',
    }),
    createdAt: text('created_at').notNull().$defaultFn(nowIso),
  },
  (table) => [
    index('idx_user_sanctions_user_id').on(table.userId),
    check(
      'ck_user_sanctions_sanction_type',
      sql`${table.sanctionType} IN ('warning', 'ban')`,
    ),
    check(
      'ck_user_sanctions_self',
      sql`${table.userId} <> ${table.moderatorId}`,
    ),
    check(
      'ck_user_sanctions_lifted',
      sql`(${table.liftedAt} IS NULL) = (${table.liftedById} IS NULL)`,
    ),
    check(
      'ck_user_sanctions_reason',
      sql`length(${table.reason}) BETWEEN 1 AND 200`,
    ),
    check('ck_user_sanctions_details', optionalLength(table.details, 2000)),
    optionalDate('ck_user_sanctions_lifted_at_format', table.liftedAt),
    requiredDate('ck_user_sanctions_created_at_format', table.createdAt),
  ],
);
