import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

/**
 * User Credits Balance
 * 
 * Main balance table with atomic update support.
 * Uses 'real' type to support fractional credits.
 */
export const userCredits = sqliteTable("user_credits", {
    userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    balance: real("balance").notNull().default(0),
    lifetimeSpent: real("lifetime_spent").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
});

/**
 * Credit Transactions
 * 
 * Audit log for all credit changes (purchases, usage, refunds).
 * Stores cost breakdown for analytics and user display.
 */
export const creditTransactions = sqliteTable("credit_transactions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    amount: real("amount").notNull(), // Positive = credit, negative = debit
    balanceAfter: real("balance_after").notNull(),
    type: text("type").notNull(), // 'purchase' | 'usage' | 'refund' | 'bonus'
    operationType: text("operation_type"), // 'turn' | 'game_generation' | 'image' | null
    // Cost breakdown for analytics
    costBreakdown: text("cost_breakdown", { mode: "json" }).$type<{
        aiCostUSD?: number;
        aiCredits?: number;
        imageCredits?: number;
        imageType?: string;
    }>(),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
}, (table) => [
    index("credit_transactions_user_idx").on(table.userId),
    index("credit_transactions_type_idx").on(table.type),
    index("credit_transactions_created_idx").on(table.createdAt),
]);

/**
 * Polar Webhooks
 * 
 * Tracks processed webhook events for idempotency.
 * Prevents double-processing of the same event.
 */
export const polarWebhooks = sqliteTable("polar_webhooks", {
    eventId: text("event_id").primaryKey(),
    eventType: text("event_type").notNull(),
    processedAt: integer("processed_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
});
