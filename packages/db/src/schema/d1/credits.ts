import { sqliteTable, text, real, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { games } from "./games";

/**
 * User Credits Balance
 * 
 * Main balance table with atomic update support.
 * Uses 'real' type to support fractional credits.
 * Balance includes both purchased credits AND earnings from games.
 */
export const userCredits = sqliteTable("user_credits", {
    userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    balance: real("balance").notNull().default(0),
    lifetimeSpent: real("lifetime_spent").notNull().default(0),
    lifetimeEarned: real("lifetime_earned").notNull().default(0), // Creator earnings
    /** Billing mode: 'prepaid' (credit packs) or 'usage' (pay as you go) */
    billingMode: text("billing_mode", { enum: ["prepaid", "usage"] }).notNull().default("prepaid"),
    /** Polar subscription ID for usage billing mode */
    polarSubscriptionId: text("polar_subscription_id"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
});

/**
 * Credit Transactions
 * 
 * Audit log for all credit changes (purchases, usage, refunds, earnings).
 * Stores cost breakdown for analytics and user display.
 */
export const creditTransactions = sqliteTable("credit_transactions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    amount: real("amount").notNull(), // Positive = credit, negative = debit
    balanceAfter: real("balance_after").notNull(),
    type: text("type").notNull(), // 'purchase' | 'usage' | 'refund' | 'bonus' | 'earnings'
    operationType: text("operation_type"), // 'turn' | 'game_generation' | 'image' | null
    // Cost breakdown for analytics
    costBreakdown: text("cost_breakdown", { mode: "json" }).$type<{
        aiCostUSD?: number;
        aiCredits?: number;
        imageCredits?: number;
        imageType?: string;
        creatorShare?: number;
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
 * Creator Earnings
 * 
 * Tracks earnings when players play a creator's game.
 * Earnings are added to creator's balance (unified with purchases).
 */
export const creatorEarnings = sqliteTable("creator_earnings", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    creatorId: text("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    playerId: text("player_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    creditsEarned: real("credits_earned").notNull(),
    totalCharged: real("total_charged").notNull(),
    sessionId: text("session_id"),
    turnNumber: integer("turn_number"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
}, (table) => [
    index("earnings_creator_idx").on(table.creatorId),
    index("earnings_game_idx").on(table.gameId),
    index("earnings_created_idx").on(table.createdAt),
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
