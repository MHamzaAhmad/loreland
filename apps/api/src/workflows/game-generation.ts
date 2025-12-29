import {
    WorkflowEntrypoint,
    type WorkflowEvent,
    type WorkflowStep,
} from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { GamesService } from "../services/games";
import { ImagesService } from "../services/images";
import { AIService } from "../services/ai";
import { eq } from "drizzle-orm";
import { characters, npcs, userSettings } from "@packages/db/schema/d1";
import type { GameGenerationParams } from "../lib/schemas";
import {
    aiGameMetadataSchema,
    aiCharacterSchema,
    aiNpcSchema,
} from "../lib/schemas";
import { createAIConfig, getLanguageModel, type AIEnv } from "../lib/ai-config";

// Workflow bindings type
type Env = AIEnv & {
    DB: D1Database;
    IMAGES: R2Bucket;
    AI: Ai;
    VECTORIZE: VectorizeIndex;
};

/**
 * Durable workflow for AI-powered game generation
 * 
 * Steps:
 * 1. validate-and-init: Create initial game record
 * 2. generate-metadata: Generate title, description, background via AI
 * 3. generate-characters: Generate playable characters
 * 4. generate-npcs: Generate NPCs
 * 5. generate-preview-image: Generate game preview with Flux
 * 6. generate-character-portraits: Generate character images
 * 7. save-entities: Save characters and NPCs to database
 * 8. finalize-game: Update game record with all data
 * 9. vectorize-game: Index game for semantic search
 */
