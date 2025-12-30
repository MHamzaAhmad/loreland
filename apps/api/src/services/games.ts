import { eq, desc, and, inArray, or, sql } from "drizzle-orm";
import { games, gameSkills, gameConditions, characters, npcs, lorebookEntries, trackedItems, triggerEvents } from "@packages/db/schema/d1";
import * as schema from "@packages/db/schema/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { CreateGameInput, UpdateGameInput, ListGamesQuery } from "../lib/schemas";
import type { SQLWrapper } from "drizzle-orm";

export class GamesService {
    constructor(private db: DrizzleD1Database<typeof schema>) { }

    /**
     * List games for a user with pagination
     */
    async list(options: {
        userId?: string;
        isPublic?: boolean;
        ids?: string[];
        limit?: number;
        offset?: number;
        favorite?: boolean;
    }) {
        const conditions: any[] = []; // Using any to avoid complex SQL type issues with array spread

        if (options.ids) {
            if (options.ids.length === 0) return [];
            conditions.push(inArray(games.id, options.ids));
        }

        if (options.userId && options.isPublic) {
            // Show my games OR public games
            conditions.push(sql`(${games.userId} = ${options.userId} OR ${games.public} = 1)`);
        } else if (options.userId) {
            conditions.push(eq(games.userId, options.userId));
        } else if (options.isPublic) {
            conditions.push(eq(games.public, true));
        }

        if (options.favorite !== undefined) {
            conditions.push(eq(games.favorite, options.favorite));
        }

        return await this.db
            .select()
            .from(games)
            .where(and(...conditions))
            .orderBy(desc(games.createdAt))
            .limit(options.limit ?? 20)
            .offset(options.offset ?? 0);
    }

    /**
     * Fork a game
     */
    async fork(originalGameId: string, newUserId: string) {
        // 1. Get original game
        const [original] = await this.db
            .select()
            .from(games)
            .where(eq(games.id, originalGameId))
            .limit(1);

        if (!original) return null;

        // Check if forkable (public or owned by user)
        if (!original.public && original.userId !== newUserId) {
            return null; // Cannot fork private game of another user
        }

        // Fetch children
        const [chars, npcList, lore, items, triggers] = await Promise.all([
            this.db.select().from(characters).where(eq(characters.gameId, originalGameId)),
            this.db.select().from(npcs).where(eq(npcs.gameId, originalGameId)),
            this.db.select().from(lorebookEntries).where(eq(lorebookEntries.gameId, originalGameId)),
            this.db.select().from(trackedItems).where(eq(trackedItems.gameId, originalGameId)),
            this.db.select().from(triggerEvents).where(eq(triggerEvents.gameId, originalGameId)),
        ]);

        // 2. Create new game
        const [newGame] = await this.db.insert(games).values({
            userId: newUserId,
            title: `${original.title} (Fork)`,
            description: original.description,
            background: original.background,
            instructions: original.instructions,
            objective: original.objective,
            authorStyle: original.authorStyle,
            designNotes: original.designNotes,
            nsfw: original.nsfw,
            contentWarnings: original.contentWarnings,
            sourceGameId: original.id,
            // Copy visual settings
            imageModel: original.imageModel,
            imageStyle: original.imageStyle,
            previewImage: original.previewImage,
            fullSizePreviewImage: original.fullSizePreviewImage,
        }).returning();

        // 3. Copy children
        // Characters
        if (chars.length > 0) {
            await this.db.insert(characters).values(
                chars.map((c: typeof characters.$inferSelect) => ({
                    ...c,
                    id: crypto.randomUUID(),
                    gameId: newGame.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }))
            );
        }

        // NPCs
        if (npcList.length > 0) {
            await this.db.insert(npcs).values(
                npcList.map((n: typeof npcs.$inferSelect) => ({
                    ...n,
                    id: crypto.randomUUID(),
                    gameId: newGame.id,
                }))
            );
        }

        // Lore
        if (lore.length > 0) {
            await this.db.insert(lorebookEntries).values(
                lore.map((l: typeof lorebookEntries.$inferSelect) => ({
                    ...l,
                    id: crypto.randomUUID(),
                    gameId: newGame.id,
                }))
            );
        }

        // Items
        if (items.length > 0) {
            await this.db.insert(trackedItems).values(
                items.map((i: typeof trackedItems.$inferSelect) => ({
                    ...i,
                    id: crypto.randomUUID(),
                    gameId: newGame.id,
                }))
            );
        }

        // Triggers
        if (triggers.length > 0) {
            await this.db.insert(triggerEvents).values(
                triggers.map((t: typeof triggerEvents.$inferSelect) => ({
                    ...t,
                    id: crypto.randomUUID(),
                    gameId: newGame.id,
                }))
            );
        }

        return newGame;
    }

