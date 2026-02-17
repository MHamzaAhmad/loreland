import { Hono } from "hono";
import type { AppEnv } from "../lib/context";
import { CreditsService } from "../services/credits";
import { PolarService, type CreditPackage } from "../services/polar";

export const creditsRouter = new Hono<AppEnv>();

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

creditsRouter.get("/packages", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const polar = new PolarService({
        POLAR_ACCESS_TOKEN: c.env.POLAR_ACCESS_TOKEN,
        POLAR_ORGANIZATION_ID: c.env.POLAR_ORGANIZATION_ID,
        POLAR_SANDBOX: c.env.POLAR_SANDBOX,
        CACHE: c.env.CACHE,
    });

    try {
        const packages = await polar.getProducts();

        return c.json({
            packages: packages.map((pkg: CreditPackage) => ({
                id: pkg.id,
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

creditsRouter.post("/purchase", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const session = c.get("session");
    const isAnonymous = (session as { isAnonymous?: boolean } | null)?.isAnonymous ?? false;
    if (isAnonymous) {
        return c.json({ 
            error: "Please sign in to purchase credits",
            code: "ANONYMOUS_USER" 
        }, 403);
    }

    let body: { productId?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { productId } = body;

    if (!productId) {
        return c.json({ error: "Missing productId" }, 400);
    }

    try {
        const polar = new PolarService({
            POLAR_ACCESS_TOKEN: c.env.POLAR_ACCESS_TOKEN,
            POLAR_ORGANIZATION_ID: c.env.POLAR_ORGANIZATION_ID,
            POLAR_SANDBOX: c.env.POLAR_SANDBOX,
            CACHE: c.env.CACHE,
        });

        const selectedPackage = await polar.getProduct(productId);

        if (!selectedPackage) {
            const packages = await polar.getProducts();
            return c.json({
                error: "Invalid product",
                availableProducts: packages.map(p => p.id),
            }, 400);
        }

        const origin = c.req.header('Origin') || new URL(c.req.url).origin;
        const { checkoutUrl, checkoutId } = await polar.createCheckout(
            productId,
            {
                externalCustomerId: user.id,
                customerEmail: user.email,
                customerName: user.name || undefined,
                successUrl: `${origin}/buy-credits/success`,
            }
        );

        return c.json({
            checkout_url: checkoutUrl,
            checkout_id: checkoutId,
            product_id: productId,
            credits: selectedPackage.credits,
            price: selectedPackage.price,
            currency: selectedPackage.currency,
        });
    } catch (error) {
        console.error("Failed to create Polar checkout:", error);
        return c.json({ error: "Failed to initiate purchase" }, 500);
    }
});

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
