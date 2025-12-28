import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Agent Runs - Debug/tracking for LLM calls
 */
export const agentRuns = sqliteTable("agent_runs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    turnNumber: integer("turn_number").notNull(),
    model: text("model").notNull(),
    tokensUsed: integer("tokens_used"),
    durationMs: integer("duration_ms"),
    error: text("error"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
