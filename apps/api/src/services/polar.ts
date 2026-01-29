/**
 * Polar Service
 * 
 * Handles integration with Polar.sh for usage-based billing.
 * Sends usage events for metered billing.
 */

import { Polar } from "@polar-sh/sdk";

export interface UsageEvent {
    externalCustomerId: string; // Our user ID
    credits: number;
    metadata?: {
        gameId?: string;
        sessionId?: string;
        turnNumber?: number;
        aiCostUSD?: number;
        imageGenerated?: boolean;
    };
}

export class PolarService {
    private polar: Polar;

    constructor(accessToken: string) {
        this.polar = new Polar({ accessToken });
    }

    /**
     * Ingest a single usage event to Polar for metered billing
     */
    async ingestUsage(event: UsageEvent): Promise<void> {
        // Build metadata object, only include defined values
        const metadata: Record<string, string | number | boolean> = {
            total_credits: event.credits,
        };

        if (event.metadata?.gameId) metadata.game_id = event.metadata.gameId;
        if (event.metadata?.sessionId) metadata.session_id = event.metadata.sessionId;
        if (event.metadata?.turnNumber !== undefined) metadata.turn_number = event.metadata.turnNumber;
        if (event.metadata?.aiCostUSD !== undefined) metadata.ai_cost_usd = event.metadata.aiCostUSD;
        if (event.metadata?.imageGenerated !== undefined) metadata.image_generated = event.metadata.imageGenerated;

        await this.polar.events.ingest({
            events: [{
                name: "ai_usage",
                externalCustomerId: event.externalCustomerId,
                metadata,
            }],
        });
    }

    /**
     * Ingest multiple usage events at once (batch)
     */
    async ingestBatch(events: UsageEvent[]): Promise<void> {
        if (events.length === 0) return;

        const polarEvents = events.map(event => {
            const metadata: Record<string, string | number | boolean> = {
                total_credits: event.credits,
            };

            if (event.metadata?.gameId) metadata.game_id = event.metadata.gameId;
            if (event.metadata?.sessionId) metadata.session_id = event.metadata.sessionId;
            if (event.metadata?.turnNumber !== undefined) metadata.turn_number = event.metadata.turnNumber;
            if (event.metadata?.aiCostUSD !== undefined) metadata.ai_cost_usd = event.metadata.aiCostUSD;
            if (event.metadata?.imageGenerated !== undefined) metadata.image_generated = event.metadata.imageGenerated;

            return {
                name: "ai_usage",
                externalCustomerId: event.externalCustomerId,
                metadata,
            };
        });

        await this.polar.events.ingest({ events: polarEvents });
    }
}
