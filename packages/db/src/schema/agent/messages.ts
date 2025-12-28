import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Messages - Conversation history within a game session
 */
export const messages = sqliteTable("messages", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
    turnNumber: integer("turn_number"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

/**
 * Summary - Rolling conversation summary for context management
 */
export const summary = sqliteTable("summary", {
    id: integer("id").primaryKey().default(1),
    content: text("content").notNull(),
    lastTurn: integer("last_turn").default(0),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
