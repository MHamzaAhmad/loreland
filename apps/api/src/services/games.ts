import { eq, desc, and } from "drizzle-orm";
import { games, gameSkills, gameConditions } from "@packages/db/schema/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { CreateGameInput, UpdateGameInput, ListGamesQuery } from "../lib/schemas";

export class GamesService {
    constructor(private db: DrizzleD1Database) { }

    /**
     * List games for a user with pagination
     */
    async list(userId: string, query: ListGamesQuery) {
        const conditions = [eq(games.userId, userId)];

        if (query.favorite !== undefined) {
            conditions.push(eq(games.favorite, query.favorite));
        }

        const results = await this.db
            .select()
            .from(games)
            .where(and(...conditions))
            .orderBy(desc(games.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return results;
    }

    /**
     * Get a single game by ID with authorization check
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
     * Get full game with related data (skills, conditions)
     */
    async getFull(id: string, userId: string) {
        const game = await this.get(id, userId);
        if (!game) return null;

        const [skills, conditions] = await Promise.all([
            this.db.select().from(gameSkills).where(eq(gameSkills.gameId, id)),
            this.db.select().from(gameConditions).where(eq(gameConditions.gameId, id)),
        ]);

        return { ...game, skills, conditions };
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
