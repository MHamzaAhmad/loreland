import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppEnv } from "../lib/context";
import { generateGameSchema } from "../lib/schemas";

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
    const workflow = c.env.GAME_GENERATION_WORKFLOW;

    // Create workflow instance with unique ID
    const instanceId = crypto.randomUUID();

    const instance = await workflow.create({
        id: instanceId,
        params: {
            userId: user.id,
            prompt,
            options: {
                characterCount: options.characterCount ?? 3,
                npcCount: options.npcCount ?? 5,
                generatePreviewImage: options.generatePreviewImage ?? true,
                generateCharacterPortraits: options.generateCharacterPortraits ?? true,
                imageStyle: options.imageStyle ?? "fantasy illustration, detailed, vibrant colors",
            },
        },
    });

    const status = await instance.status();

    return c.json({
        instanceId,
        status: status.status,
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
    const workflow = c.env.GAME_GENERATION_WORKFLOW;

    try {
        const instance = await workflow.get(instanceId);
        const status = await instance.status();

        // Calculate progress from step information
        const totalSteps = 8;
        let stepsCompleted = 0;
        let currentStep = "initializing";
        let message = "Starting game generation...";

        // Parse output for progress info if available
        if (status.output) {
            const output = status.output as {
                gameId?: string;
                progress?: {
                    currentStep: string;
                    stepsCompleted: number;
                    message: string;
                };
            };

            if (output.progress) {
                currentStep = output.progress.currentStep;
                stepsCompleted = output.progress.stepsCompleted;
                message = output.progress.message;
            }
        } else if ((status as any).__LOCAL_DEV_STEP_OUTPUTS && Array.isArray((status as any).__LOCAL_DEV_STEP_OUTPUTS)) {
            // Handle local dev step outputs where intermediate progress is available
            const steps = (status as any).__LOCAL_DEV_STEP_OUTPUTS;
            if (steps.length > 0) {
                const lastStep = steps[steps.length - 1];
                if (lastStep) {
                    currentStep = lastStep.currentStep || currentStep;
                    stepsCompleted = lastStep.stepsCompleted || stepsCompleted;
                    message = lastStep.message || message;
                }
            }
        }

        return c.json({
            instanceId,
            status: status.status,
            currentStep,
            stepsCompleted,
            totalSteps,
            progress: {
                percentage: Math.round((stepsCompleted / totalSteps) * 100),
                message,
                gameId: (status.output as { gameId?: string })?.gameId,
            },
            error: status.error?.message,
        });
    } catch (error) {
        return c.json({
            error: "Workflow instance not found",
            instanceId,
        }, 404);
    }
});

export { generateRouter };
