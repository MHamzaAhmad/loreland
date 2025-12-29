/**
 * AI Configuration
 * 
 * Unified AI configuration using Vercel AI Gateway.
 * All models are accessed through the gateway for:
 * - Unified API key management
 * - Provider fallbacks
 * - Cost tracking
 */
import { getModel, getDefaultModel, resolveModelToActual } from './models';

/**
 * Environment variables for AI configuration
 */
export interface AIEnv {
    /** Vercel AI Gateway API key (set as secret) */
    AI_GATEWAY_API_KEY?: string;
    /** Default model ID (gamified name) */
    DEFAULT_MODEL?: string;
}

/**
 * Get a language model from Vercel AI Gateway
 * 
 * @param modelId - Gamified model ID (e.g., "nova-flash", "titan")
 *                  If not provided, uses the default model
 * @returns LanguageModel instance for use with AI SDK
 * 
 * @example
 * // Get default model
 * const model = getLanguageModel();
 * 
 * @example
 * // Get specific model
 * const model = getLanguageModel("titan");
 */
export function getLanguageModel(modelId?: string | null): string {
    const actualModel = resolveModelToActual(modelId);
    return actualModel;
}

/**
 * Get the actual model string for a gamified model ID
 * Useful for storing in database or passing to services
 */
export function getActualModelString(modelId?: string | null): string {
    return resolveModelToActual(modelId);
}

/**
 * Get model info including display name
 */
export function getModelInfo(modelId?: string | null) {
    try {
        return modelId ? getModel(modelId) : getDefaultModel();
    } catch {
        return getDefaultModel();
    }
}
