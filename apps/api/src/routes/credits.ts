/**
 * Credits API Routes
 * 
 * User-facing endpoints for credit balance and transaction history.
 */

import { Hono } from "hono";
import type { AppEnv } from "../lib/context";
import { CreditsService } from "../services/credits";

export const creditsRouter = new Hono<AppEnv>();

/**
 * GET /api/credits
 * Get current user's credit balance and usage summary
 */
creditsRouter.get("/", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const db = c.get("db");
    const creditsService = new CreditsService(db, c.env);
    const summary = await creditsService.getUsageSummary(user.id);
    const config = creditsService.getConfig();

    return c.json({
        balance: summary.balance,
        lifetimeSpent: summary.lifetimeSpent,
        recentTransactionCount: summary.recentTransactions,
        minimums: {
            toPlay: config.minBalance.toPlay,
            toGenerate: config.minBalance.toGenerate,
        },
    });
});

/**
 * GET /api/credits/transactions
 * Get user's recent credit transactions
 */
creditsRouter.get("/transactions", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const limit = parseInt(c.req.query("limit") ?? "20", 10);
    const db = c.get("db");
    const creditsService = new CreditsService(db, c.env);
    const transactions = await creditsService.getTransactions(user.id, Math.min(limit, 100));

    return c.json({
        transactions: transactions.map((t) => ({
            id: t.id,
            amount: t.amount,
            balanceAfter: t.balanceAfter,
            type: t.type,
            operationType: t.operationType,
            costBreakdown: t.costBreakdown,
            createdAt: t.createdAt,
        })),
    });
});

/**
 * GET /api/credits/config
 * Get billing configuration (for UI display)
 */
creditsRouter.get("/config", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const creditsService = new CreditsService(c.get("db"), c.env);
    const config = creditsService.getConfig();

    return c.json({
        creditRate: config.creditRate,
        imageCosts: config.imageCosts,
        minBalance: config.minBalance,
    });
});
