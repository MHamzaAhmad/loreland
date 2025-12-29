import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { playSessions } from "@packages/db/schema/d1";
import type { AppEnv } from "../lib/context";
import { GamesService } from "../services/games";

export const playRouter = new Hono<AppEnv>();

/**
 * GET /api/games/:gameId/sessions
 * List all play sessions for a game
 */
playRouter.get("/:gameId/sessions", async (c) => {
    const { gameId } = c.req.param();
    const user = c.get("user");

    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const db = c.get("db");
    const sessions = await db
        .select()
        .from(playSessions)
        .where(and(eq(playSessions.gameId, gameId), eq(playSessions.userId, user.id)))
        .orderBy(desc(playSessions.lastPlayedAt));

    return c.json({ sessions });
});

/**
 * POST /api/games/:gameId/play/start
 * Start a new game session or resume an existing one
 */
playRouter.post("/:gameId/play/start", async (c) => {
    const { gameId } = c.req.param();
    const user = c.get("user");

    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json<{
        characterId?: string;
        sessionId?: string;
        model?: string;
    }>();

    const db = c.get("db");
    const gamesService = new GamesService(db);

    let session;

    if (body.sessionId) {
        // Resume existing session
        const [existing] = await db
            .select()
            .from(playSessions)
            .where(and(
                eq(playSessions.id, body.sessionId),
                eq(playSessions.userId, user.id)
            ))
            .limit(1);

        if (!existing) {
            return c.json({ error: "Session not found" }, 404);
        }

        session = existing;

        // Update last played
        await db.update(playSessions)
            .set({ lastPlayedAt: new Date() })
            .where(eq(playSessions.id, session.id));
    } else {
        // Create new session
        if (!body.characterId) {
            return c.json({ error: "characterId is required for new sessions" }, 400);
        }

        // Get game config to get character name
        const gameConfig = await gamesService.getFull(gameId, user.id);
        if (!gameConfig) {
            return c.json({ error: "Game not found" }, 404);
        }

        const character = gameConfig.characters.find(c => c.id === body.characterId);

        const [newSession] = await db.insert(playSessions).values({
            gameId,
            userId: user.id,
            characterId: body.characterId,
            characterName: character?.name,
            model: body.model || "gemini-2.0-flash",
        }).returning();

        session = newSession;

        // Initialize the agent with game config
        const agentId = c.env.PLAY_AGENT.idFromName(session.id);
        const agent = c.env.PLAY_AGENT.get(agentId);

        // Call startGame on the agent
        await agent.startGame(session.id, gameConfig, body.characterId, body.model);
    }

    return c.json({
        sessionId: session.id,
        wsUrl: `/api/games/${gameId}/play/${session.id}/ws`,
        currentTurn: session.currentTurn,
        characterId: session.characterId,
        characterName: session.characterName,
        model: session.model,
    });
});

/**
 * GET /api/games/:gameId/play/:sessionId
 * Get current session state
 */
playRouter.get("/:gameId/play/:sessionId", async (c) => {
    const { sessionId } = c.req.param();
    const user = c.get("user");

    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // Verify session ownership
    const db = c.get("db");
    const [session] = await db
        .select()
        .from(playSessions)
        .where(and(
            eq(playSessions.id, sessionId),
            eq(playSessions.userId, user.id)
        ))
        .limit(1);

    if (!session) {
        return c.json({ error: "Session not found" }, 404);
    }

    // Get state from agent
    const agentId = c.env.PLAY_AGENT.idFromName(sessionId);
    const agent = c.env.PLAY_AGENT.get(agentId);
    const state = await agent.getGameState();

    return c.json({
        session,
        ...state,
    });
});

/**
 * PUT /api/games/:gameId/play/:sessionId/model
 * Update the AI model for a session
 */
playRouter.put("/:gameId/play/:sessionId/model", async (c) => {
    const { sessionId } = c.req.param();
    const user = c.get("user");

    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { model } = await c.req.json<{ model: string }>();

    // Verify session ownership
    const db = c.get("db");
    const [session] = await db
        .select()
        .from(playSessions)
        .where(and(
            eq(playSessions.id, sessionId),
            eq(playSessions.userId, user.id)
        ))
        .limit(1);

    if (!session) {
        return c.json({ error: "Session not found" }, 404);
    }

    // Update in D1
    await db.update(playSessions)
        .set({ model })
        .where(eq(playSessions.id, sessionId));

    // Update in agent
    const agentId = c.env.PLAY_AGENT.idFromName(sessionId);
    const agent = c.env.PLAY_AGENT.get(agentId);
    await agent.updateModel(model);

    return c.json({ success: true, model });
});

/**
 * POST /api/games/:gameId/play/:sessionId/rewind
 * Rewind to a previous turn
 */
playRouter.post("/:gameId/play/:sessionId/rewind", async (c) => {
    const { sessionId } = c.req.param();
    const user = c.get("user");

    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { turnNumber } = await c.req.json<{ turnNumber: number }>();

    // Verify session ownership
    const db = c.get("db");
    const [session] = await db
        .select()
        .from(playSessions)
        .where(and(
            eq(playSessions.id, sessionId),
            eq(playSessions.userId, user.id)
        ))
        .limit(1);

    if (!session) {
        return c.json({ error: "Session not found" }, 404);
    }

    // Rewind in agent
    const agentId = c.env.PLAY_AGENT.idFromName(sessionId);
    const agent = c.env.PLAY_AGENT.get(agentId);
    const result = await agent.rewindToTurn(turnNumber);

    // Update D1 session
    await db.update(playSessions)
        .set({ currentTurn: turnNumber, lastPlayedAt: new Date() })
        .where(eq(playSessions.id, sessionId));

    return c.json(result);
});

/**
 * GET /api/games/:gameId/play/:sessionId/turns
 * Get all turns for a session
 */
playRouter.get("/:gameId/play/:sessionId/turns", async (c) => {
    const { sessionId } = c.req.param();
    const user = c.get("user");

    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // Verify session ownership
    const db = c.get("db");
    const [session] = await db
        .select()
        .from(playSessions)
        .where(and(
            eq(playSessions.id, sessionId),
            eq(playSessions.userId, user.id)
        ))
        .limit(1);

    if (!session) {
        return c.json({ error: "Session not found" }, 404);
    }

    // Get turns from agent
    const agentId = c.env.PLAY_AGENT.idFromName(sessionId);
    const agent = c.env.PLAY_AGENT.get(agentId);
    const turns = await agent.getTurns();

    return c.json({ turns });
});

/**
 * GET /api/games/:gameId/play/:sessionId/ws
 * WebSocket upgrade for real-time gameplay
 */
playRouter.get("/:gameId/play/:sessionId/ws", async (c) => {
    const upgradeHeader = c.req.header("Upgrade");
    if (upgradeHeader !== "websocket") {
        return c.text("Expected WebSocket upgrade", 426);
    }

    const { sessionId } = c.req.param();

    // Forward to agent's WebSocket handler
    const agentId = c.env.PLAY_AGENT.idFromName(sessionId);
    const agent = c.env.PLAY_AGENT.get(agentId);

    return agent.fetch(c.req.raw);
});
