import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { users } from "./auth";

/**
 * Device Fingerprints
 * 
 * Tracks device fingerprints that have claimed welcome credits.
 * Prevents abuse by blocking duplicate credit claims from same device.
 */
export const deviceFingerprints = sqliteTable("device_fingerprints", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    fingerprint: text("fingerprint").notNull().unique(),
    ipAddress: text("ip_address"),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    claimedCredits: integer("claimed_credits", { mode: "boolean" }).default(true).notNull(),
    /** Indicates this fingerprint has an active anonymous user that should be restored */
    isActiveAnonymous: integer("is_active_anonymous", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
}, (table) => [
    index("device_fingerprints_fingerprint_idx").on(table.fingerprint),
    index("device_fingerprints_user_idx").on(table.userId),
]);
