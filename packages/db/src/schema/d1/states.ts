import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { games } from "./games";

/**
 * States - Track any game state during gameplay
 * Examples: Player Health, World Mood, Inventory items, NPC relationships
 */
export const states = sqliteTable("states", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),
    dataType: text("data_type", { enum: ["text", "number", "boolean"] }).default("text"),
    initialValue: text("initial_value"),

    // Visibility & Display
    // visible: always shown, hidden: AI uses but never shown, conditional: shown when displayCondition met
    visibility: text("visibility", { enum: ["visible", "hidden", "conditional"] }).default("visible"),
    displayCondition: text("display_condition"),

    position: integer("position").notNull().default(0),
});

/**
 * Character Initial States - Per-character starting state values
 */
export const characterInitialStates = sqliteTable("character_initial_states", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    characterId: text("character_id").notNull(),
    stateId: text("state_id").notNull(),
    value: text("value").notNull(),
});
