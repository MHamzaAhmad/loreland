/**
 * Zod schemas for Play Agent structured outputs
 *
 * Using Output.object() with these schemas guarantees the LLM returns
 * complete, type-safe data on every call - no tool extraction needed.
 */
import { z } from "zod";

// ============================================================================
// OUTCOME SCHEMA
// ============================================================================

/**
 * Game outcome after evaluating user action
 */
export const outcomeSchema = z.object({
    success: z.enum(["success", "failure", "partial", "critical_success", "critical_failure"])
        .describe("Result of the user's action attempt"),
    reasoning: z.string()
        .describe("Brief internal logic for why this outcome occurred (physics, skill, luck)"),
    healthChange: z.number()
        .describe("Health change from this action (+/- value, 0 if no change)"),
    skillUpdates: z.record(z.number())
        .describe("Changes to skill modifiers, e.g. { 'stealth': +5, 'strength': -2 }"),
    worldUpdates: z.array(z.string())
        .describe("New facts about the world state, e.g. ['Door is now open', 'Guard is alerted']"),
});

export type Outcome = z.infer<typeof outcomeSchema>;

// ============================================================================
// TURN OUTPUT SCHEMA
// ============================================================================

/**
 * Complete structured output for a turn
 */
export const turnOutputSchema = z.object({
    narrative: z.string()
        .describe("Vivid narrative describing what happens (2-5 sentences). Describe the scene, the action, and the result."),
    suggestedActions: z.array(z.string())
        .describe("Three possible follow-up actions the player could take"),
    outcome: outcomeSchema
        .describe("The game logic outcome of the user's action"),
    stateChanges: z.record(z.string()).optional()
        .describe("Any tracked game states that changed, mapping state name to new value"),
    scenePrompt: z.string()
        .describe("Visual scene description for image generation. Describe the scene as if painting a picture: include setting/environment, lighting conditions, atmospheric mood, colors, and key visible elements. Focus on what can be SEEN, not actions or narrative."),
    gameStatus: z.enum(["continue", "victory", "defeat"])
        .describe("Whether the game continues, or ends in victory/defeat"),
});

export type TurnOutput = z.infer<typeof turnOutputSchema>;
