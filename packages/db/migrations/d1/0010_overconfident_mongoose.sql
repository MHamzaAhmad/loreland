ALTER TABLE `xsolla_webhooks` RENAME TO `polar_webhooks`;--> statement-breakpoint
ALTER TABLE `polar_webhooks` RENAME COLUMN "user_id" TO "customer_id";--> statement-breakpoint
ALTER TABLE `polar_webhooks` RENAME COLUMN "sku" TO "product_id";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_polar_webhooks` (
	`event_id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`customer_id` text,
	`product_id` text,
	`amount` real,
	`currency` text,
	`processed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_polar_webhooks`("event_id", "event_type", "customer_id", "product_id", "amount", "currency", "processed_at") SELECT "event_id", "event_type", "customer_id", "product_id", "amount", "currency", "processed_at" FROM `polar_webhooks`;--> statement-breakpoint
DROP TABLE `polar_webhooks`;--> statement-breakpoint
ALTER TABLE `__new_polar_webhooks` RENAME TO `polar_webhooks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `polar_webhooks_customer_idx` ON `polar_webhooks` (`customer_id`);--> statement-breakpoint
CREATE INDEX `polar_webhooks_type_idx` ON `polar_webhooks` (`event_type`);