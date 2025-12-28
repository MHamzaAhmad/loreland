import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { games } from "./games";

/**
 * Lorebook Entries - Game lore and world-building
 */
export const lorebookEntries = sqliteTable("lorebook_entries", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    content: text("content").notNull(),
    keywords: text("keywords", { mode: "json" }).$type<string[]>().default([]),
    position: integer("position").notNull(),
});

/**
 * Tracked Items - Game variables that can change during play
 */
export const trackedItems = sqliteTable("tracked_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    dataType: text("data_type", { enum: ["text", "number", "boolean"] }).default("text"),
    visibility: text("visibility", { enum: ["everyone", "gm", "hidden"] }).default("everyone"),
    updateInstructions: text("update_instructions"),
    initialValue: text("initial_value"),
    initialValueBasedOnPC: text("initial_value_based_on_pc").default("same"),
    autoUpdate: integer("auto_update", { mode: "boolean" }).default(true),
    position: integer("position").notNull(),
});

/**
 * Trigger Events - Events that trigger on specific conditions
 */
export const triggerEvents = sqliteTable("trigger_events", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    triggerOnTurn: integer("trigger_on_turn"),
    condition: text("condition"),
    effect: text("effect"),
    position: integer("position").notNull(),
});
