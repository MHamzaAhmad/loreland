CREATE TABLE `session_states` (
	`id` text PRIMARY KEY NOT NULL,
	`state_id` text NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL,
	`data_type` text DEFAULT 'text',
	`visibility` text DEFAULT 'visible',
	`display_condition` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_triggers` (
	`id` text PRIMARY KEY NOT NULL,
	`trigger_id` text NOT NULL,
	`name` text NOT NULL,
	`condition` text NOT NULL,
	`effect` text NOT NULL,
	`trigger_on_turn` integer,
	`one_shot` integer DEFAULT false,
	`fired` integer DEFAULT false,
	`fired_on_turn` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
DROP TABLE `character_state`;--> statement-breakpoint
ALTER TABLE `turns` ADD `states_snapshot` text;--> statement-breakpoint
ALTER TABLE `turns` ADD `triggers_activated` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `turns` DROP COLUMN `character_state`;