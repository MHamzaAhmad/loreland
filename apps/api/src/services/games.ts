import { eq, desc, and, inArray, or, sql } from "drizzle-orm";
import { games, gameSkills, characters, npcs, lorebookEntries, states, triggers } from "@packages/db/schema/d1";
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
        const conditions: any[] = [];

        if (options.ids) {
            if (options.ids.length === 0) return [];
            conditions.push(inArray(games.id, options.ids));
        }

        if (options.userId && options.isPublic) {
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
        const [original] = await this.db
            .select()
            .from(games)
            .where(eq(games.id, originalGameId))
            .limit(1);

        if (!original) return null;

        if (!original.public && original.userId !== newUserId) {
            return null;
        }

        const [chars, npcList, lore, stateList, triggerList] = await Promise.all([
            this.db.select().from(characters).where(eq(characters.gameId, originalGameId)),
            this.db.select().from(npcs).where(eq(npcs.gameId, originalGameId)),
            this.db.select().from(lorebookEntries).where(eq(lorebookEntries.gameId, originalGameId)),
            this.db.select().from(states).where(eq(states.gameId, originalGameId)),
            this.db.select().from(triggers).where(eq(triggers.gameId, originalGameId)),
        ]);

        const [newGame] = await this.db.insert(games).values({
            userId: newUserId,
            title: `${original.title} (Fork)`,
            description: original.description,
            worldDescription: original.worldDescription,
            objective: original.objective,
            authorStyle: original.authorStyle,
            designNotes: original.designNotes,
            firstPrompt: original.firstPrompt,
            turnInstructions: original.turnInstructions,
            summarizationInstructions: original.summarizationInstructions,
            sourceGameId: original.id,
            imageModel: original.imageModel,
            imageStyle: original.imageStyle,
            imageInstructions: original.imageInstructions,
            previewImage: original.previewImage,
            fullSizePreviewImage: original.fullSizePreviewImage,
        }).returning();

        // Copy children
        if (chars.length > 0) {
            await this.db.insert(characters).values(
                chars.map((c) => ({
                    ...c,
                    id: crypto.randomUUID(),
                    gameId: newGame.id,
                }))
            );
        }

        if (npcList.length > 0) {
            await this.db.insert(npcs).values(
                npcList.map((n) => ({
                    ...n,
                    id: crypto.randomUUID(),
                    gameId: newGame.id,
                }))
            );
        }

        if (lore.length > 0) {
            await this.db.insert(lorebookEntries).values(
                lore.map((l) => ({
                    ...l,
                    id: crypto.randomUUID(),
                    gameId: newGame.id,
                }))
            );
        }

        if (stateList.length > 0) {
            await this.db.insert(states).values(
                stateList.map((s) => ({
                    ...s,
                    id: crypto.randomUUID(),
                    gameId: newGame.id,
                }))
            );
        }

        if (triggerList.length > 0) {
            await this.db.insert(triggers).values(
                triggerList.map((t) => ({
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
     * Get full game with related data
     */
    async getFull(id: string, userId: string, includePublic: boolean = false) {
        const game = includePublic
            ? await this.getPublicOrOwned(id, userId)
            : await this.get(id, userId);

        if (!game) return null;

        const [skills, chars, npcList, lore, stateList, triggerList] = await Promise.all([
            this.db.select().from(gameSkills).where(eq(gameSkills.gameId, id)),
            this.db.select().from(characters).where(eq(characters.gameId, id)),
            this.db.select().from(npcs).where(eq(npcs.gameId, id)),
            this.db.select().from(lorebookEntries).where(eq(lorebookEntries.gameId, id)),
            this.db.select().from(states).where(eq(states.gameId, id)),
            this.db.select().from(triggers).where(eq(triggers.gameId, id)),
        ]);

        return {
            ...game,
            skills,
            characters: chars,
            npcs: npcList,
            lorebookEntries: lore,
            states: stateList,
            triggers: triggerList
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
                worldDescription: data.worldDescription,
                objective: data.objective,
                firstPrompt: data.firstPrompt,
                authorStyle: data.authorStyle,
                designNotes: data.designNotes,
            })
            .returning();

        return game;
    }

    /**
     * Update an existing game with authorization check
     */
    async update(id: string, data: UpdateGameInput, userId: string) {
        const existing = await this.get(id, userId);
        if (!existing) return null;

        const { characters: chars, npcs: npcList, lorebookEntries: lore, states: stateList, triggers: triggerList, ...gameData } = data;

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
            const existingChars = await this.db.select({ id: characters.id }).from(characters).where(eq(characters.gameId, id));
            const existingIds = new Set(existingChars.map(e => e.id));
            const keepIds = new Set<string>();

            for (const char of chars) {
                if (char.id && existingIds.has(char.id)) {
                    keepIds.add(char.id);
                    await this.db.update(characters).set(char).where(eq(characters.id, char.id));
                } else {
                    await this.db.insert(characters).values({
                        ...char,
                        id: crypto.randomUUID(),
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
            const existingNpcs = await this.db.select({ id: npcs.id }).from(npcs).where(eq(npcs.gameId, id));
            const existingIds = new Set(existingNpcs.map(e => e.id));
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
            const existingLore = await this.db.select({ id: lorebookEntries.id }).from(lorebookEntries).where(eq(lorebookEntries.gameId, id));
            const existingIds = new Set(existingLore.map(e => e.id));
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

        // 4. States
        if (stateList) {
            const existingStates = await this.db.select({ id: states.id }).from(states).where(eq(states.gameId, id));
            const existingIds = new Set(existingStates.map(e => e.id));
            const keepIds = new Set<string>();

            for (const state of stateList) {
                if (state.id && existingIds.has(state.id)) {
                    keepIds.add(state.id);
                    await this.db.update(states).set(state).where(eq(states.id, state.id));
                } else {
                    await this.db.insert(states).values({
                        ...state,
                        id: crypto.randomUUID(),
                        gameId: id,
                        name: state.name || "Unknown",
                        position: state.position || 0,
                    } as any);
                }
            }

            const toDelete = Array.from(existingIds).filter(eid => !keepIds.has(eid));
            if (toDelete.length > 0) {
                await this.db.delete(states).where(inArray(states.id, toDelete));
            }
        }

        // 5. Triggers
        if (triggerList) {
            const existingTriggers = await this.db.select({ id: triggers.id }).from(triggers).where(eq(triggers.gameId, id));
            const existingIds = new Set(existingTriggers.map(e => e.id));
            const keepIds = new Set<string>();

            for (const trigger of triggerList) {
                if (trigger.id && existingIds.has(trigger.id)) {
                    keepIds.add(trigger.id);
                    await this.db.update(triggers).set(trigger).where(eq(triggers.id, trigger.id));
                } else {
                    await this.db.insert(triggers).values({
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
                await this.db.delete(triggers).where(inArray(triggers.id, toDelete));
            }
        }

        return updated;
    }

    /**
     * Delete a game with authorization check
     */
    async delete(id: string, userId: string) {
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
                worldDescription: "",
                objective: "",
                firstPrompt: "",
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
            worldDescription: string;
            objective: string;
            firstPrompt: string;
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
