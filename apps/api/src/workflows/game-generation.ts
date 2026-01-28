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
import { characters, npcs, userSettings, states, triggers, lorebookEntries } from "@packages/db/schema/d1";
import * as d1Schema from "@packages/db/schema/d1";
import type { GameGenerationParams } from "../lib/schemas";
import {
    aiGameMetadataSchema,
    aiCharacterSchema,
    aiNpcSchema,
    aiStateSchema,
    aiTriggerSchema,
    aiLorebookSchema,
} from "../lib/schemas";
import { getLanguageModel, type AIEnv } from "../lib/ai-config";
import type { GenerationStatusAgent } from "../agents/generation-status-agent";

// Workflow bindings type
type Env = AIEnv & {
    DB: D1Database;
    IMAGES: R2Bucket;
    AI: Ai;
    VECTORIZE: VectorizeIndex;
    GENERATION_STATUS: DurableObjectNamespace<GenerationStatusAgent>;
};

/**
 * Durable workflow for AI-powered game generation
 * 
 * Steps:
 * 1. validate-and-init: Create initial game record
 * 2. generate-metadata: Generate title, description, background, authorStyle, conditions via AI
 * 3. generate-characters: Generate playable characters
 * 4. generate-npcs: Generate NPCs
 * 5. generate-states: Generate game states
 * 6. generate-triggers: Generate triggers
 * 7. generate-lore: Generate lorebook entries
 * 8. generate-preview-image: Generate game preview with Flux
 * 9. generate-character-portraits: Generate character images
 * 10. save-entities: Save all entities to database
 * 11. finalize-game: Update game record with all data
 * 12. vectorize-game: Index game for semantic search
 */
