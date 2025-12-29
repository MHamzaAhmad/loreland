import { z } from "zod";

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
});

export type UpdateGameInput = z.infer<typeof updateGameSchema>;

/**
 * Schema for game generation prompt
 */
export const generateGameSchema = z.object({
    prompt: z.string().min(10).max(2000),
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
// Character Schemas
// ============================================================================

export const createCharacterSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(2000),
    portrait: z.string().url().optional(),
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
});

export type CreateNpcInput = z.infer<typeof createNpcSchema>;

export const updateNpcSchema = createNpcSchema.partial();

export type UpdateNpcInput = z.infer<typeof updateNpcSchema>;

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
