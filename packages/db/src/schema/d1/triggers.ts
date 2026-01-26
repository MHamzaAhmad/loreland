import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { games } from "./games";

/**
 * Triggers - Modify game behavior when conditions are met
 * Examples: "Angry Narrator" when player eats apple, changes author style
 */
export const triggers = sqliteTable("triggers", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    condition: text("condition").notNull(),
    effect: text("effect").notNull(),

    // Optional: trigger on specific turn number
    triggerOnTurn: integer("trigger_on_turn"),
    // If true, trigger fires only once
    oneShot: integer("one_shot", { mode: "boolean" }).default(false),

    position: integer("position").notNull().default(0),
});
