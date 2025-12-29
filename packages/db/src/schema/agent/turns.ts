import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Character State Snapshot - JSON stored with each turn
 */
export interface CharacterStateSnapshot {
    health: number;
    skillModifiers: Record<string, number>;
}

/**
 * Turns - Each turn in the gameplay session
 */
export const turns = sqliteTable("turns", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    turnNumber: integer("turn_number").notNull(),
    userMessage: text("user_message").notNull(),
    assistantResponse: text("assistant_response").notNull(),
    suggestedActions: text("suggested_actions", { mode: "json" }).$type<string[]>().default([]),
    characterState: text("character_state", { mode: "json" }).$type<CharacterStateSnapshot>().notNull(),
    sceneImageKey: text("scene_image_key"), // R2 key for AI-generated scene image
    agentThought: text("agent_thought"), // The AI's internal analysis of the turn
    turnOutcome: text("turn_outcome", { mode: "json" }), // Structured outcome data (success/fail, etc.)
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export type TurnRecord = typeof turns.$inferSelect;
export type InsertTurn = typeof turns.$inferInsert;

