import { DurableObject } from "cloudflare:workers";

/**
 * Status for a game generation workflow instance
 */
export interface GenerationStatus {
    instanceId: string;
    status: "running" | "complete" | "errored" | "unknown";
    currentStep: string;
    stepsCompleted: number;
    totalSteps: number;
    message: string;
    gameId?: string;
    error?: string;
    updatedAt: string;
}

/**
 * Durable Object for tracking game generation status with strong consistency.
 * Each generation instance gets its own DO instance, keyed by instanceId.
 */
export class GenerationStatusAgent extends DurableObject<Cloudflare.Env> {
    private status: GenerationStatus | null = null;

    constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
        super(ctx, env);
    }

    /**
     * Initialize status for a new generation
     */
    async initStatus(instanceId: string): Promise<GenerationStatus> {
        this.status = {
            instanceId,
            status: "running",
            currentStep: "initializing",
            stepsCompleted: 0,
            totalSteps: 9,
            message: "Starting game generation...",
            updatedAt: new Date().toISOString(),
        };

        // Persist to storage for durability across DO restarts
        await this.ctx.storage.put("status", this.status);

        return this.status;
    }

    /**
     * Update the current status
     */
    async updateStatus(update: {
        currentStep: string;
        stepsCompleted: number;
        message: string;
        gameId?: string;
        status?: "running" | "complete" | "errored";
        error?: string;
    }): Promise<GenerationStatus> {
        // Load from storage if not in memory
        if (!this.status) {
            this.status = await this.ctx.storage.get("status") || null;
        }

        if (!this.status) {
            throw new Error("Status not initialized");
        }

        this.status = {
            ...this.status,
            ...update,
            status: update.status || this.status.status,
            updatedAt: new Date().toISOString(),
        };

        await this.ctx.storage.put("status", this.status);

        return this.status;
    }

    /**
     * Get the current status
     */
    async getStatus(): Promise<GenerationStatus | null> {
        // Load from storage if not in memory
        if (!this.status) {
            this.status = await this.ctx.storage.get("status") || null;
        }

        return this.status;
    }
}
