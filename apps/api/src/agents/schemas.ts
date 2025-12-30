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
    scenePrompt: z.string()
        .describe("Visual scene description for image generation: environment, lighting, mood, key elements"),
    gameStatus: z.enum(["continue", "victory", "defeat"])
        .describe("Whether the game continues, or ends in victory/defeat"),
});

export type TurnOutput = z.infer<typeof turnOutputSchema>;

// ============================================================================
// OPENING OUTPUT SCHEMA
// ============================================================================

/**
 * Complete structured output for the opening scenario
 */
export const openingOutputSchema = z.object({
    narrative: z.string()
        .describe("Opening narrative setting the scene and atmosphere (3-5 sentences)"),
    immediateGoal: z.string()
        .describe("The immediate short-term goal for the player based on the objective"),
    suggestedActions: z.array(z.string())
        .describe("Three possible starting actions the player could take"),
    scenePrompt: z.string()
        .describe("Visual scene description for the opening image: environment, lighting, mood, key elements"),
    startingFacts: z.array(z.string())
        .describe("Key facts about the starting situation, e.g. ['You are outside the castle', 'It is night time']"),
});

export type OpeningOutput = z.infer<typeof openingOutputSchema>;
