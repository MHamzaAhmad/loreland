import { eq, desc, and, inArray, or, sql } from "drizzle-orm";
import { games, gameSkills, characters, npcs, lorebookEntries, states, triggers } from "@packages/db/schema/d1";
import * as schema from "@packages/db/schema/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { CreateGameInput, UpdateGameInput } from "../lib/schemas";

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
            firstPrompt: original.firstPrompt,
            authorStyle: original.authorStyle,
            turnInstructions: original.turnInstructions,
            summarizationInstructions: original.summarizationInstructions,
            victoryCondition: original.victoryCondition,
            defeatCondition: original.defeatCondition,
            designNotes: original.designNotes,
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
                turnInstructions: data.turnInstructions,
                summarizationInstructions: data.summarizationInstructions,
                victoryCondition: data.victoryCondition,
                defeatCondition: data.defeatCondition,
                imageInstructions: data.imageInstructions,
                imageStyle: data.imageStyle,
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
        if (chars) await this.syncChildren(id, characters, chars, "characters");
        if (npcList) await this.syncChildren(id, npcs, npcList, "npcs");
        if (lore) await this.syncChildren(id, lorebookEntries, lore, "lorebookEntries");
        if (stateList) await this.syncChildren(id, states, stateList, "states");
        if (triggerList) await this.syncChildren(id, triggers, triggerList, "triggers");

        return updated;
    }

    /**
     * Sync child records (upsert/delete pattern)
     */
    private async syncChildren(
        gameId: string,
        table: any,
        items: any[],
        type: string
    ) {
        const existingRecords = await this.db.select({ id: table.id }).from(table).where(eq(table.gameId, gameId));
        const existingIds = new Set(existingRecords.map(e => e.id));
        const keepIds = new Set<string>();

        for (const item of items) {
            if (item.id && existingIds.has(item.id)) {
                keepIds.add(item.id);
                await this.db.update(table).set(item).where(eq(table.id, item.id));
            } else {
                const newId = crypto.randomUUID();
                await this.db.insert(table).values({
                    ...item,
                    id: newId,
                    gameId,
                    name: item.name || "Unknown",
                    position: item.position || 0,
                } as any);
            }
        }

        const toDelete = Array.from(existingIds).filter(eid => !keepIds.has(eid));
        if (toDelete.length > 0) {
            await this.db.delete(table).where(inArray(table.id, toDelete));
        }
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
            // Enhanced fields from generation
            authorStyle?: string;
            turnInstructions?: string;
            summarizationInstructions?: string;
            victoryCondition?: string;
            defeatCondition?: string;
            // Image fields
            imageInstructions?: string;
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
