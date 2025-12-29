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
// Asset Schemas (Lore, Items, Triggers)
// ============================================================================

export const lorebookSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(100),
    content: z.string().max(5000),
    keywords: z.array(z.string()).optional(),
    position: z.number().int().optional(),
});

export const trackedItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    dataType: z.enum(["text", "number", "boolean"]).optional(),
    visibility: z.enum(["everyone", "gm", "hidden"]).optional(),
    initialValue: z.string().optional(),
    position: z.number().int().optional(),
});

export const triggerEventSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(100),
    triggerOnTurn: z.number().int().optional(),
    condition: z.string().optional(),
    effect: z.string().optional(),
    position: z.number().int().optional(),
});


// ============================================================================
// Game Schemas
// ============================================================================

/**
 * Schema for creating a new game manually
 */
export const createGameSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(2000),
    background: z.string().min(1).max(5000),
    instructions: z.string().min(1).max(5000),
    objective: z.string().min(1).max(1000),
    authorStyle: z.string().max(500).optional(),
    designNotes: z.string().max(2000).optional(),
    nsfw: z.boolean().optional().default(false),
    contentWarnings: z.string().max(500).optional(),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;

/**
 * Schema for updating a game
 */
export const updateGameSchema = createGameSchema.partial().extend({
    // Image settings
    imageModel: z.string().max(100).optional(),
    imageStyle: z.string().max(500).optional(),
    previewImage: z.string().url().optional(),
    fullSizePreviewImage: z.string().url().optional(),

    // Permissions
    allowChangeCharacterName: z.boolean().optional(),
    allowChangeCharacterDescription: z.boolean().optional(),
    allowChangeCharacterSkills: z.boolean().optional(),
    sharingPermission: z.boolean().optional(),
    editingPermission: z.boolean().optional(),
    favorite: z.boolean().optional(),
    firstTurn: z.number().int().optional(),
    maxTurns: z.number().int().optional(),

    // Nested updates
    characters: z.array(updateCharacterSchema.extend({ id: z.string().optional() })).optional(),
    npcs: z.array(updateNpcSchema.extend({ id: z.string().optional() })).optional(),
    lorebookEntries: z.array(lorebookSchema).optional(),
    trackedItems: z.array(trackedItemSchema).optional(),
    triggerEvents: z.array(triggerEventSchema).optional(),
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

/**
 * Schema for list games query params
 */
export const listGamesQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    offset: z.coerce.number().int().min(0).optional().default(0),
    favorite: z.enum(["true", "false"]).optional().transform(v => v === "true"),
});

export type ListGamesQuery = z.infer<typeof listGamesQuerySchema>;

// ============================================================================
// Workflow Types
// ============================================================================

/**
 * Params passed to GameGenerationWorkflow
 */
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
}

/**
 * Progress data stored in workflow state
 */
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

/**
 * Schema for AI-generated game metadata
 */
export const aiGameMetadataSchema = z.object({
    title: z.string().max(100).describe("Creative game title"),
    description: z.string().min(10).max(1000).describe("Engaging game description"),
    background: z.string().min(10).max(2000).describe("World lore and setting"),
    instructions: z.string().min(10).max(1000).describe("How to play the game"),
    objective: z.string().min(10).max(500).describe("Main goal of the game"),
});

export type AIGameMetadata = z.infer<typeof aiGameMetadataSchema>;

/**
 * Schema for AI-generated character
 */
export const aiCharacterSchema = z.object({
    name: z.string().describe("Character name"),
    description: z.string().min(10).max(1000).describe("Personality, abilities, and backstory"),
    appearance: z.string().min(10).max(500).describe("Physical description for image generation"),
});

export type AICharacter = z.infer<typeof aiCharacterSchema>;

/**
 * Schema for AI-generated characters array
 */
export const aiCharactersSchema = z.array(aiCharacterSchema);

/**
 * Schema for AI-generated NPC
 */
export const aiNpcSchema = z.object({
    name: z.string().describe("NPC name"),
    detail: z.string().min(10).max(500).optional().describe("Role and personality"),
    oneLiner: z.string().min(5).max(300).optional().describe("Memorable quote"),
    appearance: z.string().min(5).max(500).optional().describe("Physical description"),
    location: z.string().min(5).max(300).optional().describe("Where the NPC can be found"),
});

export type AINPC = z.infer<typeof aiNpcSchema>;

/**
 * Schema for AI-generated NPCs array
 */
export const aiNpcsSchema = z.array(aiNpcSchema);

