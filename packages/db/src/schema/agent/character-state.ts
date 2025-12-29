import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Character State - Current mutable state of the player's character
 */
export const characterState = sqliteTable("character_state", {
    id: integer("id").primaryKey().default(1),
    characterId: text("character_id").notNull(),
    health: integer("health").notNull().default(100),
    skillModifiers: text("skill_modifiers", { mode: "json" }).$type<Record<string, number>>().default({}),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export type CharacterStateRecord = typeof characterState.$inferSelect;
export type InsertCharacterState = typeof characterState.$inferInsert;
