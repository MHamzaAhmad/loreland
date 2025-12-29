import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "../lib/context";
import { EmbeddingsService } from "../services/embeddings";
import { GamesService } from "../services/games";

const searchRouter = new Hono<AppEnv>();

/**
 * Search query schema
 */
const searchQuerySchema = z.object({
    q: z.string().min(1).max(500),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

/**
 * GET /api/games/search - Semantic search for games
 * 
 * Query the Vectorize index for games matching the search query.
 * Returns games sorted by similarity score.
 */
searchRouter.get("/", zValidator("query", searchQuerySchema), async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { q, limit } = c.req.valid("query");
    const embeddingsService = new EmbeddingsService(c.env.AI, c.env.VECTORIZE);
    const gamesService = new GamesService(c.get("db"));

    // Search Vectorize index for matching games
    const searchResults = await embeddingsService.searchGames(q, {
        userId: user.id,
        limit,
    });

    if (searchResults.length === 0) {
        return c.json({
            query: q,
            results: [],
            count: 0,
        });
    }

    // Fetch full game data for matched IDs
    const games = await Promise.all(
        searchResults.map(async (result) => {
            const game = await gamesService.get(result.id, user.id);
            return game ? { ...game, score: result.score } : null;
        })
    );

    // Filter out any null results (shouldn't happen but safety check)
    const validGames = games.filter((g): g is NonNullable<typeof g> => g !== null);

    return c.json({
        query: q,
        results: validGames,
        count: validGames.length,
    });
});

export { searchRouter };
