import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Game Session - Stores full game config for this play session
 */
export const gameSession = sqliteTable("game_session", {
    id: integer("id").primaryKey().default(1),
    sessionId: text("session_id").notNull(), // Links to D1 play_sessions.id
    gameId: text("game_id").notNull(),
    characterId: text("character_id").notNull(),
    model: text("model").notNull().default("gemini-2.0-flash"),
    imageModel: text("image_model").notNull().default("prism-flash"),
    config: text("config", { mode: "json" }).notNull(), // Full game config JSON
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export type GameSessionRecord = typeof gameSession.$inferSelect;
export type InsertGameSession = typeof gameSession.$inferInsert;
