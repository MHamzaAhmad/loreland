import { Agent } from "agents";
import { drizzle } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { eq, gt, desc, sql } from "drizzle-orm";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getLanguageModel } from "../lib/ai-config";

// Import schemas and migrations from db package
import * as schema from "@packages/db/schema/agent";
import migrations from "@packages/db/migrations/agent";

// Types for character state snapshot
import type { CharacterStateSnapshot } from "@packages/db/schema/agent";

interface GameSessionState {
    sessionId: string;
    gameId: string;
    characterId: string;
    currentTurn: number;
}

interface FullGameConfig {
    id: string;
    title: string;
    description: string;
    background: string;
    instructions: string;
    objective: string;
    characters: Array<{
        id: string;
        name: string;
        description: string | null;
    }>;
    npcs: Array<{
        id: string;
        name: string;
        detail?: string | null;
    }>;
    skills: Array<{
        id: string;
        name: string;
    }>;
    lorebookEntries: Array<{
        id: string;
        name: string;
        content: string;
    }>;
    trackedItems: Array<{
        id: string;
        name: string;
        description?: string | null;
    }>;
}

type AgentDB = ReturnType<typeof drizzle<typeof schema>>;

export class PlayAgent extends Agent<Cloudflare.Env, GameSessionState> {
    private db!: AgentDB;

    constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
        super(ctx, env);

        // Initialize Drizzle with durable-sqlite driver
        this.db = drizzle(ctx.storage, { schema });

