ALTER TABLE `tracked_items` RENAME TO `states`;--> statement-breakpoint
ALTER TABLE `trigger_events` RENAME TO `triggers`;--> statement-breakpoint
CREATE TABLE `keyword_instructions` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`keyword` text NOT NULL,
	`instruction` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character_initial_states` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`state_id` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`can_edit_character_name` integer DEFAULT true,
	`can_edit_character_description` integer DEFAULT true,
	`can_edit_character_skills` integer DEFAULT true,
	`can_edit_character_portrait` integer DEFAULT false,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_permissions_game_id_unique` ON `game_permissions` (`game_id`);--> statement-breakpoint
DROP TABLE `character_initial_items`;--> statement-breakpoint
DROP TABLE `game_conditions`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_states` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`data_type` text DEFAULT 'text',
	`initial_value` text,
	`visibility` text DEFAULT 'visible',
	`display_condition` text,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_states`("id", "game_id", "name", "description", "data_type", "initial_value", "visibility", "display_condition", "position") SELECT "id", "game_id", "name", "description", "data_type", "initial_value", "visibility", "display_condition", "position" FROM `states`;--> statement-breakpoint
DROP TABLE `states`;--> statement-breakpoint
ALTER TABLE `__new_states` RENAME TO `states`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_triggers` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`condition` text NOT NULL,
	`effect` text NOT NULL,
	`trigger_on_turn` integer,
	`one_shot` integer DEFAULT false,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_triggers`("id", "game_id", "name", "condition", "effect", "trigger_on_turn", "one_shot", "position") SELECT "id", "game_id", "name", "condition", "effect", "trigger_on_turn", "one_shot", "position" FROM `triggers`;--> statement-breakpoint
DROP TABLE `triggers`;--> statement-breakpoint
ALTER TABLE `__new_triggers` RENAME TO `triggers`;--> statement-breakpoint
CREATE TABLE `__new_games` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`public` integer DEFAULT false,
	`favorite` integer DEFAULT false,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`world_description` text NOT NULL,
	`author_style` text,
	`turn_instructions` text,
	`summarization_instructions` text,
	`first_prompt` text NOT NULL,
	`objective` text NOT NULL,
	`victory_condition` text,
	`defeat_condition` text,
	`image_model` text,
	`image_style` text,
	`image_instructions` text,
	`preview_image` text,
	`full_size_preview_image` text,
	`version` text DEFAULT '1.0',
	`design_notes` text,
	`source_game_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_games`("id", "user_id", "public", "favorite", "title", "description", "world_description", "author_style", "turn_instructions", "summarization_instructions", "first_prompt", "objective", "victory_condition", "defeat_condition", "image_model", "image_style", "image_instructions", "preview_image", "full_size_preview_image", "version", "design_notes", "source_game_id", "created_at", "updated_at") SELECT "id", "user_id", "public", "favorite", "title", "description", "world_description", "author_style", "turn_instructions", "summarization_instructions", "first_prompt", "objective", "victory_condition", "defeat_condition", "image_model", "image_style", "image_instructions", "preview_image", "full_size_preview_image", "version", "design_notes", "source_game_id", "created_at", "updated_at" FROM `games`;--> statement-breakpoint
DROP TABLE `games`;--> statement-breakpoint
ALTER TABLE `__new_games` RENAME TO `games`;