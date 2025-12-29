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
        background?: string;
        objective?: string;
    }): string {
        const parts = [game.title, game.description];
        if (game.background) parts.push(game.background);
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
        background?: string;
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
            limit?: number;
        }
    ): Promise<Array<{ id: string; score: number; title?: string }>> {
        const embedding = await this.generateEmbedding(query);

        const filter: VectorizeVectorMetadataFilter | undefined = options?.userId
            ? { userId: { $eq: options.userId } }
            : undefined;

        const results = await this.vectorize.query(embedding, {
            topK: options?.limit ?? 10,
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
