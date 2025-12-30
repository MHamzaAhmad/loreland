/**
 * Tool definitions for Play Agent
 * 
 * Includes tools for game logic analysis and narrative generation.
 */
import { tool } from "ai";
import { z } from "zod";

// ============================================================================
// GAME LOGIC TOOLS
// ============================================================================

/**
 * Schema for analyzing the opening state
 */
export const analyzeOpeningSchema = z.object({
    immediateGoal: z.string().describe("The immediate short-term goal for the player based on the objective"),
    startingSituation: z.string().describe("Concise technical description of the starting position/state"),
    keyFacts: z.array(z.string()).describe("List of critical facts about the current scene (e.g., 'Door is locked', 'Guard is sleeping')"),
});

/**
 * Tool for analyzing the opening state of the game
 */
export const analyzeOpeningTool = tool({
    description: "Define the opening state analysis for the game",
    inputSchema: analyzeOpeningSchema,
    execute: async (args) => args,
});

/**
 * Schema for analyzing user turn outcomes
 */
export const analyzeTurnSchema = z.object({
    feasibility: z.enum(["possible", "impossible", "difficult"]).describe("Can the user do this?"),
    outcome: z.enum(["success", "failure", "partial_success", "critical_failure"]).describe("Result of the attempt"),
    reasoning: z.string().describe("Internal logic for why this happened (physics, luck, skill)"),
    worldUpdates: z.array(z.string()).describe("New facts about the world state"),
    healthChange: z.number().describe("Health change (+/-)"),
    skillUpdates: z.record(z.number()).describe("Changes to skill modifiers"),
});

/**
 * Tool for analyzing user turn outcomes
 */
export const analyzeTurnTool = tool({
    description: "Report the analysis of the turn and determine the outcome",
    inputSchema: analyzeTurnSchema,
    execute: async (args) => args,
});

// ============================================================================
// NARRATIVE TOOLS
// ============================================================================

/**
 * Schema for suggesting player actions
 */
export const suggestActionsSchema = z.object({
    actions: z.array(z.string()).length(3).describe("Three possible actions"),
});

/**
 * Tool for suggesting player actions
 */
export const suggestActionsTool = tool({
    description: "Suggest 3 possible actions for the player to take next",
    inputSchema: suggestActionsSchema,
    execute: async (args) => args,
});

/**
 * Schema for scene descriptions
 */
export const describeSceneSchema = z.object({
    scenePrompt: z.string().describe("Detailed visual description: environment, lighting, mood, key elements. Max 100 words."),
});

/**
 * Tool for generating scene descriptions (for image generation)
 */
export const describeSceneTool = tool({
    description: "Generate a visual description of the current scene for image generation",
    inputSchema: describeSceneSchema,
    execute: async (args) => args,
});
