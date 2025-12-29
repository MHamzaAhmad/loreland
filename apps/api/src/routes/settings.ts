import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { AppEnv } from "../lib/context";
import { userSettings } from "@packages/db/schema/d1";

const settingsRouter = new Hono<AppEnv>();

// Allowed models validation
const allowedModels = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
] as const;

const updateSettingsSchema = z.object({
    modelPreference: z.enum(allowedModels).optional(),
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
    });
});

/**
 * PUT /api/settings - Update user settings
 */
settingsRouter.put("/", zValidator("json", updateSettingsSchema), async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { modelPreference } = c.req.valid("json");
    const db = drizzle(c.env.DB);

    // Check if settings exist
    const existing = await db.select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id))
        .get();

    if (existing) {
        await db.update(userSettings)
            .set({
                modelPreference: modelPreference ?? null,
            })
            .where(eq(userSettings.id, existing.id));
    } else {
        await db.insert(userSettings).values({
            id: crypto.randomUUID(),
            userId: user.id,
            modelPreference: modelPreference ?? null,
        });
    }

    return c.json({ success: true, modelPreference });
});

export { settingsRouter };
