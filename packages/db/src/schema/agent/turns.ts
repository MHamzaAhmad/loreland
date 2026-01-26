import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Turns - Each turn in the gameplay session
 */
export const turns = sqliteTable("turns", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    turnNumber: integer("turn_number").notNull(),

    // Player input and AI response
    userMessage: text("user_message").notNull(),
    assistantResponse: text("assistant_response").notNull(),
    suggestedActions: text("suggested_actions", { mode: "json" }).$type<string[]>().default([]),

    // State tracking
    statesSnapshot: text("states_snapshot", { mode: "json" }).$type<Record<string, string>>(),
    triggersActivated: text("triggers_activated", { mode: "json" }).$type<string[]>().default([]),

    // Image and metadata
    sceneImageKey: text("scene_image_key"),
    agentThought: text("agent_thought"),
    turnOutcome: text("turn_outcome", { mode: "json" }),

    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export type TurnRecord = typeof turns.$inferSelect;
export type InsertTurn = typeof turns.$inferInsert;
