/**
 * OpenRouter Provider for Vercel AI SDK
 * 
 * Creates properly configured OpenRouter client and LanguageModel instances
 * for use with the Vercel AI SDK throughout the application.
 */
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { resolveModelToActual } from "./models";

/**
 * Create an OpenRouter client instance
 * 
 * @param apiKey - OpenRouter API key from environment
 * @returns Configured OpenRouter provider instance
 */
export function createOpenRouterClient(apiKey: string) {
	return createOpenRouter({
		apiKey,
		headers: {
			"HTTP-Referer": "https://loreland.ai",
			"X-Title": "Loreland AI",
		},
	});
}

/**
 * Get a LanguageModel instance for the specified gamified model ID
 * 
 * @param openrouter - OpenRouter client instance
 * @param modelId - Gamified model ID (e.g., "nova-flash", "titan")
 *                  If null/undefined/invalid, falls back to default model
 * @returns LanguageModel instance ready for use with Vercel AI SDK
 * 
 * @example
 * const openrouter = createOpenRouterClient(env.OPENROUTER_API_KEY);
 * const model = getOpenRouterModel(openrouter, "titan");
 * const result = await generateText({ model, prompt: "Hello" });
 */
export function getOpenRouterModel(
	openrouter: ReturnType<typeof createOpenRouterClient>,
	modelId?: string | null,
): LanguageModel {
	const actualModel = resolveModelToActual(modelId);
	return openrouter.chat(actualModel);
}

/**
 * Type alias for the OpenRouter client return type
 */
export type OpenRouterClient = ReturnType<typeof createOpenRouterClient>;
