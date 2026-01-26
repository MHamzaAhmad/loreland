import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Session States - Live state values during gameplay
 * Copied from D1 states at session start, updated as game progresses
 */
export const sessionStates = sqliteTable("session_states", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    stateId: text("state_id").notNull(),        // Links to D1 states.id
    name: text("name").notNull(),                // Copied for fast access
    value: text("value").notNull(),              // Current value
    dataType: text("data_type", { enum: ["text", "number", "boolean"] }).default("text"),
    visibility: text("visibility", { enum: ["visible", "hidden", "conditional"] }).default("visible"),
    displayCondition: text("display_condition"),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export type SessionStateRecord = typeof sessionStates.$inferSelect;
export type InsertSessionState = typeof sessionStates.$inferInsert;
