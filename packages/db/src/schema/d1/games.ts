import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

/**
 * Games - Core game/world configuration
 */
export const games = sqliteTable("games", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    public: integer("public", { mode: "boolean" }).default(false),
    favorite: integer("favorite", { mode: "boolean" }).default(false),

    // Core Identity
    title: text("title").notNull(),
    description: text("description").notNull(),

    // World & Narrative
    worldDescription: text("world_description").notNull(),
    authorStyle: text("author_style"),
    turnInstructions: text("turn_instructions"),
    summarizationInstructions: text("summarization_instructions"),
    firstPrompt: text("first_prompt").notNull(),

    // End Conditions
    objective: text("objective").notNull(),
    victoryCondition: text("victory_condition"),
    defeatCondition: text("defeat_condition"),

    // Image Generation
    imageModel: text("image_model"),
    imageStyle: text("image_style"),
    imageInstructions: text("image_instructions"),
    previewImage: text("preview_image"),
    fullSizePreviewImage: text("full_size_preview_image"),

    // Metadata
    version: text("version").default("1.0"),
    designNotes: text("design_notes"),
    sourceGameId: text("source_game_id"),

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

/**
 * Keyword Instructions - Context provided when keywords detected in user actions
 */
export const keywordInstructions = sqliteTable("keyword_instructions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    instruction: text("instruction").notNull(),
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