export class GameGenerationWorkflow extends WorkflowEntrypoint<Env, GameGenerationParams> {
    async run(event: WorkflowEvent<GameGenerationParams>, step: WorkflowStep) {
        const { userId, prompt, options } = event.payload;
        const db = drizzle(this.env.DB);
        const gamesService = new GamesService(db);
        const imagesService = new ImagesService(this.env.AI, this.env.IMAGES);

        // Fetch user model preference
        const userSettingsRecord = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .get();

        // Initialize AI service with configured provider and user preference
        const aiConfig = createAIConfig(this.env, userSettingsRecord?.modelPreference);
        const model = getLanguageModel(aiConfig);
        const aiService = new AIService(model);

        // Step 1: Validate and create initial game record
        const gameRecord = await step.do("validate-and-init", async () => {
            const game = await gamesService.createPending(userId, prompt);
            return {
                gameId: game.id,
                currentStep: "validate-and-init",
                stepsCompleted: 1,
                message: "Game record created, generating content...",
            };
        });

        const gameId = gameRecord.gameId;

        // Step 2: Generate game metadata using AI
        const metadata = await step.do("generate-metadata", async () => {
            const gameMetadata = await aiService.generateObject({
                schema: aiGameMetadataSchema,
                systemPrompt: "You are a creative game designer. Generate engaging, detailed, and family-friendly game metadata. Ensure all content is safe for work (SFW) and suitable for a general audience. Avoid explicit violence, gore, or sexual themes.",
                prompt: `Create a game based on this prompt: ${prompt}`,
            });

            return {
                ...gameMetadata,
                currentStep: "generate-metadata",
                stepsCompleted: 2,
                message: `Game "${gameMetadata.title}" concept created`,
            };
        });

        // Step 3: Generate characters
        const generatedCharacters = await step.do("generate-characters", async () => {
            const characters = await aiService.generateArray({
                itemSchema: aiCharacterSchema,
                count: options.characterCount,
                systemPrompt: "You are a creative character designer. Generate diverse and interesting playable characters. Ensure all descriptions are family-friendly and safe for work.",
                prompt: `Create characters for a game titled "${metadata.title}". Setting: ${metadata.background.slice(0, 200)}`,
            });

            return {
                characters,
                currentStep: "generate-characters",
                stepsCompleted: 3,
                message: `Generated ${characters.length} characters`,
            };
        });

        // Step 4: Generate NPCs
        const generatedNpcs = await step.do("generate-npcs", async () => {
            if (options.npcCount === 0) {
                return {
                    npcs: [],
                    currentStep: "generate-npcs",
                    stepsCompleted: 4,
                    message: "Skipped NPC generation",
                };
            }

            const npcs = await aiService.generateArray({
                itemSchema: aiNpcSchema,
                count: options.npcCount,
                systemPrompt: "You are a creative NPC designer. Generate memorable and diverse NPCs with distinct personalities. Ensure all descriptions are family-friendly and safe for work.",
                prompt: `Create NPCs for "${metadata.title}". Setting: ${metadata.background.slice(0, 200)}`,
            });

            return {
                npcs,
                currentStep: "generate-npcs",
                stepsCompleted: 4,
                message: `Generated ${npcs.length} NPCs`,
            };
        });

        // Step 5: Generate preview image
        const previewImages = await step.do("generate-preview-image", async () => {
            if (!options.generatePreviewImage) {
                return {
                    previewKey: null as string | null,
                    fullSizeKey: null as string | null,
                    currentStep: "generate-preview-image",
                    stepsCompleted: 5,
                    message: "Skipped preview image",
                };
            }

            const { key, fullSizeKey } = await imagesService.generateGamePreview(
                gameId,
                metadata.title,
                metadata.description,
                options.imageStyle
            );

            return {
                previewKey: key,
                fullSizeKey,
                currentStep: "generate-preview-image",
                stepsCompleted: 5,
                message: "Generated game preview image",
            };
        });

        // Step 6: Generate character portraits
        const characterPortraits = await step.do("generate-character-portraits", async () => {
            if (!options.generateCharacterPortraits) {
                return {
                    portraits: [] as Array<{
                        characterIndex: number;
                        key: string;
                        fullSizeKey: string;
                    }>,
                    currentStep: "generate-character-portraits",
                    stepsCompleted: 6,
                    message: "Skipped character portraits",
                };
            }

            const portraits: Array<{
                characterIndex: number;
                key: string;
                fullSizeKey: string;
            }> = [];

            for (let i = 0; i < generatedCharacters.characters.length; i++) {
                const char = generatedCharacters.characters[i];
                const charId = crypto.randomUUID();

                const { key, fullSizeKey } = await imagesService.generateCharacterPortrait(
                    gameId,
                    charId,
                    char.name,
                    char.appearance,
                    options.imageStyle
                );

                portraits.push({ characterIndex: i, key, fullSizeKey });
            }

            return {
                portraits,
                currentStep: "generate-character-portraits",
                stepsCompleted: 6,
                message: `Generated ${portraits.length} character portraits`,
            };
        });

        // Step 7: Save characters and NPCs to database
        const savedEntities = await step.do("save-entities", async () => {
            // Insert characters
            let characterCount = 0;
            for (let i = 0; i < generatedCharacters.characters.length; i++) {
                const char = generatedCharacters.characters[i];
                const portrait = characterPortraits.portraits.find(p => p.characterIndex === i);

                await db
                    .insert(characters)
                    .values({
                        gameId,
                        characterId: crypto.randomUUID(),
                        name: char.name,
                        description: char.description,
                        portrait: portrait?.key ?? null,
                        fullSizePortrait: portrait?.fullSizeKey ?? null,
                        position: i,
                    });

                characterCount++;
            }

            // Insert NPCs
            let npcCount = 0;
            for (let i = 0; i < generatedNpcs.npcs.length; i++) {
                const npc = generatedNpcs.npcs[i];

                await db
                    .insert(npcs)
                    .values({
                        gameId,
                        name: npc.name,
                        detail: npc.detail,
                        oneLiner: npc.oneLiner,
                        location: npc.location,
                        imgAppearance: npc.appearance,
                        position: i,
                    });

                npcCount++;
            }

            return {
                characterCount,
                npcCount,
                currentStep: "save-entities",
                stepsCompleted: 7,
                message: `Saved ${characterCount} characters and ${npcCount} NPCs`,
            };
        });

        // Step 8: Finalize game record
        await step.do("finalize-game", async () => {
            await gamesService.finalize(gameId, {
                title: metadata.title,
                description: metadata.description,
                background: metadata.background,
                instructions: metadata.instructions,
                objective: metadata.objective,
                previewImage: previewImages.previewKey ?? undefined,
                fullSizePreviewImage: previewImages.fullSizeKey ?? undefined,
                imageStyle: options.imageStyle,
            });

            return {
                currentStep: "finalize-game",
                stepsCompleted: 8,
                message: "Game finalized, indexing for search...",
            };
        });

        // Step 9: Vectorize game for semantic search
        await step.do("vectorize-game", async () => {
            // Generate embedding from title + description + background
            const searchText = [
                metadata.title,
                metadata.description,
                metadata.background,
                metadata.objective,
            ].join(" ").slice(0, 2000);

            const embeddingResponse = await this.env.AI.run(
                "@cf/baai/bge-large-en-v1.5",
                { text: [searchText] }
            );

            const embedding = (embeddingResponse as { data: number[][] }).data[0];
            if (!embedding) {
                throw new Error("Failed to generate embedding");
            }

            // Upsert to Vectorize index
            await this.env.VECTORIZE.upsert([
                {
                    id: gameId,
                    values: embedding,
                    metadata: {
                        userId,
                        title: metadata.title,
                    },
                },
            ]);

            return {
                currentStep: "vectorize-game",
                stepsCompleted: 9,
                message: "Game indexed for search!",
            };
        });

        // Return final result
        return {
            gameId,
            title: metadata.title,
            characterCount: savedEntities.characterCount,
            npcCount: savedEntities.npcCount,
            hasPreviewImage: !!previewImages.previewKey,
            progress: {
                currentStep: "complete",
                stepsCompleted: 9,
                totalSteps: 9,
                message: "Game generation complete!",
            },
        };
    }
}
