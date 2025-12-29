import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppEnv } from "../lib/context";
import { GamesService } from "../services/games";
import { GameCacheService } from "../services/game-cache";
import { EmbeddingsService } from "../services/embeddings";
import {
    createGameSchema,
    updateGameSchema,
    listGamesQuerySchema,
} from "../lib/schemas";

const gamesRouter = new Hono<AppEnv>();

/**
 * GET /api/games - List games for current user (cached)
 */
gamesRouter.get("/", zValidator("query", listGamesQuerySchema), async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const query = c.req.valid("query");
    const cacheService = new GameCacheService(c.env.CACHE);

    // Try cache first
    const cacheParams = { limit: query.limit, offset: query.offset, favorite: query.favorite };
    const cached = await cacheService.getGamesList(user.id, cacheParams);

    if (cached) {
        return c.json({
            games: cached,
            pagination: {
                limit: query.limit,
                offset: query.offset,
                count: cached.length,
            },
            cached: true,
        });
    }

    // Cache miss - fetch from DB
    const db = c.get("db");
    const service = new GamesService(db);
    const games = await service.list(user.id, query);

    // Store in cache (don't await to avoid slowing response)
    c.executionCtx.waitUntil(
        cacheService.setGamesList(user.id, games, cacheParams)
    );

    return c.json({
        games,
        pagination: {
            limit: query.limit,
            offset: query.offset,
            count: games.length,
        },
        cached: false,
    });
});

/**
 * GET /api/games/:id - Get a single game with related data (cached)
 */
gamesRouter.get("/:id", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const cacheService = new GameCacheService(c.env.CACHE);

    // Try cache first
    const cached = await cacheService.getGame<{
        id: string;
        userId: string;
        [key: string]: unknown;
    }>(id);

    // Verify ownership even for cached data
    if (cached && cached.userId === user.id) {
        return c.json({ game: cached, cached: true });
    }

    // Cache miss or wrong user - fetch from DB
    const db = c.get("db");
    const service = new GamesService(db);
    const game = await service.getFull(id, user.id);

    if (!game) {
        return c.json({ error: "Game not found" }, 404);
    }

    // Store in cache
    c.executionCtx.waitUntil(cacheService.setGame(game));

    return c.json({ game, cached: false });
});

/**
 * POST /api/games - Create a new game manually (with vectorization)
 */
gamesRouter.post("/", zValidator("json", createGameSchema), async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const data = c.req.valid("json");
    const db = c.get("db");
    const service = new GamesService(db);
    const embeddingsService = new EmbeddingsService(c.env.AI, c.env.VECTORIZE);
    const cacheService = new GameCacheService(c.env.CACHE);

    const game = await service.create(data, user.id);

    // Vectorize for search and invalidate list cache (async)
    c.executionCtx.waitUntil(
        Promise.all([
            embeddingsService.upsertGameVector({
                id: game.id,
                userId: user.id,
                title: game.title,
                description: game.description,
                background: game.background,
                objective: game.objective,
            }),
            cacheService.invalidateUserGamesLists(user.id),
        ])
    );

    return c.json({ game }, 201);
});

/**
 * PUT /api/games/:id - Update an existing game
 */
gamesRouter.put("/:id", zValidator("json", updateGameSchema), async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const data = c.req.valid("json");
    const db = c.get("db");
    const service = new GamesService(db);
    const embeddingsService = new EmbeddingsService(c.env.AI, c.env.VECTORIZE);
    const cacheService = new GameCacheService(c.env.CACHE);

    const game = await service.update(id, data, user.id);
    if (!game) {
        return c.json({ error: "Game not found" }, 404);
    }

    // Re-vectorize if content changed & invalidate cache (async)
    const contentChanged = data.title !== undefined || data.description !== undefined;

    c.executionCtx.waitUntil(
        Promise.all([
            contentChanged
                ? embeddingsService.upsertGameVector({
                    id: game.id,
                    userId: user.id,
                    title: game.title,
                    description: game.description,
                    background: game.background,
                    objective: game.objective,
                })
                : Promise.resolve(),
            cacheService.invalidateOnMutation(id, user.id),
        ])
    );

    return c.json({ game });
});

/**
 * DELETE /api/games/:id - Delete a game
 */
gamesRouter.delete("/:id", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const db = c.get("db");
    const service = new GamesService(db);
    const embeddingsService = new EmbeddingsService(c.env.AI, c.env.VECTORIZE);
    const cacheService = new GameCacheService(c.env.CACHE);

    const deleted = await service.delete(id, user.id);
    if (!deleted) {
        return c.json({ error: "Game not found" }, 404);
    }

    // Remove from vector index and invalidate cache (async)
    c.executionCtx.waitUntil(
        Promise.all([
            embeddingsService.deleteGameVector(id),
            cacheService.invalidateOnMutation(id, user.id),
        ])
    );

    return c.json({ success: true });
});

export { gamesRouter };
