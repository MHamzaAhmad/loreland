import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

/**
 * AI Provider types
 */
export type AIProvider = 'gemini' | 'vercel-gateway';

/**
 * AI Configuration interface
 */
export interface AIConfig {
    provider: AIProvider;
    model: string;
    apiKey?: string;
    // Vercel AI Gateway specific settings
    gatewayUrl?: string;
}

/**
 * Environment variables for AI configuration
 */
export interface AIEnv {
    AI_PROVIDER?: string;
    AI_MODEL?: string;
    GEMINI_API_KEY?: string;
    // Vercel AI Gateway URL (e.g., https://your-gateway.vercel.app/api/gateway)
    VERCEL_AI_GATEWAY_URL?: string;
}

/**
 * Default model configurations for each provider
 */
const DEFAULT_MODELS: Record<AIProvider, string> = {
    gemini: 'gemini-2.5-flash',
    'vercel-gateway': 'gemini-2.5-flash',
};

/**
 * Create AI configuration from environment variables
 */
export function createAIConfig(env: AIEnv, userModelPreference?: string | null): AIConfig {
    const provider = (env.AI_PROVIDER as AIProvider) || 'gemini';

    // User preference overrides env default, but provider specific logic remains
    // This allows users to pick a model (e.g. "gemini-1.5-pro") regardless of 
    // whether we are using direct access or the gateway
    const model = userModelPreference || env.AI_MODEL || DEFAULT_MODELS[provider];

    // Validate required settings based on provider
    if (!env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is required for AI provider');
    }

    if (provider === 'vercel-gateway' && !env.VERCEL_AI_GATEWAY_URL) {
        throw new Error('VERCEL_AI_GATEWAY_URL is required when using vercel-gateway provider');
    }

    return {
        provider,
        model,
        apiKey: env.GEMINI_API_KEY,
        gatewayUrl: env.VERCEL_AI_GATEWAY_URL,
    };
}

/**
 * Get the configured language model based on AI configuration
 */
export function getLanguageModel(config: AIConfig): LanguageModel {
    switch (config.provider) {
        case 'gemini': {
            // Direct Gemini API access
            const google = createGoogleGenerativeAI({
                apiKey: config.apiKey,
            });
            return google(config.model);
        }

        case 'vercel-gateway': {
            // Use Vercel AI Gateway
            // The gateway URL should point to your Vercel AI Gateway endpoint
            const google = createGoogleGenerativeAI({
                apiKey: config.apiKey,
                baseURL: config.gatewayUrl,
            });
            return google(config.model);
        }

        default:
            throw new Error(`Unknown AI provider: ${config.provider}`);
    }
}
