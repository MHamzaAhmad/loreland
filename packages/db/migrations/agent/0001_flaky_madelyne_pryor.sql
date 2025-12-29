CREATE TABLE `character_state` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`character_id` text NOT NULL,
	`health` integer DEFAULT 100 NOT NULL,
	`skill_modifiers` text DEFAULT '{}',
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_session` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`session_id` text NOT NULL,
	`game_id` text NOT NULL,
	`character_id` text NOT NULL,
	`model` text DEFAULT 'gemini-2.0-flash' NOT NULL,
	`config` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `turns` (
	`id` text PRIMARY KEY NOT NULL,
	`turn_number` integer NOT NULL,
	`user_message` text NOT NULL,
	`assistant_response` text NOT NULL,
	`suggested_actions` text DEFAULT '[]',
	`character_state` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
