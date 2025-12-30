import type { GameGenerationParams } from "../lib/schemas";
import type { GenerationStatusAgent, GenerationStatus } from "../agents/generation-status-agent";

/**
 * Service for managing game generation workflows and status tracking.
 * Uses Durable Objects for strongly consistent, real-time status updates.
 */
export class GameGenerationService {
    constructor(
        private workflow: Workflow<GameGenerationParams>,
        private statusNamespace: DurableObjectNamespace<GenerationStatusAgent>
    ) { }

    /**
     * Start a new game generation workflow
     */
    async start(params: GameGenerationParams): Promise<{ instanceId: string }> {
        const { instanceId } = params;

        // Initialize status in DO
        const statusStub = this.statusNamespace.get(
            this.statusNamespace.idFromName(instanceId)
        );
        await statusStub.initStatus(instanceId);

        // Start the workflow
        await this.workflow.create({
            id: instanceId,
            params,
        });

        return { instanceId };
    }

    /**
     * Get the current status of a generation workflow
     */
    async getStatus(instanceId: string): Promise<GenerationStatus> {
        const statusStub = this.statusNamespace.get(
            this.statusNamespace.idFromName(instanceId)
        );

        const status = await statusStub.getStatus();

        if (status) {
            return status;
        }

        // Fallback: check workflow status if DO has no data
        try {
            const instance = await this.workflow.get(instanceId);
            const wfStatus = await instance.status();

            // Map workflow status
            const mapStatus = (s: string): GenerationStatus["status"] => {
                switch (s) {
                    case "complete": return "complete";
                    case "errored": return "errored";
                    case "running":
                    case "queued": return "running";
                    default: return "unknown";
                }
            };

            // If workflow is complete, extract from output
            if (wfStatus.status === "complete" && wfStatus.output) {
                const output = wfStatus.output as any;
                return {
                    instanceId,
                    status: "complete",
                    currentStep: "complete",
                    stepsCompleted: 9,
                    totalSteps: 9,
                    message: "Game generation complete!",
                    gameId: output.gameId,
                    updatedAt: new Date().toISOString(),
                };
            }

            return {
                instanceId,
                status: mapStatus(wfStatus.status),
                currentStep: "unknown",
                stepsCompleted: 0,
                totalSteps: 9,
                message: "Status unavailable",
                updatedAt: new Date().toISOString(),
            };
        } catch {
            return {
                instanceId,
                status: "unknown",
                currentStep: "unknown",
                stepsCompleted: 0,
                totalSteps: 9,
                message: "Workflow instance not found",
                updatedAt: new Date().toISOString(),
            };
        }
    }
}

// Re-export GenerationStatus type for convenience
export type { GenerationStatus };
