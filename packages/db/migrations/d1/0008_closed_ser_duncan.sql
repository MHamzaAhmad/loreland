CREATE TABLE `device_fingerprints` (
	`id` text PRIMARY KEY NOT NULL,
	`fingerprint` text NOT NULL,
	`ip_address` text,
	`user_id` text,
	`claimed_credits` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_fingerprints_fingerprint_unique` ON `device_fingerprints` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `device_fingerprints_fingerprint_idx` ON `device_fingerprints` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `device_fingerprints_user_idx` ON `device_fingerprints` (`user_id`);