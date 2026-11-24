CREATE TABLE `password_reset_tokens` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ck_password_reset_tokens_expires_at_format" CHECK("password_reset_tokens"."expires_at" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'),
	CONSTRAINT "ck_password_reset_tokens_used_at_format" CHECK("password_reset_tokens"."used_at" IS NULL OR "password_reset_tokens"."used_at" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'),
	CONSTRAINT "ck_password_reset_tokens_created_at_format" CHECK("password_reset_tokens"."created_at" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_password_reset_tokens_token_hash` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_password_reset_tokens_user_id` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_password_reset_tokens_expires_at` ON `password_reset_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`expires_at` text NOT NULL,
	CONSTRAINT "ck_sessions_expires_at_format" CHECK("sessions"."expires_at" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (json_extract(data, '$.userId'));--> statement-breakpoint
CREATE TABLE `user_sanctions` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`moderator_id` integer NOT NULL,
	`sanction_type` text NOT NULL,
	`reason` text NOT NULL,
	`details` text,
	`lifted_at` text,
	`lifted_by_id` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lifted_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ck_user_sanctions_sanction_type" CHECK("user_sanctions"."sanction_type" IN ('warning', 'ban')),
	CONSTRAINT "ck_user_sanctions_self" CHECK("user_sanctions"."user_id" <> "user_sanctions"."moderator_id"),
	CONSTRAINT "ck_user_sanctions_lifted" CHECK(("user_sanctions"."lifted_at" IS NULL) = ("user_sanctions"."lifted_by_id" IS NULL)),
	CONSTRAINT "ck_user_sanctions_reason" CHECK(length("user_sanctions"."reason") BETWEEN 1 AND 200),
	CONSTRAINT "ck_user_sanctions_details" CHECK("user_sanctions"."details" IS NULL OR length("user_sanctions"."details") BETWEEN 1 AND 2000),
	CONSTRAINT "ck_user_sanctions_lifted_at_format" CHECK("user_sanctions"."lifted_at" IS NULL OR "user_sanctions"."lifted_at" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'),
	CONSTRAINT "ck_user_sanctions_created_at_format" CHECK("user_sanctions"."created_at" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')
);
--> statement-breakpoint
CREATE INDEX `idx_user_sanctions_user_id` ON `user_sanctions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`phone` text,
	`password_hash` text NOT NULL,
	`bio` text,
	`avatar_path` text,
	`role` text NOT NULL,
	`post_visibility` text DEFAULT 'public' NOT NULL,
	`group_invite_policy` text NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	CONSTRAINT "ck_users_username" CHECK(length("users"."username") BETWEEN 3 AND 30
        AND lower("users"."username") NOT GLOB '*[^a-z0-9_]*'
        AND "users"."username" GLOB '*[a-zA-Z]*'
        AND ("users"."deleted_at" IS NOT NULL
          OR lower("users"."username") NOT GLOB 'deleted_user_*')),
	CONSTRAINT "ck_users_email" CHECK("users"."email" IS NULL OR ("users"."email" = lower("users"."email")
        AND length("users"."email") BETWEEN 6 AND 254
        AND "users"."email" LIKE '%_@_%._%'
        AND NOT "users"."email" GLOB '*@*@*'
        AND NOT "users"."email" GLOB '* *')),
	CONSTRAINT "ck_users_phone" CHECK("users"."phone" IS NULL OR ("users"."phone" GLOB '+[0-9]*'
        AND NOT substr("users"."phone", 2) GLOB '*[^0-9]*'
        AND length("users"."phone") BETWEEN 8 AND 16)),
	CONSTRAINT "ck_users_contact" CHECK("users"."deleted_at" IS NOT NULL OR "users"."email" IS NOT NULL),
	CONSTRAINT "ck_users_bio" CHECK("users"."bio" IS NULL OR length("users"."bio") BETWEEN 1 AND 500),
	CONSTRAINT "ck_users_avatar_path" CHECK("users"."avatar_path" IS NULL OR length("users"."avatar_path") BETWEEN 1 AND 512),
	CONSTRAINT "ck_users_role" CHECK("users"."role" IN ('user', 'moderator', 'admin')),
	CONSTRAINT "ck_users_post_visibility" CHECK("users"."post_visibility" IN ('public', 'friends')),
	CONSTRAINT "ck_users_group_invite_policy" CHECK("users"."group_invite_policy" IN ('public', 'friends')),
	CONSTRAINT "ck_users_deleted_at_format" CHECK("users"."deleted_at" IS NULL OR "users"."deleted_at" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'),
	CONSTRAINT "ck_users_created_at_format" CHECK("users"."created_at" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_users_username` ON `users` ("username" COLLATE NOCASE);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_users_email` ON `users` (`email`) WHERE "users"."email" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_users_phone` ON `users` (`phone`) WHERE "users"."phone" IS NOT NULL;