import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { messages } from "./messages";

/**
 * Image Refs - References to generated images stored in R2
 */
export const imageRefs = sqliteTable("image_refs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    messageId: text("message_id").references(() => messages.id, { onDelete: "cascade" }),
    r2Key: text("r2_key").notNull(),
    type: text("type", { enum: ["character", "scene", "item"] }).notNull(),
    prompt: text("prompt"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
