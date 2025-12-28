import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { games } from "./games";

/**
 * NPCs - Non-player characters for a game
 */
export const npcs = sqliteTable("npcs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    detail: text("detail"),
    oneLiner: text("one_liner"),
    appearance: text("appearance"),
    location: text("location"),
    secretInfo: text("secret_info"),
    names: text("names", { mode: "json" }).$type<string[]>().default([]), // Aliases

    // Image generation
    imgAppearance: text("img_appearance"),
    imgClothing: text("img_clothing"),

    position: integer("position").notNull(),
});
