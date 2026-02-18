import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { games } from "./games";

/**
 * Play Sessions - Tracks game play sessions in central D1 database
 * Used for listing/resuming sessions across devices
 */
export const playSessions = sqliteTable("play_sessions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    characterId: text("character_id").notNull(),
    characterName: text("character_name"),
    model: text("model").notNull().default("gemini-2.0-flash"),
    imageModel: text("image_model").notNull().default("prism-flash"),
    currentTurn: integer("current_turn").notNull().default(0),
    status: text("status", { enum: ["active", "completed", "abandoned"] }).default("active"),
    lastPlayedAt: integer("last_played_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
