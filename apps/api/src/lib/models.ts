/**
 * Model Registry Service
 * 
 * Centralized registry for all AI models with gamified names.
 * Uses Vercel AI Gateway as the unified endpoint.
 */

/**
 * Model tier for categorization and potential pricing
 */
export type ModelTier = 'standard' | 'premium';

/**
 * AI Provider identifiers
 */
export type ModelProvider = 'google' | 'openai' | 'anthropic' | 'xai';

/**
 * Game model interface with gamified naming
 */
export interface GameModel {
    /** Gamified identifier: "nova-flash", "titan", etc. */
    id: string;
    /** Display name: "Nova Flash", "Titan", etc. */
    name: string;
    /** UI display with emoji: "Nova Flash ⚡" */
    displayName: string;
    /** Description for UI tooltips */
    description: string;
    /** Original provider: "google", "openai", etc. */
    provider: ModelProvider;
    /** Actual model identifier for AI Gateway */
    actualModel: string;
    /** Tier for categorization */
    tier: ModelTier;
    /** Whether this is the default model */
    isDefault?: boolean;
}

/**
 * All available models with gamified names
 * 
 * Naming conventions:
 * - Nova: Google Gemini models (new star, bright, fast)
 * - Titan: OpenAI models (mythological strength)
 * - Sage: Anthropic Claude models (wise, thoughtful)
 * - Grok: xAI models (keep the original fun name)
 */
export const MODELS: Record<string, GameModel> = {
    'nova-flash': {
        id: 'nova-flash',
        name: 'Nova Flash',
        displayName: 'Nova Flash ⚡',
        description: 'Lightning-fast responses for dynamic gameplay. Our default choice.',
        provider: 'google',
        actualModel: 'google/gemini-2.5-flash',
        tier: 'standard',
        isDefault: true,
    },
    'nova-pro': {
        id: 'nova-pro',
        name: 'Nova Pro',
        displayName: 'Nova Pro ✨',
        description: 'Enhanced creativity and deeper narratives.',
        provider: 'google',
        actualModel: 'google/gemini-2.5-pro',
        tier: 'premium',
    },
    'titan': {
        id: 'titan',
        name: 'Titan',
        displayName: 'Titan 🏛️',
        description: 'Powerful and versatile. Excellent for complex adventures.',
        provider: 'openai',
        actualModel: 'openai/gpt-4o',
        tier: 'premium',
    },
    'titan-mini': {
        id: 'titan-mini',
        name: 'Titan Mini',
        displayName: 'Titan Mini 🎯',
        description: 'Quick and efficient. Great balance of speed and quality.',
        provider: 'openai',
        actualModel: 'openai/gpt-4o-mini',
        tier: 'standard',
    },
    'sage': {
        id: 'sage',
        name: 'Sage',
        displayName: 'Sage 🦉',
        description: 'Thoughtful and nuanced storytelling.',
        provider: 'anthropic',
        actualModel: 'anthropic/claude-sonnet-4',
        tier: 'premium',
    },
    'sage-swift': {
        id: 'sage-swift',
        name: 'Sage Swift',
        displayName: 'Sage Swift 🍃',
        description: 'Fast wisdom for quick decisions.',
        provider: 'anthropic',
        actualModel: 'anthropic/claude-haiku',
        tier: 'standard',
    },
    'grok': {
        id: 'grok',
        name: 'Grok',
        displayName: 'Grok 🚀',
        description: 'Witty and unconventional. Expect the unexpected!',
        provider: 'xai',
        actualModel: 'xai/grok-2',
        tier: 'premium',
    },
} as const;

/**
 * Get a model by its gamified ID
 * @throws Error if model not found
 */
export function getModel(id: string): GameModel {
    const model = MODELS[id];
    if (!model) {
        throw new Error(`Unknown model: ${id}. Available models: ${Object.keys(MODELS).join(', ')}`);
    }
    return model;
}

/**
 * Get the default model
 */
export function getDefaultModel(): GameModel {
    const defaultModel = Object.values(MODELS).find(m => m.isDefault);
    if (!defaultModel) {
        // Fallback to nova-flash if no default is set
        return MODELS['nova-flash'];
    }
    return defaultModel;
}

/**
 * Get all available models as an array
 */
export function getAllModels(): GameModel[] {
    return Object.values(MODELS);
}

/**
 * Get models filtered by tier
 */
export function getModelsByTier(tier: ModelTier): GameModel[] {
    return Object.values(MODELS).filter(m => m.tier === tier);
}

/**
 * Get models filtered by provider
 */
export function getModelsByProvider(provider: ModelProvider): GameModel[] {
    return Object.values(MODELS).filter(m => m.provider === provider);
}

/**
 * Get all model IDs (for validation)
 */
export function getModelIds(): string[] {
    return Object.keys(MODELS);
}

/**
 * Check if a model ID is valid
 */
export function isValidModelId(id: string): boolean {
    return id in MODELS;
}

/**
 * Resolve a model ID to its actual AI Gateway model string
 * Returns the default model's actual string if not found
 */
export function resolveModelToActual(id: string | null | undefined): string {
    if (!id || !isValidModelId(id)) {
        return getDefaultModel().actualModel;
    }
    return MODELS[id].actualModel;
}
