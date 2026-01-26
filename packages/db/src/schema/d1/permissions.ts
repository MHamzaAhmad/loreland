import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { games } from "./games";

/**
 * Game Permissions - Control what players can customize
 */
export const gamePermissions = sqliteTable("game_permissions", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }).unique(),

    canEditCharacterName: integer("can_edit_character_name", { mode: "boolean" }).default(true),
    canEditCharacterDescription: integer("can_edit_character_description", { mode: "boolean" }).default(true),
    canEditCharacterSkills: integer("can_edit_character_skills", { mode: "boolean" }).default(true),
    canEditCharacterPortrait: integer("can_edit_character_portrait", { mode: "boolean" }).default(false),
});
