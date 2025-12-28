CREATE TABLE `image_refs` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text,
	`r2_key` text NOT NULL,
	`type` text NOT NULL,
	`prompt` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`turn_number` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `summary` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`content` text NOT NULL,
	`last_turn` integer DEFAULT 0,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`turn_number` integer NOT NULL,
	`model` text NOT NULL,
	`tokens_used` integer,
	`duration_ms` integer,
	`error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
