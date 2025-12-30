import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppEnv } from "../lib/context";
import { generateGameSchema } from "../lib/schemas";
import { GameGenerationService } from "../services/generation";

const generateRouter = new Hono<AppEnv>();

/**
 * POST /api/games/generate - Start a new game generation workflow
 */
generateRouter.post("/", zValidator("json", generateGameSchema), async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { prompt, options } = c.req.valid("json");
    const service = new GameGenerationService(
        c.env.GAME_GENERATION_WORKFLOW,
        c.env.GENERATION_STATUS
    );

    // Create workflow instance with unique ID
    const instanceId = crypto.randomUUID();

    await service.start({
        userId: user.id,
        prompt,
        options: {
            characterCount: options.characterCount ?? 3,
            npcCount: options.npcCount ?? 5,
            generatePreviewImage: options.generatePreviewImage ?? true,
            generateCharacterPortraits: options.generateCharacterPortraits ?? true,
            imageStyle: options.imageStyle ?? "fantasy illustration, detailed, vibrant colors",
        },
        instanceId,
    });

    return c.json({
        instanceId,
        status: "running",
        message: "Game generation started",
    }, 202);
});

/**
 * GET /api/games/generate/:instanceId/status - Get workflow progress
 */
generateRouter.get("/:instanceId/status", async (c) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const instanceId = c.req.param("instanceId");
    const service = new GameGenerationService(
        c.env.GAME_GENERATION_WORKFLOW,
        c.env.GENERATION_STATUS
    );

    try {
        const status = await service.getStatus(instanceId);

        return c.json({
            instanceId,
            status: status.status,
            currentStep: status.currentStep,
            stepsCompleted: status.stepsCompleted,
            totalSteps: status.totalSteps,
            progress: {
                percentage: Math.round((status.stepsCompleted / status.totalSteps) * 100),
                message: status.message,
                gameId: status.gameId,
            },
            error: status.error,
        });
    } catch (error) {
        return c.json({
            error: "Status service failed",
            instanceId,
        }, 500);
    }
});

export { generateRouter };
