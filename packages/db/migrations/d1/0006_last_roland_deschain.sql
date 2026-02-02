CREATE TABLE `creator_earnings` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`game_id` text NOT NULL,
	`player_id` text NOT NULL,
	`credits_earned` real NOT NULL,
	`total_charged` real NOT NULL,
	`session_id` text,
	`turn_number` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `earnings_creator_idx` ON `creator_earnings` (`creator_id`);--> statement-breakpoint
CREATE INDEX `earnings_game_idx` ON `creator_earnings` (`game_id`);--> statement-breakpoint
CREATE INDEX `earnings_created_idx` ON `creator_earnings` (`created_at`);--> statement-breakpoint
CREATE TABLE `xsolla_webhooks` (
	`event_id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`user_id` text,
	`sku` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`amount` real,
	`currency` text,
	`processed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `xsolla_webhooks_user_idx` ON `xsolla_webhooks` (`user_id`);--> statement-breakpoint
CREATE INDEX `xsolla_webhooks_type_idx` ON `xsolla_webhooks` (`event_type`);--> statement-breakpoint
DROP TABLE `polar_webhooks`;--> statement-breakpoint
ALTER TABLE `user_credits` ADD `lifetime_earned` real DEFAULT 0 NOT NULL;