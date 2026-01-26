import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Session Triggers - Track trigger status during gameplay
 * Copied from D1 triggers at session start, tracks which have fired
 */
export const sessionTriggers = sqliteTable("session_triggers", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    triggerId: text("trigger_id").notNull(),     // Links to D1 triggers.id
    name: text("name").notNull(),
    condition: text("condition").notNull(),
    effect: text("effect").notNull(),
    triggerOnTurn: integer("trigger_on_turn"),
    oneShot: integer("one_shot", { mode: "boolean" }).default(false),
    fired: integer("fired", { mode: "boolean" }).default(false),
    firedOnTurn: integer("fired_on_turn"),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export type SessionTriggerRecord = typeof sessionTriggers.$inferSelect;
export type InsertSessionTrigger = typeof sessionTriggers.$inferInsert;