    /**
     * Get a single game by ID with strict ownership check
     */
    async get(id: string, userId: string) {
        const [game] = await this.db
            .select()
            .from(games)
            .where(and(eq(games.id, id), eq(games.userId, userId)))
            .limit(1);

        return game ?? null;
    }

    /**
     * Get a single game by ID if owned OR public
     */
    async getPublicOrOwned(id: string, userId: string) {
        const [game] = await this.db
            .select()
            .from(games)
            .where(and(
                eq(games.id, id),
                or(eq(games.userId, userId), eq(games.public, true))
            ))
            .limit(1);

        return game ?? null;
    }

    /**
     * Get full game with related data (skills, conditions)
     */
    async getFull(id: string, userId: string, includePublic: boolean = false) {
        const game = includePublic
            ? await this.getPublicOrOwned(id, userId)
            : await this.get(id, userId);

        if (!game) return null;

        const [skills, conditions, chars, npcList, lore, items, triggers] = await Promise.all([
            this.db.select().from(gameSkills).where(eq(gameSkills.gameId, id)),
            this.db.select().from(gameConditions).where(eq(gameConditions.gameId, id)),
            this.db.select().from(characters).where(eq(characters.gameId, id)),
            this.db.select().from(npcs).where(eq(npcs.gameId, id)),
            this.db.select().from(lorebookEntries).where(eq(lorebookEntries.gameId, id)),
            this.db.select().from(trackedItems).where(eq(trackedItems.gameId, id)),
            this.db.select().from(triggerEvents).where(eq(triggerEvents.gameId, id)),
        ]);

        return {
            ...game,
            skills,
            conditions,
            characters: chars,
            npcs: npcList,
            lorebookEntries: lore,
            trackedItems: items,
            triggerEvents: triggers
        };
    }

    /**
     * Create a new game
     */
    async create(data: CreateGameInput, userId: string) {
        const [game] = await this.db
            .insert(games)
            .values({
                userId,
                title: data.title,
                description: data.description,
                background: data.background,
                instructions: data.instructions,
                objective: data.objective,
                authorStyle: data.authorStyle,
                designNotes: data.designNotes,
                nsfw: data.nsfw,
                contentWarnings: data.contentWarnings,
            })
            .returning();

        return game;
    }

