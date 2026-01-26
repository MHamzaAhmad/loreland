import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { games } from "./games";

/**
 * Characters - Playable characters for a game
 */
export const characters = sqliteTable("characters", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    characterId: text("character_id").notNull(), // External ID like "7SfpAUSL"

    name: text("name").notNull(),
    description: text("description").notNull(),

    // Portrait images
    portrait: text("portrait"),
    fullSizePortrait: text("full_size_portrait"),
    portraitOptions: text("portrait_options", { mode: "json" }).$type<string[]>().default([]),
    fullSizePortraitOptions: text("full_size_portrait_options", { mode: "json" }).$type<string[]>().default([]),
    currentPortraitIndex: integer("current_portrait_index").default(0),
    portraitPromptDetails: text("portrait_prompt_details", { mode: "json" }).$type<Record<string, unknown>>(),

    position: integer("position").notNull(),
});

/**
 * Character Skills - Skill values for each character
 */
export const characterSkills = sqliteTable("character_skills", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    characterId: text("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
    skillName: text("skill_name").notNull(),
    value: integer("value").notNull().default(0),
});
