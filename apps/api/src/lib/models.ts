/**
 * Model Registry Service
 * 
 * Centralized registry for all AI models with gamified names.
 * Uses OpenRouter as the unified endpoint.
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
 * Speed indicator for model response time
 */
export type ModelSpeed = 'instant' | 'fast' | 'balanced' | 'slow' | 'thorough';

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
	/** Actual model identifier for OpenRouter */
	actualModel: string;
	/** Tier for categorization */
	tier: ModelTier;
	/** Whether this is the default model */
	isDefault?: boolean;
	/** When to use this model - user guidance */
	whenToUse: string;
	/** Pros of this model */
	pros: string[];
	/** Cons/limitations of this model */
	cons: string[];
	/** Relative cost indicator (1-5 scale) */
	costLevel: 1 | 2 | 3 | 4 | 5;
	/** Cost description for UI */
	costDescription: string;
	/** Speed indicator */
	speed: ModelSpeed;
	/** Best for - use cases */
	bestFor: string[];
}

/**
 * All available models with gamified names and detailed information
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
		description: 'Lightning-fast responses for dynamic gameplay.',
		provider: 'google',
		actualModel: 'google/gemini-2.5-flash',
		tier: 'standard',
		isDefault: true,
		whenToUse: "Perfect for quick decisions, rapid back-and-forth gameplay, and when you want snappy responses without waiting. Ideal for action scenes and exploration.",
		pros: [
			"Extremely fast response times",
			"Most cost-effective option",
			"Great for action scenes and combat",
			"Low latency keeps you in the flow"
		],
		cons: [
			"May miss subtle narrative nuances",
			"Less creative depth than premium models",
			"Simpler vocabulary and descriptions"
		],
		costLevel: 1,
		costDescription: "$ Most affordable",
		speed: 'instant',
		bestFor: ["Fast-paced action", "Quick decisions", "Exploration", "Combat encounters", "Casual play"]
	},
	'nova-pro': {
		id: 'nova-pro',
		name: 'Nova Pro',
		displayName: 'Nova Pro ✨',
		description: 'Enhanced creativity and deeper narratives.',
		provider: 'google',
		actualModel: 'google/gemini-2.5-pro',
		tier: 'premium',
		whenToUse: "When you want rich, detailed storytelling with creative flair. Great for complex narratives, character development, and immersive world-building.",
		pros: [
			"Rich, detailed narratives",
			"Excellent creative writing",
			"Strong character development",
			"Great for complex story arcs"
		],
		cons: [
			"Slightly slower than Flash",
			"Higher cost per request",
			"Can be overly verbose"
		],
		costLevel: 3,
		costDescription: "$$$ Premium pricing",
		speed: 'fast',
		bestFor: ["Story-heavy games", "Character development", "Complex narratives", "Immersive world-building"]
	},
	'titan': {
		id: 'titan',
		name: 'Titan',
		displayName: 'Titan 🏛️',
		description: 'Powerful and versatile. Excellent for complex adventures.',
		provider: 'openai',
		actualModel: 'openai/gpt-4o',
		tier: 'premium',
		whenToUse: "When you need maximum capability for complex scenarios, intricate puzzles, or sophisticated narrative structures. The gold standard for AI storytelling.",
		pros: [
			"Most capable model available",
			"Excellent at complex reasoning",
			"Handles intricate puzzles well",
			"Sophisticated narrative structures"
		],
		cons: [
			"Higher cost than other options",
			"Can be slower for long responses",
			"May be overkill for simple scenarios"
		],
		costLevel: 4,
		costDescription: "$$$$ Higher cost",
		speed: 'balanced',
		bestFor: ["Complex adventures", "Intricate puzzles", "Sophisticated narratives", "Premium experience"]
	},
	'titan-mini': {
		id: 'titan-mini',
		name: 'Titan Mini',
		displayName: 'Titan Mini 🎯',
		description: 'Quick and efficient. Great balance of speed and quality.',
		provider: 'openai',
		actualModel: 'openai/gpt-4o-mini',
		tier: 'standard',
		whenToUse: "When you want OpenAI quality without the premium price. A solid middle-ground that's faster than Titan but more capable than basic options.",
		pros: [
			"Good balance of speed and quality",
			"More affordable than full Titan",
			"Reliable performance",
			"Faster than GPT-4o"
		],
		cons: [
			"Less capable than full Titan",
			"Not as creative as premium models",
			"May struggle with very complex scenarios"
		],
		costLevel: 2,
		costDescription: "$$ Balanced pricing",
		speed: 'fast',
		bestFor: ["Balanced gameplay", "Daily adventures", "Good value", "Reliable responses"]
	},
	'sage': {
		id: 'sage',
		name: 'Sage',
		displayName: 'Sage 🦉',
		description: 'Thoughtful and nuanced storytelling.',
		provider: 'anthropic',
		actualModel: 'anthropic/claude-sonnet-4',
		tier: 'premium',
		whenToUse: "When you want deeply thoughtful, nuanced storytelling with emotional depth. Excellent for character-driven narratives and moral complexity.",
		pros: [
			"Exceptional emotional intelligence",
			"Nuanced character interactions",
			"Thoughtful moral dilemmas",
			"Beautiful prose quality"
		],
		cons: [
			"Can be slower to respond",
			"Premium pricing",
			"May be too thoughtful for action scenes"
		],
		costLevel: 4,
		costDescription: "$$$$ Higher cost",
		speed: 'slow',
		bestFor: ["Emotional storytelling", "Character depth", "Moral complexity", "Literary quality"]
	},
	'sage-swift': {
		id: 'sage-swift',
		name: 'Sage Swift',
		displayName: 'Sage Swift 🍃',
		description: 'Fast wisdom for quick decisions.',
		provider: 'anthropic',
		actualModel: 'anthropic/claude-haiku',
		tier: 'standard',
		whenToUse: "When you want Anthropic's reliability with speed. Great for consistent, dependable responses without the premium cost of full Sage.",
		pros: [
			"Fast responses from Anthropic",
			"Reliable and consistent",
			"Good value for money",
			"Decent creative quality"
		],
		cons: [
			"Less depth than full Sage",
			"Simpler than premium models",
			"Not as nuanced as Claude Sonnet"
		],
		costLevel: 1,
		costDescription: "$ Most affordable",
		speed: 'fast',
		bestFor: ["Quick reliable responses", "Budget-friendly", "Consistent quality", "Daily play"]
	},
	'grok': {
		id: 'grok',
		name: 'Grok',
		displayName: 'Grok 🚀',
		description: 'Witty and unconventional. Expect the unexpected!',
		provider: 'xai',
		actualModel: 'xai/grok-2',
		tier: 'premium',
		whenToUse: "When you want something different! Grok brings humor, wit, and unconventional thinking to your adventures. Perfect for players who want to be surprised.",
		pros: [
			"Humorous and witty responses",
			"Unconventional creative angles",
			"Fun, unpredictable storytelling",
			"Great for comedy campaigns"
		],
		cons: [
			"Can be inconsistent in tone",
			"May break immersion with jokes",
			"Not ideal for serious campaigns"
		],
		costLevel: 3,
		costDescription: "$$$ Premium pricing",
		speed: 'fast',
		bestFor: ["Comedy campaigns", "Unconventional stories", "Humor", "Something different"]
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
 * Resolve a model ID to its actual OpenRouter model string
 * Returns the default model's actual string if not found
 */
export function resolveModelToActual(id: string | null | undefined): string {
	if (!id || !isValidModelId(id)) {
		return getDefaultModel().actualModel;
	}
	return MODELS[id].actualModel;
}