        // Run migrations on agent wake-up
        ctx.blockConcurrencyWhile(async () => {
            migrate(this.db, migrations);
        });
    }

    /**
     * Initialize a new game session
     */
    async startGame(
        sessionId: string,
        gameConfig: FullGameConfig,
        characterId: string,
        model: string = "gemini-2.0-flash"
    ) {
        // Store game config in SQLite
        await this.db.insert(schema.gameSession).values({
            sessionId,
            gameId: gameConfig.id,
            characterId,
            model,
            config: gameConfig as unknown as string,
        });

        // Initialize character state
        await this.db.insert(schema.characterState).values({
            characterId,
            health: 100,
            skillModifiers: {},
        });

        // Set initial state
        this.setState({
            sessionId,
            gameId: gameConfig.id,
            characterId,
            currentTurn: 0,
        });

        // Generate opening scenario
        return this.generateOpeningTurn(gameConfig, model);
    }

    /**
     * Generate the opening turn with scenario and objective
     */
    private async generateOpeningTurn(gameConfig: FullGameConfig, model: string) {
        const character = gameConfig.characters.find(c => c.id === this.state.characterId);

        const systemPrompt = `You are the Game Master for "${gameConfig.title}".

SETTING:
${gameConfig.background}

OBJECTIVE:
${gameConfig.objective}

INSTRUCTIONS:
${gameConfig.instructions}

PLAYER CHARACTER:
Name: ${character?.name || "Unknown"}
Description: ${character?.description || "No description"}

Your role is to:
1. Present the opening scenario
2. Describe the current situation vividly
3. Always suggest 3 possible actions for the player at the end

Respond in a narrative style, immersing the player in the world.`;

        const result = await streamText({
            model: getLanguageModel(model),
            system: systemPrompt,
            prompt: "Begin the adventure. Present the opening scenario and the player's current situation.",
            tools: {
                suggestActions: tool({
                    description: "Suggest 3 possible actions for the player",
                    inputSchema: z.object({
                        actions: z.array(z.string()).length(3).describe("Three possible actions"),
                    }),
                    execute: async (args) => args,
                }),
            },
        });

        const text = await result.text;
        const toolResults = await result.toolResults;
        const suggestActionsResult = toolResults?.find(tc => tc.toolName === "suggestActions");
        const suggestedActions = (suggestActionsResult?.output as { actions: string[] } | undefined)?.actions || [];

        // Save turn 0 (opening)
        await this.db.insert(schema.turns).values({
            turnNumber: 0,
            userMessage: "[GAME START]",
            assistantResponse: text,
            suggestedActions,
            characterState: { health: 100, skillModifiers: {} },
        });

        this.setState({ ...this.state, currentTurn: 0 });

        return {
            text,
            suggestedActions,
            characterState: { health: 100, skillModifiers: {} },
            turnNumber: 0,
        };
    }

    /**
     * Handle WebSocket messages
     */
    async onMessage(connection: WebSocket, message: string | ArrayBuffer) {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case "turn":
                    const response = await this.processUserTurn(data.message);
                    connection.send(JSON.stringify({
                        type: "response",
                        ...response,
                    }));
                    break;

                case "get_state":
                    const state = await this.getGameState();
                    connection.send(JSON.stringify({ type: "state", ...state }));
                    break;

                case "get_turns":
                    const turns = await this.getTurns();
                    connection.send(JSON.stringify({ type: "turns", turns }));
                    break;

                default:
                    connection.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
            }
        } catch (error) {
            connection.send(JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            }));
        }
    }

    /**
     * Process a user turn and generate AI response
     */
    async processUserTurn(userMessage: string) {
        const session = await this.db.select().from(schema.gameSession).limit(1);
        if (!session.length) throw new Error("No game session found");

        const charStateRows = await this.db.select().from(schema.characterState).limit(1);
        if (!charStateRows.length) throw new Error("No character state found");

        const charState = charStateRows[0];
        const gameConfig = session[0].config as unknown as FullGameConfig;
        const model = session[0].model;

        const recentTurns = await this.db.select()
            .from(schema.turns)
            .orderBy(desc(schema.turns.turnNumber))
            .limit(5);

        const summaryRows = await this.db.select().from(schema.summary).limit(1);
        const gameSummary = summaryRows[0]?.content;

        const character = gameConfig.characters.find(c => c.id === session[0].characterId);

        // Build system prompt
        const systemPrompt = this.buildSystemPrompt(gameConfig, charState, gameSummary, character);

        // Build conversation history
        const messages = recentTurns.reverse().flatMap(turn => [
            { role: "user" as const, content: turn.userMessage },
            { role: "assistant" as const, content: turn.assistantResponse },
        ]);

        const result = await streamText({
            model: getLanguageModel(model),
            system: systemPrompt,
            messages: [...messages, { role: "user" as const, content: userMessage }],
            tools: {
                suggestActions: tool({
                    description: "Suggest 3 possible actions for the player",
                    inputSchema: z.object({
                        actions: z.array(z.string()).length(3),
                    }),
                    execute: async (args) => args,
                }),
                updateCharacterState: tool({
                    description: "Update character health or skills based on action outcome",
                    inputSchema: z.object({
                        healthChange: z.number().optional().describe("Change in health points (can be negative)"),
                        skillModifiers: z.record(z.number()).optional().describe("Skill modifier changes"),
                        reason: z.string().describe("Reason for the state change"),
                    }),
                    execute: async (args) => args,
                }),
                describeScene: tool({
                    description: "Generate a visual description of the current scene for image generation. Call this after describing the scene in the narrative.",
                    inputSchema: z.object({
                        scenePrompt: z.string().describe("Detailed visual description: environment, lighting, mood, key elements. Max 100 words."),
                    }),
                    execute: async (args) => args,
                }),
            },
        });

        const text = await result.text;
        const toolResults = await result.toolResults;

        // Extract tool results using output property
        const suggestActionsResult = toolResults?.find(tc => tc.toolName === "suggestActions");
        const suggestedActions = (suggestActionsResult?.output as { actions: string[] } | undefined)?.actions || [];

        const stateUpdateResult = toolResults?.find(tc => tc.toolName === "updateCharacterState");
        const stateUpdate = stateUpdateResult?.output as {
            healthChange?: number;
            skillModifiers?: Record<string, number>;
        } | undefined;

        // Apply character state changes
        let newHealth = charState.health;
        let newModifiers = (charState.skillModifiers || {}) as Record<string, number>;

        if (stateUpdate) {
            if (stateUpdate.healthChange) {
                newHealth = Math.max(0, Math.min(100, charState.health + stateUpdate.healthChange));
            }
            if (stateUpdate.skillModifiers) {
                newModifiers = { ...newModifiers, ...stateUpdate.skillModifiers };
            }

            await this.db.update(schema.characterState)
                .set({
                    health: newHealth,
                    skillModifiers: newModifiers,
                    updatedAt: sql`(unixepoch())`,
                })
                .where(eq(schema.characterState.id, 1));
        }

        // Save turn (initially without scene image)
        const newTurnNumber = this.state.currentTurn + 1;
        const [insertedTurn] = await this.db.insert(schema.turns).values({
            turnNumber: newTurnNumber,
            userMessage,
            assistantResponse: text,
            suggestedActions,
            characterState: { health: newHealth, skillModifiers: newModifiers },
        }).returning();

        this.setState({ ...this.state, currentTurn: newTurnNumber });

        // Extract scene prompt from tool results
        const scenePromptResult = toolResults?.find(tc => tc.toolName === "describeScene");
        const scenePrompt = (scenePromptResult?.output as { scenePrompt: string } | undefined)?.scenePrompt;

        // Generate scene image asynchronously (don't block the response)
        let sceneImageKey: string | undefined;
        if (scenePrompt) {
            try {
                sceneImageKey = await this.generateSceneImage(this.state.sessionId, newTurnNumber, scenePrompt);
                // Update turn with scene image key
                await this.db.update(schema.turns)
                    .set({ sceneImageKey })
                    .where(eq(schema.turns.id, insertedTurn.id));
            } catch (error) {
                console.error("Failed to generate scene image:", error);
            }
        }

        // Generate summary every 5 turns
        if (newTurnNumber % 5 === 0) {
            await this.generateSummary(model);
        }

        return {
            text,
            suggestedActions,
            characterState: { health: newHealth, skillModifiers: newModifiers },
            turnNumber: newTurnNumber,
            sceneImageKey,
        };
    }

    /**
     * Build system prompt with context
     */
    private buildSystemPrompt(
        gameConfig: FullGameConfig,
        charState: typeof schema.characterState.$inferSelect,
        summary: string | undefined,
        character: FullGameConfig["characters"][0] | undefined
    ) {
        return `You are the Game Master for "${gameConfig.title}".

SETTING:
${gameConfig.background}

OBJECTIVE:
${gameConfig.objective}

INSTRUCTIONS:
${gameConfig.instructions}

PLAYER CHARACTER:
Name: ${character?.name || "Unknown"}
Description: ${character?.description || "No description"}

CURRENT CHARACTER STATE:
Health: ${charState.health}/100
Skill Modifiers: ${JSON.stringify(charState.skillModifiers)}

${summary ? `STORY SO FAR:\n${summary}\n` : ""}

NPCs in this world:
${gameConfig.npcs.map(npc => `- ${npc.name}: ${npc.detail || "No details"}`).join("\n")}

Your role as Game Master:
1. Respond to player actions narratively
2. Consider the player's character abilities and current state
3. Apply consequences (health changes, skill checks) when appropriate
4. Always suggest 3 possible actions at the end of your response
5. Keep the story engaging and consistent with the world

Use the updateCharacterState tool when actions result in damage, healing, or skill changes.
Use the suggestActions tool to provide 3 possible next actions.`;
    }

    /**
     * Generate a rolling summary of the story
     */
    private async generateSummary(model: string) {
        const allTurns = await this.db.select()
            .from(schema.turns)
            .orderBy(schema.turns.turnNumber);

        const existingSummary = await this.db.select().from(schema.summary).limit(1);

        const result = await streamText({
            model: getLanguageModel(model),
            system: "You are a story summarizer. Create a concise summary of the events that maintains important plot points, character developments, and key decisions.",
            prompt: `${existingSummary.length ? `Previous summary:\n${existingSummary[0].content}\n\nNew events:\n` : ""}${allTurns.slice(-5).map(t => `Player: ${t.userMessage}\nGame Master: ${t.assistantResponse}`).join("\n\n")}

Provide an updated summary of the entire story so far (max 500 words).`,
        });

        const summaryText = await result.text;

        if (existingSummary.length) {
            await this.db.update(schema.summary)
                .set({ content: summaryText, lastTurn: this.state.currentTurn, updatedAt: sql`(unixepoch())` })
                .where(eq(schema.summary.id, 1));
        } else {
            await this.db.insert(schema.summary).values({
                content: summaryText,
                lastTurn: this.state.currentTurn,
            });
        }
    }

    /**
     * Rewind to a previous turn
     */
    async rewindToTurn(turnNumber: number) {
        // Delete all turns after the specified turn
        await this.db.delete(schema.turns).where(gt(schema.turns.turnNumber, turnNumber));

        // Restore character state from that turn's snapshot
        const turnRows = await this.db.select()
            .from(schema.turns)
            .where(eq(schema.turns.turnNumber, turnNumber))
            .limit(1);

        if (turnRows.length) {
            const snapshot = turnRows[0].characterState as CharacterStateSnapshot;
            await this.db.update(schema.characterState)
                .set({
                    health: snapshot.health,
                    skillModifiers: snapshot.skillModifiers,
                    updatedAt: sql`(unixepoch())`,
                })
                .where(eq(schema.characterState.id, 1));
        }

        this.setState({ ...this.state, currentTurn: turnNumber });

        return { success: true, currentTurn: turnNumber };
    }

    /**
     * Update the AI model for this session
     */
    async updateModel(model: string) {
        await this.db.update(schema.gameSession)
            .set({ model })
            .where(eq(schema.gameSession.id, 1));

        return { success: true, model };
    }

    /**
     * Get current game state
     */
    async getGameState() {
        const session = await this.db.select().from(schema.gameSession).limit(1);
        const charState = await this.db.select().from(schema.characterState).limit(1);
        const recentTurns = await this.db.select()
            .from(schema.turns)
            .orderBy(desc(schema.turns.turnNumber))
            .limit(5);

        return {
            currentTurn: this.state?.currentTurn ?? 0,
            characterState: charState.length ? {
                health: charState[0].health,
                skillModifiers: charState[0].skillModifiers,
            } : null,
            recentTurns: recentTurns.reverse(),
            model: session[0]?.model,
        };
    }

    /**
     * Get all turns
     */
    async getTurns() {
        return this.db.select()
            .from(schema.turns)
            .orderBy(schema.turns.turnNumber);
    }

    /**
     * Generate a scene image using Workers AI and store in R2
     */
    private async generateSceneImage(
        sessionId: string,
        turnNumber: number,
        scenePrompt: string
    ): Promise<string> {
        const style = "cinematic fantasy illustration, dramatic lighting, detailed environment, digital art";
        const prompt = `${style}, ${scenePrompt}`;

        // Use Workers AI Flux model for image generation
        const response = await this.env.AI.run(
            "@cf/black-forest-labs/flux-1-schnell",
            {
                prompt,
                width: 1024,
                height: 576, // 16:9 cinematic aspect ratio
                steps: 4,
            }
        );

        // Convert response to ArrayBuffer
        let imageData: ArrayBuffer;
        if (response instanceof ReadableStream) {
            const reader = response.getReader();
            const chunks: Uint8Array[] = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
            }
            imageData = result.buffer;
        } else if (typeof response === "object" && response !== null && "image" in response) {
            const base64String = (response as { image: string }).image;
            const binaryString = atob(base64String);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            imageData = bytes.buffer;
        } else {
            throw new Error("Unexpected AI response format");
        }

        // Upload to R2
        const key = `sessions/${sessionId}/turns/${turnNumber}/scene.png`;
        await this.env.IMAGES.put(key, imageData, {
            httpMetadata: { contentType: "image/png" },
        });

        return key;
    }
}

