/**
 * Internal API Routes
 * 
 * These routes are only accessible to internal services (Durable Objects)
 * using a shared secret. Not exposed to public clients.
 */

import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../lib/context";
import { CreditsService } from "../services/credits";
import { getBillingConfig } from "../lib/billing-config";
import { buildTurnCost } from "../lib/turn-cost";

export const internalRouter = new Hono<AppEnv>();

/**
 * Middleware: Verify internal secret
 */
const verifyInternal = createMiddleware<AppEnv>(async (c, next) => {
    const secret = c.req.header("X-Internal-Auth");

    if (!secret || secret !== c.env.INTERNAL_SECRET) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
});

// Apply to all routes
internalRouter.use("*", verifyInternal);

/**
 * GET /api/internal/credits/:userId
 * Get user's credit balance
 */
internalRouter.get("/credits/:userId", async (c) => {
    const { userId } = c.req.param();
    const db = c.get("db");
    const creditsService = new CreditsService(db, c.env);

    const balance = await creditsService.getBalance(userId);
    const config = creditsService.getConfig();

    return c.json({
        balance,
        minBalanceToPlay: config.minBalance.toPlay,
        minBalanceToGenerate: config.minBalance.toGenerate,
    });
});

/**
 * POST /api/internal/credits/deduct
 * Deduct credits atomically
 */
internalRouter.post("/credits/deduct", async (c) => {
    const body = await c.req.json<{
        userId: string;
        amount: number;
        metadata: {
            type: "usage" | "purchase" | "refund" | "bonus";
            operationType?: string;
            sessionId?: string;
            gameId?: string;
            turnNumber?: number;
            description?: string;
        };
    }>();

    const db = c.get("db");
    const creditsService = new CreditsService(db, c.env);

    const success = await creditsService.deductCredits(body.userId, body.amount, {
        type: body.metadata.type,
        operationType: body.metadata.operationType as "turn" | "game_generation" | "image" | "summary",
        sessionId: body.metadata.sessionId,
        gameId: body.metadata.gameId,
        turnNumber: body.metadata.turnNumber,
        description: body.metadata.description,
    });

    if (!success) {
        return c.json({ error: "Insufficient credits" }, 402);
    }

    const newBalance = await creditsService.getBalance(body.userId);

    return c.json({
        success: true,
        newBalance,
    });
});

/**
 * POST /api/internal/credits/deduct-turn
 * Deduct credits for a turn with cost breakdown
 */
internalRouter.post("/credits/deduct-turn", async (c) => {
    const body = await c.req.json<{
        userId: string;
        aiCostUSD: number;
        imageGenerated: boolean;
        sessionId?: string;
        turnNumber?: number;
    }>();

    const db = c.get("db");
    const creditsService = new CreditsService(db, c.env);
    const config = creditsService.getConfig();

    // Build turn cost
    const turnCost = buildTurnCost(body.aiCostUSD, body.imageGenerated, config);

    // Deduct atomically
    const success = await creditsService.deductForTurn(body.userId, turnCost, {
        sessionId: body.sessionId,
        turnNumber: body.turnNumber,
    });

    if (!success) {
        const balance = await creditsService.getBalance(body.userId);
        return c.json({
            error: "Insufficient credits",
            balance,
            required: turnCost.totalCredits,
            turnCost,
        }, 402);
    }

    const newBalance = await creditsService.getBalance(body.userId);

    return c.json({
        success: true,
        newBalance,
        turnCost,
    });
});

/**
 * GET /api/internal/billing-config
 * Get current billing configuration
 */
internalRouter.get("/billing-config", async (c) => {
    const config = getBillingConfig(c.env);
    return c.json(config);
});
