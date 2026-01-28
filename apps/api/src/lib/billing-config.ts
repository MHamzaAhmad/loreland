/**
 * Billing Configuration
 * 
 * Centralized, configurable billing settings.
 * All values can be overridden via environment variables.
 */

/**
 * Billing configuration interface
 */
export interface BillingConfig {
    /** 1 credit = X USD (e.g., 0.001 means 1 credit = $0.001) */
    creditRate: number;
    /** Multiplier on OpenRouter cost (e.g., 1.5 = 50% margin) */
    margin: number;
    /** Minimum credits charged per operation */
    minCredits: number;

    /** Image generation flat costs (in credits) */
    imageCosts: {
        /** 1024x1024 game preview */
        preview1024: number;
        /** 512x512 character portrait */
        portrait512: number;
        /** 1024x576 scene image (16:9) */
        scene1024x576: number;
    };

    /** Minimum balance requirements */
    minBalance: {
        /** Minimum credits to start a play session */
        toPlay: number;
        /** Minimum credits to start game generation */
        toGenerate: number;
    };

    /** Creator revenue share (0.20 = 20% of credits to game creator) */
    creatorRevenueShare: number;
}

/**
 * Default billing configuration
 */
const DEFAULT_CONFIG: BillingConfig = {
    creditRate: 0.001,      // 1 credit = $0.001
    margin: 1.5,            // 50% margin
    minCredits: 1,

    imageCosts: {
        preview1024: 5,     // 5 credits per game preview
        portrait512: 3,     // 3 credits per character portrait
        scene1024x576: 4,   // 4 credits per scene image
    },

    minBalance: {
        toPlay: 10,
        toGenerate: 50,
    },

    creatorRevenueShare: 0.20, // 20% to game creators
};

/**
 * Environment variable keys for billing config
 */
interface BillingEnvVars {
    CREDIT_RATE?: string;
    CREDIT_MARGIN?: string;
    MIN_CREDITS?: string;
    IMAGE_COST_PREVIEW?: string;
    IMAGE_COST_PORTRAIT?: string;
    IMAGE_COST_SCENE?: string;
    MIN_BALANCE_PLAY?: string;
    MIN_BALANCE_GENERATE?: string;
    CREATOR_REVENUE_SHARE?: string;
}

/**
 * Get billing config with environment variable overrides
 * 
 * @param env - Environment variables (from c.env in Hono)
 * @returns Merged billing configuration
 * 
 * @example
 * const config = getBillingConfig(c.env);
 * const credits = calculateCreditsFromCost(0.01, config); // 15 credits
 */
export function getBillingConfig(env?: Partial<BillingEnvVars>): BillingConfig {
    return {
        creditRate: env?.CREDIT_RATE
            ? parseFloat(env.CREDIT_RATE)
            : DEFAULT_CONFIG.creditRate,
        margin: env?.CREDIT_MARGIN
            ? parseFloat(env.CREDIT_MARGIN)
            : DEFAULT_CONFIG.margin,
        minCredits: env?.MIN_CREDITS
            ? parseInt(env.MIN_CREDITS, 10)
            : DEFAULT_CONFIG.minCredits,

        imageCosts: {
            preview1024: env?.IMAGE_COST_PREVIEW
                ? parseInt(env.IMAGE_COST_PREVIEW, 10)
                : DEFAULT_CONFIG.imageCosts.preview1024,
            portrait512: env?.IMAGE_COST_PORTRAIT
                ? parseInt(env.IMAGE_COST_PORTRAIT, 10)
                : DEFAULT_CONFIG.imageCosts.portrait512,
            scene1024x576: env?.IMAGE_COST_SCENE
                ? parseInt(env.IMAGE_COST_SCENE, 10)
                : DEFAULT_CONFIG.imageCosts.scene1024x576,
        },

        minBalance: {
            toPlay: env?.MIN_BALANCE_PLAY
                ? parseInt(env.MIN_BALANCE_PLAY, 10)
                : DEFAULT_CONFIG.minBalance.toPlay,
            toGenerate: env?.MIN_BALANCE_GENERATE
                ? parseInt(env.MIN_BALANCE_GENERATE, 10)
                : DEFAULT_CONFIG.minBalance.toGenerate,
        },

        creatorRevenueShare: env?.CREATOR_REVENUE_SHARE
            ? parseFloat(env.CREATOR_REVENUE_SHARE)
            : DEFAULT_CONFIG.creatorRevenueShare,
    };
}

/**
 * Calculate credits from OpenRouter cost in USD
 * 
 * Formula: credits = ceil((costUSD * margin) / creditRate)
 * 
 * @param costUSD - Raw cost from OpenRouter usage.cost
 * @param config - Billing configuration
 * @returns Number of credits to charge
 * 
 * @example
 * // With default config (rate=0.001, margin=1.5):
 * calculateCreditsFromCost(0.001, config) // 2 credits
 * calculateCreditsFromCost(0.01, config)  // 15 credits
 * calculateCreditsFromCost(0.05, config)  // 75 credits
 */
export function calculateCreditsFromCost(costUSD: number, config: BillingConfig): number {
    if (costUSD <= 0) return config.minCredits;

    const credits = Math.ceil((costUSD * config.margin) / config.creditRate);
    return Math.max(credits, config.minCredits);
}

/**
 * Get default config (for use without env access)
 */
export function getDefaultBillingConfig(): BillingConfig {
    return { ...DEFAULT_CONFIG };
}