    /**
     * Update an existing game with authorization check
     */
    async update(id: string, data: UpdateGameInput, userId: string) {
        // First verify ownership
        const existing = await this.get(id, userId);
        if (!existing) return null;

        const { characters: chars, npcs: npcList, lorebookEntries: lore, trackedItems: items, triggerEvents: triggers, ...gameData } = data;

        const [updated] = await this.db
            .update(games)
            .set({
                ...gameData,
                updatedAt: new Date(),
            })
            .where(eq(games.id, id))
            .returning();

        // Handle nested updates
        // 1. Characters
        if (chars) {
            const existing = await this.db.select({ id: characters.id }).from(characters).where(eq(characters.gameId, id));
            const existingIds = new Set(existing.map(e => e.id));
            const keepIds = new Set<string>();

            for (const char of chars) {
                if (char.id && existingIds.has(char.id)) {
                    keepIds.add(char.id);
                    await this.db.update(characters).set(char).where(eq(characters.id, char.id));
                } else {
                    const newId = crypto.randomUUID();
                    await this.db.insert(characters).values({
                        ...char,
                        id: newId,
                        gameId: id,
                        characterId: (char as any).characterId || crypto.randomUUID().substring(0, 8),
                        name: char.name || "Unknown",
                        description: char.description || "",
                        position: char.position || 0,
                    } as any);
                }
            }

            const toDelete = Array.from(existingIds).filter(eid => !keepIds.has(eid));
            if (toDelete.length > 0) {
                await this.db.delete(characters).where(inArray(characters.id, toDelete));
            }
        }

        // 2. NPCs
        if (npcList) {
            const existing = await this.db.select({ id: npcs.id }).from(npcs).where(eq(npcs.gameId, id));
            const existingIds = new Set(existing.map(e => e.id));
            const keepIds = new Set<string>();

            for (const npc of npcList) {
                if (npc.id && existingIds.has(npc.id)) {
                    keepIds.add(npc.id);
                    await this.db.update(npcs).set(npc).where(eq(npcs.id, npc.id));
                } else {
                    await this.db.insert(npcs).values({
                        ...npc,
                        id: crypto.randomUUID(),
                        gameId: id,
                        name: npc.name || "Unknown",
                        position: npc.position || 0,
                    } as any);
                }
            }

            const toDelete = Array.from(existingIds).filter(eid => !keepIds.has(eid));
            if (toDelete.length > 0) {
                await this.db.delete(npcs).where(inArray(npcs.id, toDelete));
            }
        }

        // 3. Lorebook Entries
        if (lore) {
            const existing = await this.db.select({ id: lorebookEntries.id }).from(lorebookEntries).where(eq(lorebookEntries.gameId, id));
            const existingIds = new Set(existing.map(e => e.id));
            const keepIds = new Set<string>();

            for (const entry of lore) {
                if (entry.id && existingIds.has(entry.id)) {
                    keepIds.add(entry.id);
                    await this.db.update(lorebookEntries).set(entry).where(eq(lorebookEntries.id, entry.id));
                } else {
                    await this.db.insert(lorebookEntries).values({
                        ...entry,
                        id: crypto.randomUUID(),
                        gameId: id,
                        name: entry.name || "Unknown",
                        content: entry.content || "",
                        position: entry.position || 0,
                    } as any);
                }
            }

            const toDelete = Array.from(existingIds).filter(eid => !keepIds.has(eid));
            if (toDelete.length > 0) {
                await this.db.delete(lorebookEntries).where(inArray(lorebookEntries.id, toDelete));
            }
        }

        // 4. Tracked Items
        if (items) {
            const existing = await this.db.select({ id: trackedItems.id }).from(trackedItems).where(eq(trackedItems.gameId, id));
            const existingIds = new Set(existing.map(e => e.id));
            const keepIds = new Set<string>();

            for (const item of items) {
                if (item.id && existingIds.has(item.id)) {
                    keepIds.add(item.id);
                    await this.db.update(trackedItems).set(item).where(eq(trackedItems.id, item.id));
                } else {
                    await this.db.insert(trackedItems).values({
                        ...item,
                        id: crypto.randomUUID(),
                        gameId: id,
                        name: item.name || "Unknown",
                        position: item.position || 0,
                    } as any);
                }
            }

            const toDelete = Array.from(existingIds).filter(eid => !keepIds.has(eid));
            if (toDelete.length > 0) {
                await this.db.delete(trackedItems).where(inArray(trackedItems.id, toDelete));
            }
        }

        // 5. Trigger Events
        if (triggers) {
            const existing = await this.db.select({ id: triggerEvents.id }).from(triggerEvents).where(eq(triggerEvents.gameId, id));
            const existingIds = new Set(existing.map(e => e.id));
            const keepIds = new Set<string>();

            for (const trigger of triggers) {
                if (trigger.id && existingIds.has(trigger.id)) {
                    keepIds.add(trigger.id);
                    await this.db.update(triggerEvents).set(trigger).where(eq(triggerEvents.id, trigger.id));
                } else {
                    await this.db.insert(triggerEvents).values({
                        ...trigger,
                        id: crypto.randomUUID(),
                        gameId: id,
                        name: trigger.name || "Unknown",
                        position: trigger.position || 0,
                    } as any);
                }
            }

            const toDelete = Array.from(existingIds).filter(eid => !keepIds.has(eid));
            if (toDelete.length > 0) {
                await this.db.delete(triggerEvents).where(inArray(triggerEvents.id, toDelete));
            }
        }

        return updated;
    }

    /**
     * Delete a game with authorization check (cascade handled by FK)
     */
    async delete(id: string, userId: string) {
        // First verify ownership
        const existing = await this.get(id, userId);
        if (!existing) return false;

        await this.db.delete(games).where(eq(games.id, id));
        return true;
    }

    /**
     * Create initial game record for generation workflow
     */
    async createPending(userId: string, prompt: string) {
        const [game] = await this.db
            .insert(games)
            .values({
                userId,
                title: "Generating...",
                description: prompt,
                background: "",
                instructions: "",
                objective: "",
                designNotes: `Generation prompt: ${prompt}`,
            })
            .returning();

        return game;
    }

    /**
     * Finalize game after generation completes
     */
    async finalize(
        id: string,
        data: {
            title: string;
            description: string;
            background: string;
            instructions: string;
            objective: string;
            previewImage?: string;
            fullSizePreviewImage?: string;
            imageStyle?: string;
        }
    ) {
        const [updated] = await this.db
            .update(games)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(games.id, id))
            .returning();

        return updated;
    }
}
