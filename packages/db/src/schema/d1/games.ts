import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Games - Core game configuration
 */
export const games = sqliteTable("games", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),

    // Core
    title: text("title").notNull(),
    description: text("description").notNull(),
    background: text("background").notNull(),
    instructions: text("instructions").notNull(),
    objective: text("objective").notNull(),
    authorStyle: text("author_style"),
    recommendedAIModel: text("recommended_ai_model"),
    firstInput: text("first_input"),
    version: text("version").default("1.0"),
    favorite: integer("favorite", { mode: "boolean" }).default(false),
    designNotes: text("design_notes"),

    // Image Settings
    imageModel: text("image_model"),
    imageStyle: text("image_style"),
    illustrationStyleNonCharLow: text("illustration_style_non_char_low"),
    illustrationStyleNonCharHigh: text("illustration_style_non_char_high"),
    illustrationStyleCharLow: text("illustration_style_char_low"),
    illustrationStyleCharHigh: text("illustration_style_char_high"),
    imageStyleCharPre: text("image_style_char_pre"),
    imageStyleCharPost: text("image_style_char_post"),
    imageStyleNonCharPre: text("image_style_non_char_pre"),
    imageStyleNonCharPost: text("image_style_non_char_post"),
    previewImage: text("preview_image"),
    fullSizePreviewImage: text("full_size_preview_image"),
    previewImageOptions: text("preview_image_options", { mode: "json" }).$type<string[]>().default([]),
    currentPreviewImageIndex: integer("current_preview_image_index").default(0),
    imagePromptDetails: text("image_prompt_details", { mode: "json" }).$type<Record<string, unknown>>(),

    // Content Settings
    nsfw: integer("nsfw", { mode: "boolean" }).default(false),
    contentWarnings: text("content_warnings"),
    descriptionRequest: text("description_request"),
    summaryRequest: text("summary_request"),
    enableAISpecificInstructionBlocks: integer("enable_ai_specific_instruction_blocks", { mode: "boolean" }).default(false),
    autoAdvanceVersion: integer("auto_advance_version", { mode: "boolean" }).default(true),

    // Permissions
    allowChangeCharacterName: integer("allow_change_character_name", { mode: "boolean" }).default(true),
    allowChangeCharacterDescription: integer("allow_change_character_description", { mode: "boolean" }).default(true),
    allowChangeCharacterSkills: integer("allow_change_character_skills", { mode: "boolean" }).default(true),
    allowChangeCharacterItemValues: integer("allow_change_character_item_values", { mode: "boolean" }).default(false),
    allowChangeCharacterPortrait: integer("allow_change_character_portrait", { mode: "boolean" }).default(false),
    allowChangeCharacterNewPortrait: integer("allow_change_character_new_portrait", { mode: "boolean" }).default(true),
    sharingPermission: integer("sharing_permission", { mode: "boolean" }).default(true),
    editingPermission: integer("editing_permission", { mode: "boolean" }).default(true),

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

/**
 * Game Skills - Available skills for a game
 */
export const gameSkills = sqliteTable("game_skills", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
});

/**
 * Game Conditions - Victory and defeat conditions
 */
export const gameConditions = sqliteTable("game_conditions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["victory", "defeat"] }).notNull(),
    condition: text("condition").notNull(),
    text: text("text").notNull(),
    alreadyFired: integer("already_fired", { mode: "boolean" }).default(false),
});
