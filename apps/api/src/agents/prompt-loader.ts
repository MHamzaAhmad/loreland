/**
 * Prompt Loader Utility
 * 
 * Loads prompt templates from .md files with simple variable interpolation.
 * Uses {{variable}} syntax for replacements and {{#if variable}}...{{/if}} for conditionals.
 * 
 * Note: Uses simple string replacement instead of Handlebars to avoid eval/new Function
 * which is blocked in Cloudflare Workers.
 */

// Import prompts as raw text (bundled at build time)
import gameMasterPrompt from "./prompts/game-master.md";
import summaryPrompt from "./prompts/summary.md";

/**
 * Available prompt names
 */
export type PromptName =
    | "game-master"
    | "summary";

/**
 * Prompt templates map
 */
const PROMPTS: Record<PromptName, string> = {
    "game-master": gameMasterPrompt,
    "summary": summaryPrompt,
};

/**
 * Simple template interpolation using {{variable}} syntax
 * 
 * Supports:
 * - {{variable}} - Simple variable interpolation
 * - {{#if variable}}content{{/if}} - Conditional blocks (shows content if variable is truthy)
 * 
 * @param template - The template string
 * @param context - Variables to interpolate
 * @returns The interpolated string
 */
function interpolate(template: string, context: Record<string, unknown>): string {
    let result = template;

    // Handle {{#if variable}}...{{/if}} blocks
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
        const value = context[varName];
        return value ? content : "";
    });

    // Handle simple {{variable}} interpolation
    result = result.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
        const value = context[varName];
        return value !== undefined && value !== null ? String(value) : "";
    });

    return result.trim();
}

/**
 * Load a prompt template and render with variables
 * 
 * @param name - The prompt name (without extension)
 * @param context - Variables to pass to the template
 * @returns The rendered prompt string
 * 
 * @example
 * const prompt = loadPrompt("game-master", {
 *     gameTitle: "My Game",
 *     background: "A dark forest...",
 *     objective: "Find the treasure",
 *     characterName: "Aria",
 *     characterDescription: "A skilled ranger"
 * });
 */
export function loadPrompt(
    name: PromptName,
    context: Record<string, unknown> = {}
): string {
    const template = PROMPTS[name];
    if (!template) {
        throw new Error(`Unknown prompt: ${name}. Available: ${Object.keys(PROMPTS).join(", ")}`);
    }
    return interpolate(template, context);
}
