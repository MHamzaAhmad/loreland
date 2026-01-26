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
