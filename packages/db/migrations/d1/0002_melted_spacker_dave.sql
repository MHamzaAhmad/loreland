CREATE TABLE `play_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`user_id` text NOT NULL,
	`character_id` text NOT NULL,
	`character_name` text,
	`model` text DEFAULT 'gemini-2.0-flash' NOT NULL,
	`current_turn` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active',
	`last_played_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
