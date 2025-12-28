CREATE TABLE `lorebook_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`keywords` text DEFAULT '[]',
	`position` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tracked_items` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`data_type` text DEFAULT 'text',
	`visibility` text DEFAULT 'everyone',
	`update_instructions` text,
	`initial_value` text,
	`initial_value_based_on_pc` text DEFAULT 'same',
	`auto_update` integer DEFAULT true,
	`position` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trigger_events` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`trigger_on_turn` integer,
	`condition` text,
	`effect` text,
	`position` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character_initial_items` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`tracked_item_id` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`skill_name` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`character_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`portrait` text,
	`full_size_portrait` text,
	`portrait_options` text DEFAULT '[]',
	`full_size_portrait_options` text DEFAULT '[]',
	`current_portrait_index` integer DEFAULT 0,
	`portrait_prompt_details` text,
	`position` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`type` text NOT NULL,
	`condition` text NOT NULL,
	`text` text NOT NULL,
	`already_fired` integer DEFAULT false,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `game_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`background` text NOT NULL,
	`instructions` text NOT NULL,
	`objective` text NOT NULL,
	`author_style` text,
	`recommended_ai_model` text,
	`first_input` text,
	`version` text DEFAULT '1.0',
	`favorite` integer DEFAULT false,
	`design_notes` text,
	`image_model` text,
	`image_style` text,
	`illustration_style_non_char_low` text,
	`illustration_style_non_char_high` text,
	`illustration_style_char_low` text,
	`illustration_style_char_high` text,
	`image_style_char_pre` text,
	`image_style_char_post` text,
	`image_style_non_char_pre` text,
	`image_style_non_char_post` text,
	`preview_image` text,
	`full_size_preview_image` text,
	`preview_image_options` text DEFAULT '[]',
	`current_preview_image_index` integer DEFAULT 0,
	`image_prompt_details` text,
	`nsfw` integer DEFAULT false,
	`content_warnings` text,
	`description_request` text,
	`summary_request` text,
	`enable_ai_specific_instruction_blocks` integer DEFAULT false,
	`auto_advance_version` integer DEFAULT true,
	`allow_change_character_name` integer DEFAULT true,
	`allow_change_character_description` integer DEFAULT true,
	`allow_change_character_skills` integer DEFAULT true,
	`allow_change_character_item_values` integer DEFAULT false,
	`allow_change_character_portrait` integer DEFAULT false,
	`allow_change_character_new_portrait` integer DEFAULT true,
	`sharing_permission` integer DEFAULT true,
	`editing_permission` integer DEFAULT true,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `npcs` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`name` text NOT NULL,
	`detail` text,
	`one_liner` text,
	`appearance` text,
	`location` text,
	`secret_info` text,
	`names` text DEFAULT '[]',
	`img_appearance` text,
	`img_clothing` text,
	`position` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
