/**
 * Turn Cost Tracking
 * 
 * Utilities for building and returning cost breakdowns to clients.
 */

import { type BillingConfig, calculateCreditsFromCost } from "./billing-config";

/**
 * Cost breakdown for a single turn
 */
export interface TurnCost {
    /** Credits charged for AI inference */
    aiCredits: number;
    /** Credits charged for image generation */
    imageCredits: number;
    /** Total credits charged */
    totalCredits: number;
    /** Detailed breakdown for analytics */
    breakdown: {
        /** Raw OpenRouter cost in USD */
        aiCostUSD?: number;
        /** Image type that was generated */
        imageType?: "scene_1024x576" | "portrait_512" | "preview_1024";
    };
}

/**
 * Cost breakdown for game generation
 */
export interface GameGenerationCost {
    /** Credits for metadata generation */
    metadataCredits: number;
    /** Credits for character generation */
    characterCredits: number;
    /** Credits for NPC generation */
    npcCredits: number;
    /** Credits for states/triggers/lore */
    worldCredits: number;
    /** Credits for preview image */
    previewImageCredits: number;
    /** Credits for character portraits */
    portraitCredits: number;
    /** Total credits charged */
    totalCredits: number;
    /** Raw costs from OpenRouter */
    rawCostsUSD: Record<string, number>;
}

/**
 * Generic operation cost for any billable action
 */
export interface OperationCost {
    operationType: "turn" | "game_generation" | "summary" | "image";
    items: Array<{
        label: string;
        credits: number;
        rawCostUSD?: number;
    }>;
    totalCredits: number;
}

/**
 * Build a turn cost breakdown
 * 
 * @param aiCostUSD - Raw OpenRouter cost from usage.cost
 * @param imageGenerated - Whether a scene image was generated
 * @param config - Billing configuration
 * @returns TurnCost breakdown for client and logging
 */
export function buildTurnCost(
    aiCostUSD: number,
    imageGenerated: boolean,
    config: BillingConfig
): TurnCost {
    const aiCredits = calculateCreditsFromCost(aiCostUSD, config);
    const imageCredits = imageGenerated ? config.imageCosts.scene1024x576 : 0;

    return {
        aiCredits,
        imageCredits,
        totalCredits: aiCredits + imageCredits,
        breakdown: {
            aiCostUSD,
            imageType: imageGenerated ? "scene_1024x576" : undefined,
        },
    };
}

/**
 * Build an operation cost for generic billing
 */
export function buildOperationCost(
    operationType: OperationCost["operationType"],
    items: OperationCost["items"]
): OperationCost {
    return {
        operationType,
        items,
        totalCredits: items.reduce((sum, item) => sum + item.credits, 0),
    };
}

/**
 * Format cost for display (e.g., "12 credits" or "0.5 credits")
 */
export function formatCredits(credits: number): string {
    if (credits === 1) return "1 credit";
    if (Number.isInteger(credits)) return `${credits} credits`;
    return `${credits.toFixed(1)} credits`;
}
