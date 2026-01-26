/**
 * Embeddings and Vectorize service for semantic game search
 * Uses Workers AI bge-base-en-v1.5 model (768 dimensions)
 */
export class EmbeddingsService {
    constructor(
        private ai: Ai,
        private vectorize: VectorizeIndex
    ) { }

    /**
     * Generate an embedding vector from text using bge-base-en-v1.5
     * This model produces 768-dimensional vectors optimized for English text
     */
    async generateEmbedding(text: string): Promise<number[]> {
        const response = await this.ai.run(
            "@cf/baai/bge-large-en-v1.5",
            { text: [text] }
        );

        // Response contains array of embeddings, we only passed one text
        const data = response as { data: number[][] };
        if (!data.data || data.data.length === 0) {
            throw new Error("Failed to generate embedding");
        }

        return data.data[0];
    }

    /**
     * Create a searchable text from game data
     * Combines title and description for better semantic matching
     */
    private createSearchableText(game: {
        title: string;
        description: string;
        worldDescription?: string;
        objective?: string;
    }): string {
        const parts = [game.title, game.description];
        if (game.worldDescription) parts.push(game.worldDescription);
        if (game.objective) parts.push(game.objective);

        // Truncate to avoid token limits (model handles ~512 tokens)
        return parts.join(" ").slice(0, 2000);
    }

    /**
     * Vectorize a game and upsert into the index
     * Called on game create, update (if content changed), and after generation
     */
    async upsertGameVector(game: {
        id: string;
        userId: string;
        title: string;
        description: string;
        isPublic: boolean;
        worldDescription?: string;
        objective?: string;
    }): Promise<void> {
        const text = this.createSearchableText(game);
        const embedding = await this.generateEmbedding(text);

        await this.vectorize.upsert([
            {
                id: game.id,
                values: embedding,
                metadata: {
                    userId: game.userId,
                    title: game.title,
                    isPublic: game.isPublic ? "true" : "false", // Vectorize metadata strings
                },
            },
        ]);
    }

    /**
     * Delete a game's vector from the index
     * Called on game deletion
     */
    async deleteGameVector(gameId: string): Promise<void> {
        await this.vectorize.deleteByIds([gameId]);
    }

    /**
     * Semantic search for games matching a query
     * Returns game IDs sorted by similarity score
     */
    async searchGames(
        query: string,
        options?: {
            userId?: string;
            isPublic?: boolean;
            limit?: number;
        }
    ): Promise<Array<{ id: string; score: number; title?: string }>> {
        const embedding = await this.generateEmbedding(query);
        const limit = options?.limit ?? 20;

        // Build filter based on options
        // Note: cloudflare vectorize filters are strict.
        // We want (userId == current) OR (isPublic == true)
        // Unfortunately OR isn't always simple in vector DBs, but Cloudflare supports it.

        let filter: VectorizeVectorMetadataFilter | undefined;

        if (options?.userId && options?.isPublic) {
            // Search own OR public
            // Not natively supported in single query easily if we want "mine OR public" without complex boolean logic
            // Cloudflare Vectorize supports $or
            filter = {
                $or: [
                    { userId: { $eq: options.userId } },
                    { isPublic: { $eq: "true" } }
                ] as any // Cast to satisfy strict union type of VectorizeVectorMetadataFilter
            };
        } else if (options?.userId) {
            // Only mine
            filter = { userId: { $eq: options.userId } };
        } else if (options?.isPublic) {
            // Only public
            filter = { isPublic: { $eq: "true" } };
        }

        const results = await this.vectorize.query(embedding, {
            topK: limit,
            filter,
            returnMetadata: "all",
        });

        return results.matches.map((match) => ({
            id: match.id,
            score: match.score,
            title: (match.metadata as { title?: string })?.title,
        }));
    }
}
