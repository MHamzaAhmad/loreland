import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { AppEnv } from "../lib/context";
import { userSettings } from "@packages/db/schema/d1";
import { getAllModels, getModelIds } from "../lib/models";

const settingsRouter = new Hono<AppEnv>();

// Get allowed models from registry for validation
// We use a looser validation here to allow for new models to be added without redeploying API if possible,
// but for strict typing we validate against known keys.
const allowedModels = getModelIds();

const updateSettingsSchema = z.object({
    modelPreference: z.string().refine((val) => allowedModels.includes(val), {
        message: "Invalid model preference",
    }).optional(),
    storytellingMode: z.boolean().optional(),
});

/**
 * GET /api/settings - Get current user settings
 */
settingsRouter.get("/", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const db = drizzle(c.env.DB);
    const settings = await db.select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id))
        .get();

    return c.json({
        modelPreference: settings?.modelPreference ?? null,
        storytellingMode: settings?.storytellingMode ?? false,
    });
});

/**
 * GET /api/settings/models - Get available AI models with full details
 */
settingsRouter.get("/models", async (c) => {
    // Public endpoint - no authentication required to view available models
    const models = getAllModels().map(m => ({
        id: m.id,
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        provider: m.provider,
        tier: m.tier,
        isDefault: m.isDefault,
        whenToUse: m.whenToUse,
        pros: m.pros,
        cons: m.cons,
        costLevel: m.costLevel,
        costDescription: m.costDescription,
        speed: m.speed,
        bestFor: m.bestFor,
    }));

    return c.json({ models });
});

/**
 * PUT /api/settings - Update user settings
 */
settingsRouter.put("/", zValidator("json", updateSettingsSchema), async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { modelPreference, storytellingMode } = c.req.valid("json");
    const db = drizzle(c.env.DB);

    // Check if settings exist
    const existing = await db.select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id))
        .get();

    if (existing) {
        await db.update(userSettings)
            .set({
                modelPreference: modelPreference ?? existing.modelPreference ?? null,
                storytellingMode: storytellingMode ?? existing.storytellingMode ?? false,
            })
            .where(eq(userSettings.id, existing.id));
    } else {
        await db.insert(userSettings).values({
            id: crypto.randomUUID(),
            userId: user.id,
            modelPreference: modelPreference ?? null,
            storytellingMode: storytellingMode ?? false,
        });
    }

    return c.json({ success: true, modelPreference, storytellingMode });
});

export { settingsRouter };
