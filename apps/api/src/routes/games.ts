import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppEnv } from "../lib/context";
import { GamesService } from "../services/games";
import {
    createGameSchema,
    updateGameSchema,
    listGamesQuerySchema,
} from "../lib/schemas";

const gamesRouter = new Hono<AppEnv>();

/**
 * GET /api/games - List games for current user
 */
gamesRouter.get("/", zValidator("query", listGamesQuerySchema), async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const query = c.req.valid("query");
    const db = c.get("db");
    const service = new GamesService(db);

    const games = await service.list(user.id, query);

    return c.json({
        games,
        pagination: {
            limit: query.limit,
            offset: query.offset,
            count: games.length,
        },
    });
});

/**
 * GET /api/games/:id - Get a single game with related data
 */
gamesRouter.get("/:id", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const db = c.get("db");
    const service = new GamesService(db);

    const game = await service.getFull(id, user.id);
    if (!game) {
        return c.json({ error: "Game not found" }, 404);
    }

    return c.json({ game });
});

/**
 * POST /api/games - Create a new game manually
 */
gamesRouter.post("/", zValidator("json", createGameSchema), async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const data = c.req.valid("json");
    const db = c.get("db");
    const service = new GamesService(db);

    const game = await service.create(data, user.id);

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

    const game = await service.update(id, data, user.id);
    if (!game) {
        return c.json({ error: "Game not found" }, 404);
    }

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

    const deleted = await service.delete(id, user.id);
    if (!deleted) {
        return c.json({ error: "Game not found" }, 404);
    }

    return c.json({ success: true });
});

export { gamesRouter };