export class GameGenerationWorkflow extends WorkflowEntrypoint<Env, GameGenerationParams> {
    async run(event: WorkflowEvent<GameGenerationParams>, step: WorkflowStep) {
        const { userId, prompt, options, instanceId } = event.payload;
        const db = drizzle(this.env.DB, { schema: d1Schema });
        const gamesService = new GamesService(db);
        const imagesService = new ImagesService(this.env.AI, this.env.IMAGES);

        // Fetch user model preference
        const userSettingsRecord = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .get();

        // Initialize AI service with configured provider and user preference
        const model = getLanguageModel(userSettingsRecord?.modelPreference);
        const aiService = new AIService(model);

        const TOTAL_STEPS = 12;

        // Step 1: Validate and create initial game record
        const gameRecord = await step.do("validate-and-init", async () => {
            const game = await gamesService.createPending(userId, prompt);

            await this.updateStatus(instanceId, {
                currentStep: "validate-and-init",
                stepsCompleted: 1,
                totalSteps: TOTAL_STEPS,
                message: "Game record created, generating content...",
                gameId: game.id,
            });

            return {
                gameId: game.id,
                currentStep: "validate-and-init",
                stepsCompleted: 1,
                message: "Game record created, generating content...",
            };
        });

        const gameId = gameRecord.gameId;

        // Step 2: Generate game metadata using AI (enhanced with more fields)
        const metadata = await step.do("generate-metadata", async () => {
            const gameMetadata = await aiService.generateObject({
                schema: aiGameMetadataSchema,
                systemPrompt: `You are a creative game designer. Generate engaging, detailed, and family-friendly game metadata. 
Ensure all content is safe for work (SFW) and suitable for a general audience. 
Create a compelling authorStyle that defines the narrative voice.
Define clear victory and defeat conditions.
Provide turn instructions for consistent AI behavior.`,
                prompt: `Create a game based on this prompt: ${prompt}`,
            });

            const metadataWithProgress = {
                ...gameMetadata,
                currentStep: "generate-metadata",
                stepsCompleted: 2,
                message: `Game "${gameMetadata.title}" concept created`
            };

            await this.updateStatus(instanceId, {
                currentStep: metadataWithProgress.currentStep,
                stepsCompleted: metadataWithProgress.stepsCompleted,
                totalSteps: TOTAL_STEPS,
                message: metadataWithProgress.message,
            });

            return metadataWithProgress;
        });

        // Step 3: Generate characters
        const generatedCharacters = await step.do("generate-characters", async () => {
            const chars = await aiService.generateArray({
                itemSchema: aiCharacterSchema,
                count: options.characterCount,
                systemPrompt: "You are a creative character designer. Generate diverse and interesting playable characters. Ensure all descriptions are family-friendly and safe for work.",
                prompt: `Create characters for a game titled "${metadata.title}". Setting: ${metadata.worldDescription.slice(0, 200)}`,
            });

            await this.updateStatus(instanceId, {
                currentStep: "generate-characters",
                stepsCompleted: 3,
                totalSteps: TOTAL_STEPS,
                message: `Generated ${chars.length} characters`,
            });

            return {
                characters: chars,
                currentStep: "generate-characters",
                stepsCompleted: 3,
                message: `Generated ${chars.length} characters`,
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

            const npcList = await aiService.generateArray({
                itemSchema: aiNpcSchema,
                count: options.npcCount,
                systemPrompt: `You are a creative NPC designer. Generate memorable and diverse NPCs with distinct personalities. 
Ensure all descriptions are family-friendly and safe for work.
Include secret information for each NPC that players can discover.`,
                prompt: `Create NPCs for "${metadata.title}". Setting: ${metadata.worldDescription.slice(0, 200)}`,
            });

            await this.updateStatus(instanceId, {
                currentStep: "generate-npcs",
                stepsCompleted: 4,
                totalSteps: TOTAL_STEPS,
                message: `Generated ${npcList.length} NPCs`,
            });

            return {
                npcs: npcList,
                currentStep: "generate-npcs",
                stepsCompleted: 4,
                message: `Generated ${npcList.length} NPCs`,
            };
        });

        // Step 5: Generate game states
        const generatedStates = await step.do("generate-states", async () => {
            const stateList = await aiService.generateArray({
                itemSchema: aiStateSchema,
                count: 4, // Generate 4 relevant states
                systemPrompt: `You are a game designer creating trackable game states. 
Create meaningful states that players can interact with and that affect gameplay.
Examples: Health, Gold, Reputation, Hunger, Sanity, Time of Day, etc.`,
                prompt: `Create game states for "${metadata.title}". 
Objective: ${metadata.objective}
These states should be relevant to the world and help track player progress.`,
            });

            await this.updateStatus(instanceId, {
                currentStep: "generate-states",
                stepsCompleted: 5,
                totalSteps: TOTAL_STEPS,
                message: `Generated ${stateList.length} game states`,
            });

            return {
                states: stateList,
                currentStep: "generate-states",
                stepsCompleted: 5,
                message: `Generated ${stateList.length} game states`,
            };
        });

        // Step 6: Generate triggers
        const generatedTriggers = await step.do("generate-triggers", async () => {
            const triggerList = await aiService.generateArray({
                itemSchema: aiTriggerSchema,
                count: 3, // Generate 3 relevant triggers
                systemPrompt: `You are a game designer creating event triggers.
Create triggers that fire when certain conditions are met, adding dynamic gameplay.
Triggers should reference the game states when appropriate.`,
                prompt: `Create triggers for "${metadata.title}".
Victory: ${metadata.victoryCondition || "Not specified"}
Defeat: ${metadata.defeatCondition || "Not specified"}
Available states: ${generatedStates.states.map(s => s.name).join(", ")}`,
            });

            await this.updateStatus(instanceId, {
                currentStep: "generate-triggers",
                stepsCompleted: 6,
                totalSteps: TOTAL_STEPS,
                message: `Generated ${triggerList.length} triggers`,
            });

            return {
                triggers: triggerList,
                currentStep: "generate-triggers",
                stepsCompleted: 6,
                message: `Generated ${triggerList.length} triggers`,
            };
        });

        // Step 7: Generate lorebook entries
        const generatedLore = await step.do("generate-lore", async () => {
            const loreList = await aiService.generateArray({
                itemSchema: aiLorebookSchema,
                count: 3, // Generate 3 lore entries
                systemPrompt: `You are a worldbuilder creating lore entries.
Create rich background lore that adds depth to the game world.
Each entry should focus on a different aspect: history, factions, locations, or legends.`,
                prompt: `Create lore entries for "${metadata.title}".
World: ${metadata.worldDescription.slice(0, 300)}`,
            });

            await this.updateStatus(instanceId, {
                currentStep: "generate-lore",
                stepsCompleted: 7,
                totalSteps: TOTAL_STEPS,
                message: `Generated ${loreList.length} lore entries`,
            });

            return {
                lore: loreList,
                currentStep: "generate-lore",
                stepsCompleted: 7,
                message: `Generated ${loreList.length} lore entries`,
            };
        });

        // Step 8: Generate preview image
        const previewImages = await step.do("generate-preview-image", async () => {
            if (!options.generatePreviewImage) {
                return {
                    previewKey: null as string | null,
                    fullSizeKey: null as string | null,
                    currentStep: "generate-preview-image",
                    stepsCompleted: 8,
                    message: "Skipped preview image",
                };
            }

            const { key, fullSizeKey } = await imagesService.generateGamePreview(
                gameId,
                metadata.title,
                metadata.description,
                options.imageStyle
            );

            await this.updateStatus(instanceId, {
                currentStep: "generate-preview-image",
                stepsCompleted: 8,
                totalSteps: TOTAL_STEPS,
                message: "Generated game preview image",
            });

            return {
                previewKey: key,
                fullSizeKey,
                currentStep: "generate-preview-image",
                stepsCompleted: 8,
                message: "Generated game preview image",
            };
        });

        // Step 9: Generate character portraits
        const characterPortraits = await step.do("generate-character-portraits", async () => {
            if (!options.generateCharacterPortraits) {
                return {
                    portraits: [] as Array<{
                        characterIndex: number;
                        key: string;
                        fullSizeKey: string;
                    }>,
                    currentStep: "generate-character-portraits",
                    stepsCompleted: 9,
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

            await this.updateStatus(instanceId, {
                currentStep: "generate-character-portraits",
                stepsCompleted: 9,
                totalSteps: TOTAL_STEPS,
                message: `Generated ${portraits.length} character portraits`,
            });

            return {
                portraits,
                currentStep: "generate-character-portraits",
                stepsCompleted: 9,
                message: `Generated ${portraits.length} character portraits`,
            };
        });

        // Step 10: Save all entities to database
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
                        secretInfo: npc.secretInfo,
                        position: i,
                    });

                npcCount++;
            }

            // Insert states
            let stateCount = 0;
            for (let i = 0; i < generatedStates.states.length; i++) {
                const state = generatedStates.states[i];

                await db
                    .insert(states)
                    .values({
                        gameId,
                        name: state.name,
                        description: state.description,
                        dataType: state.dataType,
                        initialValue: state.initialValue,
                        visibility: state.visibility || "visible",
                        position: i,
                    });

                stateCount++;
            }

            // Insert triggers
            let triggerCount = 0;
            for (let i = 0; i < generatedTriggers.triggers.length; i++) {
                const trigger = generatedTriggers.triggers[i];

                await db
                    .insert(triggers)
                    .values({
                        gameId,
                        name: trigger.name,
                        condition: trigger.condition,
                        effect: trigger.effect,
                        oneShot: trigger.oneShot || false,
                        position: i,
                    });

                triggerCount++;
            }

            // Insert lore entries
            let loreCount = 0;
            for (let i = 0; i < generatedLore.lore.length; i++) {
                const lore = generatedLore.lore[i];

                await db
                    .insert(lorebookEntries)
                    .values({
                        gameId,
                        name: lore.name,
                        content: lore.content,
                        position: i,
                    });

                loreCount++;
            }

            await this.updateStatus(instanceId, {
                currentStep: "save-entities",
                stepsCompleted: 10,
                totalSteps: TOTAL_STEPS,
                message: `Saved ${characterCount} characters, ${npcCount} NPCs, ${stateCount} states, ${triggerCount} triggers, ${loreCount} lore entries`,
            });

            return {
                characterCount,
                npcCount,
                stateCount,
                triggerCount,
                loreCount,
                currentStep: "save-entities",
                stepsCompleted: 10,
                message: `Saved all entities`,
            };
        });

        // Step 11: Finalize game record
        await step.do("finalize-game", async () => {
            await gamesService.finalize(gameId, {
                title: metadata.title,
                description: metadata.description,
                worldDescription: metadata.worldDescription,
                objective: metadata.objective,
                firstPrompt: metadata.firstPrompt,
                authorStyle: metadata.authorStyle,
                turnInstructions: metadata.turnInstructions,
                summarizationInstructions: metadata.summarizationInstructions,
                victoryCondition: metadata.victoryCondition,
                defeatCondition: metadata.defeatCondition,
                imageInstructions: metadata.imageInstructions,
                previewImage: previewImages.previewKey ?? undefined,
                fullSizePreviewImage: previewImages.fullSizeKey ?? undefined,
                imageStyle: options.imageStyle,
            });

            await this.updateStatus(instanceId, {
                currentStep: "finalize-game",
                stepsCompleted: 11,
                totalSteps: TOTAL_STEPS,
                message: "Game finalized, indexing for search...",
            });

            return {
                currentStep: "finalize-game",
                stepsCompleted: 11,
                message: "Game finalized, indexing for search...",
            };
        });

        // Step 12: Vectorize game for semantic search
        await step.do("vectorize-game", async () => {
            // Generate embedding from title + description + background
            const searchText = [
                metadata.title,
                metadata.description,
                metadata.worldDescription,
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

            await this.updateStatus(instanceId, {
                currentStep: "complete",
                stepsCompleted: 12,
                totalSteps: TOTAL_STEPS,
                message: "Game generation complete!",
                status: "complete",
                gameId,
            });

            return {
                currentStep: "vectorize-game",
                stepsCompleted: 12,
                message: "Game indexed for search!",
            };
        });

        // Return final result
        return {
            gameId,
            title: metadata.title,
            characterCount: savedEntities.characterCount,
            npcCount: savedEntities.npcCount,
            stateCount: savedEntities.stateCount,
            triggerCount: savedEntities.triggerCount,
            loreCount: savedEntities.loreCount,
            hasPreviewImage: !!previewImages.previewKey,
            progress: {
                currentStep: "complete",
                stepsCompleted: 12,
                totalSteps: TOTAL_STEPS,
                message: "Game generation complete!",
            },
        };
    }

    private async updateStatus(instanceId: string, statusUpdate: {
        currentStep: string;
        stepsCompleted: number;
        totalSteps?: number;
        message: string;
        gameId?: string;
        status?: "running" | "complete" | "errored";
    }) {
        try {
            const statusStub = this.env.GENERATION_STATUS.get(
                this.env.GENERATION_STATUS.idFromName(instanceId)
            );
            await statusStub.updateStatus(statusUpdate);
        } catch (error) {
            console.error("Failed to update status via DO:", error);
        }
    }
}
