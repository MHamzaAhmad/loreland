/**
 * Credits API Routes
 * 
 * User-facing endpoints for credit balance, transaction history,
 * and Xsolla Pay Station credit pack purchases.
 * 
 * Packages are fetched dynamically from Xsolla Store API with caching.
 */

import { Hono } from "hono";
import type { AppEnv } from "../lib/context";
import { CreditsService } from "../services/credits";
import { XsollaPayStationService, type CreditPackage } from "../services/xsolla-paystation";

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
    const userCredits = await creditsService.getUserCredits(user.id);
    const summary = await creditsService.getUsageSummary(user.id);
    const config = creditsService.getConfig();

    return c.json({
        balance: summary.balance,
        lifetimeSpent: summary.lifetimeSpent,
        lifetimeEarned: summary.lifetimeEarned,
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
 * GET /api/credits/packages
 * Get available credit packages for purchase (fetched from Xsolla)
 */
creditsRouter.get("/packages", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const locale = c.req.query("locale") || "en";

    const xsolla = new XsollaPayStationService({
        XSOLLA_MERCHANT_ID: c.env.XSOLLA_MERCHANT_ID,
        XSOLLA_PROJECT_ID: c.env.XSOLLA_PROJECT_ID,
        XSOLLA_API_KEY: c.env.XSOLLA_API_KEY,
        XSOLLA_SANDBOX: c.env.XSOLLA_SANDBOX,
        CACHE: c.env.CACHE,
    });

    try {
        const packages = await xsolla.getPackages(locale);

        return c.json({
            packages: packages.map((pkg: CreditPackage) => ({
                sku: pkg.sku,
                name: pkg.name,
                description: pkg.description,
                credits: pkg.credits,
                price: pkg.price,
                currency: pkg.currency,
                discount: pkg.discount,
                pricePerCredit: pkg.price / pkg.credits,
                imageUrl: pkg.imageUrl,
            })),
        });
    } catch (error) {
        console.error("Failed to fetch packages:", error);
        return c.json({ error: "Failed to fetch packages" }, 500);
    }
});

/**
 * POST /api/credits/purchase
 * Initiate credit pack purchase via Xsolla Pay Station
 * 
 * Request body: { "package": "credits-pro-10000" }
 * Response: { "payment_url": "https://secure.xsolla.com/..." }
 */
creditsRouter.post("/purchase", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    let body: { package?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { package: packageSku } = body;

    if (!packageSku) {
        return c.json({ error: "Missing package SKU" }, 400);
    }

    try {
        const xsolla = new XsollaPayStationService({
            XSOLLA_MERCHANT_ID: c.env.XSOLLA_MERCHANT_ID,
            XSOLLA_PROJECT_ID: c.env.XSOLLA_PROJECT_ID,
            XSOLLA_API_KEY: c.env.XSOLLA_API_KEY,
            XSOLLA_SANDBOX: c.env.XSOLLA_SANDBOX,
            CACHE: c.env.CACHE,
        });

        // Validate SKU and get package details
        const packages = await xsolla.getPackages();
        const selectedPackage = packages.find(pkg => pkg.sku === packageSku);
        
        if (!selectedPackage) {
            return c.json({ 
                error: "Invalid package",
                availablePackages: packages.map(p => p.sku),
            }, 400);
        }

        const { payment_url } = await xsolla.generateToken(
            user.id,
            user.email,
            packageSku,
            1
        );

        return c.json({ 
            payment_url,
            package: packageSku,
            credits: selectedPackage.credits,
            price: selectedPackage.price,
            currency: selectedPackage.currency,
        });
    } catch (error) {
        console.error("Failed to generate Xsolla payment token:", error);
        return c.json({ error: "Failed to initiate purchase" }, 500);
    }
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
