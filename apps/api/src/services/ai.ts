import { generateText, Output, NoObjectGeneratedError } from 'ai';
import type { LanguageModel } from 'ai';
import type { z } from 'zod';

/**
 * AI Service for LLM operations
 * 
 * Provides a unified interface for text generation and structured output
 * that works with any configured AI provider (direct Gemini or Vercel Gateway)
 * 
 * Uses the latest Vercel AI SDK Output API (non-deprecated)
 */
export class AIService {
    constructor(private model: LanguageModel) { }

    /**
     * Generate text completion from a prompt
     */
    async generateText(options: {
        systemPrompt?: string;
        prompt: string;
        temperature?: number;
    }): Promise<string> {
        const { systemPrompt, prompt, temperature } = options;

        try {
            const result = await generateText({
                model: this.model,
                system: systemPrompt,
                prompt,
                temperature,
            });

            return result.text;
        } catch (error) {
            console.error('Error in generateText:', error);
            throw error;
        }
    }

    /**
     * Generate structured output with type-safe schema validation
     * Uses Output.object() for structured generation
     */
    async generateObject<T extends z.ZodTypeAny>(options: {
        schema: T;
        name?: string;
        description?: string;
        systemPrompt?: string;
        prompt: string;
        temperature?: number;
    }): Promise<z.infer<T>> {
        const { schema, name, description, systemPrompt, prompt, temperature } = options;

        try {
            const result = await generateText({
                model: this.model,
                system: systemPrompt,
                prompt,
                temperature,
                output: Output.object({
                    schema,
                    name,
                    description,
                }),
            });

            return result.output;
        } catch (error) {
            if (NoObjectGeneratedError.isInstance(error)) {
                console.error('NoObjectGeneratedError in generateObject:');
                console.error('Cause:', error.cause);
                console.error('Text:', error.text);
                console.error('Response:', error.response);
                console.error('Usage:', error.usage);
            }
            throw error;
        }
    }

    /**
     * Generate an array of objects with schema validation
     * Uses Output.array() for generating multiple items
     * Useful for generating multiple items like characters or NPCs
     */
    async generateArray<T extends z.ZodTypeAny>(options: {
        itemSchema: T;
        count: number;
        name?: string;
        description?: string;
        systemPrompt?: string;
        prompt: string;
        temperature?: number;
    }): Promise<Array<z.infer<T>>> {
        const { itemSchema, count, name, description, systemPrompt, prompt, temperature } = options;

        try {
            const result = await generateText({
                model: this.model,
                system: systemPrompt,
                prompt: `${prompt}\n\nGenerate exactly ${count} items.`,
                temperature,
                output: Output.array({
                    element: itemSchema,
                    name,
                    description,
                }),
            });

            return result.output;
        } catch (error) {
            if (NoObjectGeneratedError.isInstance(error)) {
                console.error('NoObjectGeneratedError in generateArray:');
                console.error('Cause:', error.cause);
                console.error('Text:', error.text);
                console.error('Response:', error.response);
                console.error('Usage:', error.usage);
            }
            throw error;
        }
    }

    /**
     * Generate a choice from a set of string options
     * Useful for classification or fixed-enum answers
     */
    async generateChoice<T extends readonly string[]>(options: {
        choices: T;
        name?: string;
        description?: string;
        systemPrompt?: string;
        prompt: string;
        temperature?: number;
    }): Promise<T[number]> {
        const { choices, name, description, systemPrompt, prompt, temperature } = options;

        try {
            const result = await generateText({
                model: this.model,
                system: systemPrompt,
                prompt,
                temperature,
                output: Output.choice({
                    options: choices as unknown as string[],
                    name,
                    description,
                }),
            });

            return result.output as T[number];
        } catch (error) {
            console.error('Error in generateChoice:', error);
            throw error;
        }
    }
}
