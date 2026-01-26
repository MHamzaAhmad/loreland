import { z } from "zod";

// ============================================================================
// Character Schemas
// ============================================================================

export const createCharacterSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(2000),
    portrait: z.string().url().optional(),
    position: z.number().int().optional(),
});

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;

export const updateCharacterSchema = createCharacterSchema.partial();

export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;

// ============================================================================
// NPC Schemas
// ============================================================================

export const createNpcSchema = z.object({
    name: z.string().min(1).max(100),
    detail: z.string().max(2000).optional(),
    oneLiner: z.string().max(200).optional(),
    appearance: z.string().max(500).optional(),
    location: z.string().max(200).optional(),
    secretInfo: z.string().max(1000).optional(),
    position: z.number().int().optional(),
});

export type CreateNpcInput = z.infer<typeof createNpcSchema>;

export const updateNpcSchema = createNpcSchema.partial();

export type UpdateNpcInput = z.infer<typeof updateNpcSchema>;

// ============================================================================
// State & Trigger Schemas
// ============================================================================

export const stateSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    dataType: z.enum(["text", "number", "boolean"]).optional(),
    visibility: z.enum(["visible", "hidden", "conditional"]).optional(),
    displayCondition: z.string().max(500).optional(),
    initialValue: z.string().optional(),
    position: z.number().int().optional(),
});

export const triggerSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(100),
    condition: z.string().min(1).max(1000),
    effect: z.string().min(1).max(1000),
    triggerOnTurn: z.number().int().optional(),
    oneShot: z.boolean().optional(),
    position: z.number().int().optional(),
});

export const lorebookSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(100),
    content: z.string().max(5000),
    keywords: z.array(z.string()).optional(),
    position: z.number().int().optional(),
});

// ============================================================================
// Game Schemas
// ============================================================================

/**
 * Schema for creating a new game
 */
export const createGameSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(2000),
    worldDescription: z.string().min(1).max(5000),
    objective: z.string().min(1).max(1000),
    firstPrompt: z.string().min(1).max(2000),

    // Narrative control
    authorStyle: z.string().max(500).optional(),
    turnInstructions: z.string().max(2000).optional(),
    summarizationInstructions: z.string().max(1000).optional(),

    // Image generation
    imageInstructions: z.string().max(1000).optional(),
    imageStyle: z.string().max(500).optional(),

    // End conditions
    victoryCondition: z.string().max(500).optional(),
    defeatCondition: z.string().max(500).optional(),

    designNotes: z.string().max(2000).optional(),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;

/**
 * Schema for updating a game
 */
export const updateGameSchema = createGameSchema.partial().extend({
    // Image settings
    imageModel: z.string().max(100).optional(),
    previewImage: z.string().url().optional(),
    fullSizePreviewImage: z.string().url().optional(),

    // Settings
    public: z.boolean().optional(),
    favorite: z.boolean().optional(),

    // Nested updates
    characters: z.array(updateCharacterSchema.extend({ id: z.string().optional() })).optional(),
    npcs: z.array(updateNpcSchema.extend({ id: z.string().optional() })).optional(),
    lorebookEntries: z.array(lorebookSchema).optional(),
    states: z.array(stateSchema).optional(),
    triggers: z.array(triggerSchema).optional(),
});

export type UpdateGameInput = z.infer<typeof updateGameSchema>;

/**
 * Schema for game generation prompt
 */
export const generateGameSchema = z.object({
    prompt: z.string().min(1).max(2000),
    options: z.object({
        characterCount: z.number().int().min(1).max(6).optional().default(3),
        npcCount: z.number().int().min(0).max(10).optional().default(5),
        generatePreviewImage: z.boolean().optional().default(true),
        generateCharacterPortraits: z.boolean().optional().default(true),
        imageStyle: z.string().max(200).optional().default("fantasy illustration, detailed, vibrant colors"),
    }).optional().default({}),
});

export type GenerateGameInput = z.infer<typeof generateGameSchema>;

// ============================================================================
// Query Schemas
// ============================================================================

export const paginationQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    offset: z.coerce.number().int().min(0).optional().default(0),
});

export const listGamesQuerySchema = paginationQuerySchema.extend({
    favorite: z.enum(["true", "false"]).optional().transform(v => v === "true"),
    search: z.string().optional(),
    public: z.enum(["true", "false"]).optional().transform(v => v === "true"),
    private: z.enum(["true", "false"]).optional().transform(v => v === "true"),
});

export type ListGamesQuery = z.infer<typeof listGamesQuerySchema>;

export const listSessionsQuerySchema = paginationQuerySchema.extend({});

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

// ============================================================================
// Workflow Types
// ============================================================================

export interface GameGenerationParams {
    userId: string;
    prompt: string;
    options: {
        characterCount: number;
        npcCount: number;
        generatePreviewImage: boolean;
        generateCharacterPortraits: boolean;
        imageStyle: string;
    };
    instanceId: string;
}

export interface GenerationProgress {
    gameId: string;
    currentStep: string;
    stepsCompleted: number;
    totalSteps: number;
    message: string;
    error?: string;
}

// ============================================================================
// AI-Generated Content Schemas
// ============================================================================

export const aiGameMetadataSchema = z.object({
    title: z.string().max(100).describe("Creative game title"),
    description: z.string().min(10).max(1000).describe("Engaging game description"),
    worldDescription: z.string().min(10).max(2000).describe("World lore and setting"),
    objective: z.string().min(10).max(500).describe("Main goal of the game"),
    firstPrompt: z.string().min(10).max(1000).describe("Opening scenario prompt"),
});

export type AIGameMetadata = z.infer<typeof aiGameMetadataSchema>;

export const aiCharacterSchema = z.object({
    name: z.string().describe("Character name"),
    description: z.string().min(10).max(1000).describe("Personality, abilities, and backstory"),
    appearance: z.string().min(10).max(500).describe("Physical description for image generation"),
});

export type AICharacter = z.infer<typeof aiCharacterSchema>;

export const aiCharactersSchema = z.array(aiCharacterSchema);

export const aiNpcSchema = z.object({
    name: z.string().describe("NPC name"),
    detail: z.string().min(10).max(500).optional().describe("Role and personality"),
    oneLiner: z.string().min(5).max(300).optional().describe("Memorable quote"),
    appearance: z.string().min(5).max(500).optional().describe("Physical description"),
    location: z.string().min(5).max(300).optional().describe("Where the NPC can be found"),
});

export type AINPC = z.infer<typeof aiNpcSchema>;

export const aiNpcsSchema = z.array(aiNpcSchema);

// ============================================================================
// Turn Response Schema (AI Output)
// ============================================================================

export const turnResponseSchema = z.object({
    narrative: z.string().describe("Vivid description of what happens (2-5 sentences)"),
    stateChanges: z.record(z.string()).optional().describe("State name -> new value"),
    suggestedActions: z.array(z.string()).describe("3 contextually appropriate next actions"),
    scenePrompt: z.string().describe("Visual description for image generation"),
    gameStatus: z.enum(["continue", "victory", "defeat"]).describe("Game status after this turn"),
});

export type TurnResponse = z.infer<typeof turnResponseSchema>;

export const openingResponseSchema = z.object({
    narrative: z.string().describe("Opening narrative (3-5 immersive sentences)"),
    immediateGoal: z.string().describe("What the player should focus on first"),
    suggestedActions: z.array(z.string()).describe("3 starter actions"),
    scenePrompt: z.string().describe("Visual description for opening image"),
    initialStates: z.record(z.string()).optional().describe("Initial state values"),
});

export type OpeningResponse = z.infer<typeof openingResponseSchema>;
