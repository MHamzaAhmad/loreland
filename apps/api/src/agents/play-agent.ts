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

        // 1. Analyze the game config to determine initial state context
        const analysisSystemPrompt = `You are the Game Logic Engine for "${gameConfig.title}".
Analyze the game configuration and determine the starting state.

SETTING:
${gameConfig.background}

OBJECTIVE:
${gameConfig.objective}

PLAYER: ${character?.name || "Unknown"} (${character?.description || "No description"})`;

        const analysisResult = await streamText({
            model: getLanguageModel(model),
            system: analysisSystemPrompt,
            prompt: "Analyze the opening situation. What is the immediate goal? What are the starting conditions?",
            tools: {
                analyzeOpening: tool({
                    description: "Define the opening state analysis",
                    inputSchema: z.object({
                        immediateGoal: z.string().describe("The immediate short-term goal for the player based on the objective"),
                        startingSituation: z.string().describe("Concise technical description of the starting position/state"),
                        keyFacts: z.array(z.string()).describe("List of critical facts about the current scene (e.g., 'Door is locked', 'Guard is sleeping')"),
                    }),
                    execute: async (args) => args,
                }),
            },
        });

        const analysisTool = (await analysisResult.toolResults).find(t => t.toolName === "analyzeOpening");
        const analysis = analysisTool?.output as { immediateGoal: string; startingSituation: string; keyFacts: string[] } | undefined;
        const agentThought = analysis ? `Goal: ${analysis.immediateGoal}. Situation: ${analysis.startingSituation}. Facts: ${analysis.keyFacts.join(", ")}` : "Opening sequence initialization.";

        // 2. Generate Narrative based on analysis
        const narrratorSystemPrompt = `You are the Game Master for "${gameConfig.title}".
Your goal is to immerse the player in the world.
Use the Game Engine's analysis to guide your description.

SETTING: ${gameConfig.background}
PLAYER: ${character?.name}

Opening Analysis:
${agentThought}

Output Requirements:
1. Vividly describe the scene and atmosphere.
2. Clearly state the immediate situation.
3. Suggest 3 distinct actions.
`;

        const result = await streamText({
            model: getLanguageModel(model),
            system: narrratorSystemPrompt,
            prompt: "Begin the adventure. Describe the opening scene.",
            tools: {
                suggestActions: tool({
                    description: "Suggest 3 possible actions for the player",
                    inputSchema: z.object({
                        actions: z.array(z.string()).length(3).describe("Three possible actions"),
                    }),
                    execute: async (args) => args,
                }),
                describeScene: tool({
                    description: "Generate a visual description of the current scene for image generation.",
                    inputSchema: z.object({
                        scenePrompt: z.string().describe("Detailed visual description: environment, lighting, mood, key elements. Max 100 words."),
                    }),
                    execute: async (args) => args,
                }),
            },
        });

        const text = await result.text;
        const toolResults = await result.toolResults;
        const suggestActionsResult = toolResults?.find(tc => tc.toolName === "suggestActions");
        const suggestedActions = (suggestActionsResult?.output as { actions: string[] } | undefined)?.actions || [];

        const scenePromptResult = toolResults?.find(tc => tc.toolName === "describeScene");
        const scenePrompt = (scenePromptResult?.output as { scenePrompt: string } | undefined)?.scenePrompt;

        // Save turn 0 (opening)
        const [insertedTurn] = await this.db.insert(schema.turns).values({
            turnNumber: 0,
            userMessage: "[GAME START]",
            assistantResponse: text,
            agentThought: agentThought,
            suggestedActions,
            characterState: { health: 100, skillModifiers: {} },
            turnOutcome: { analysis }, // Store structured analysis in outcome
        }).returning();

        this.setState({ ...this.state, currentTurn: 0 });

        // Generate scene image
        let sceneImageKey: string | undefined;
        if (scenePrompt) {
            try {
                sceneImageKey = await this.generateSceneImage(this.state.sessionId, 0, scenePrompt);
                await this.db.update(schema.turns)
                    .set({ sceneImageKey })
                    .where(eq(schema.turns.id, insertedTurn.id));
            } catch (e) {
                console.error("Failed to generate scene image", e);
            }
        }

        return {
            text,
            suggestedActions,
            characterState: { health: 100, skillModifiers: {} },
            turnNumber: 0,
            sceneImageKey,
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

                case "rewind":
                    // Handle rewind request from WebSocket if needed, currently done via REST
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
        const charState = charStateRows[0];
        const gameConfig = session[0].config as unknown as FullGameConfig;
        const model = session[0].model;

        // Get context (previous turns)
        const recentTurns = await this.db.select()
            .from(schema.turns)
            .orderBy(desc(schema.turns.turnNumber))
            .limit(5); // Get last 5 turns for context

        // ------------------------------------------------------------------
        // STEP 1: ANALYSIS & OUTCOME DETERMINATION
        // ------------------------------------------------------------------
        const lastTurn = recentTurns[0]; // Most recent turn
        const previousContext = recentTurns.reverse().map(t =>
            `Turn ${t.turnNumber}: User: "${t.userMessage}" | Agent Thought: "${t.agentThought || 'N/A'}"`
        ).join("\n");

        const analysisSystemPrompt = `You are the Game Logic Engine for "${gameConfig.title}".
Your job is to VALIDATE the user's action against the current state and determine the OUTCOME.

CURRENT STATE:
Health: ${charState.health}/100
Skills: ${JSON.stringify(charState.skillModifiers)}
Location/Context: ${lastTurn?.agentThought || "Unknown"}

USER ACTION: "${userMessage}"

Analyze steps:
1. Is the action possible given the context?
2. Does it require a skill check?
3. What is the immediate physical/logical result? (Success, Failure, Partial)
4. Update facts about the world (e.g., "Door is now open").

Return the analysis using the 'analyzeTurn' tool.`;

        const analysisResult = await streamText({
            model: getLanguageModel(model),
            system: analysisSystemPrompt,
            prompt: `Analyze the user's action: "${userMessage}"`,
            tools: {
                analyzeTurn: tool({
                    description: "Report the analysis of the turn",
                    inputSchema: z.object({
                        feasibility: z.enum(["possible", "impossible", "difficult"]).describe("Can the user do this?"),
                        outcome: z.enum(["success", "failure", "partial_success", "critical_failure"]).describe("Result of the attempt"),
                        reasoning: z.string().describe("Internal logic for why this happened (physics, luck, skill)"),
                        worldUpdates: z.array(z.string()).describe("New facts about the world state"),
                        healthChange: z.number().describe("Health change (+/-)"),
                        skillUpdates: z.record(z.number()).describe("Changes to skill modifiers"),
                    }),
                    execute: async (args) => args,
                }),
            },
        });

        const analysisTool = (await analysisResult.toolResults).find(t => t.toolName === "analyzeTurn");
        const analysis = analysisTool?.output as {
            feasibility: string;
            outcome: string;
            reasoning: string;
            worldUpdates: string[];
            healthChange: number;
            skillUpdates: Record<string, number>
        } | undefined;

        const agentThought = analysis ?
            `[${analysis.outcome.toUpperCase()}] ${analysis.reasoning}. Facts: ${analysis.worldUpdates.join(", ")}` :
            "Processing user action...";

        // Update State based on Analysis
        let newHealth = charState.health;
        let newModifiers = (charState.skillModifiers || {}) as Record<string, number>;

        if (analysis) {
            newHealth = Math.max(0, Math.min(100, charState.health + analysis.healthChange));
            newModifiers = { ...newModifiers, ...analysis.skillUpdates };

            await this.db.update(schema.characterState)
                .set({
                    health: newHealth,
                    skillModifiers: newModifiers,
                    updatedAt: sql`(unixepoch())`,
                })
                .where(eq(schema.characterState.id, 1));
        }

        // ------------------------------------------------------------------
        // STEP 2: NARRATIVE GENERATION
        // ------------------------------------------------------------------
        const narrativeSystemPrompt = `You are the Game Master for "${gameConfig.title}".
Your goal is to narrate the outcome determined by the Logic Engine.

USER ACTION: "${userMessage}"

LOGIC ENGINE RESULT:
${agentThought}
Outcome Type: ${analysis?.outcome || "Standard"}

INSTRUCTIONS:
1. Narrate the outcome vividly. If it was a failure, explain why specifically.
2. Incorporate the world updates (${analysis?.worldUpdates.join(", ") || "None"}).
3. Describe the scene or changes in the environment.
4. Suggest 3 follow-up actions that make sense given the new state.

DO NOT contradict the Logic Engine's result.`;

        const result = await streamText({
            model: getLanguageModel(model),
            system: narrativeSystemPrompt,
            messages: [
                // We don't need full history here, just the immediate context + action
                // But providing a bit of recent dialogue helps style
                { role: "assistant", content: `(Previous Turn) ${lastTurn?.assistantResponse || "..."}` },
                { role: "user", content: userMessage }
            ],
            tools: {
                suggestActions: tool({
                    description: "Suggest 3 possible actions for the player",
                    inputSchema: z.object({
                        actions: z.array(z.string()).length(3),
                    }),
                    execute: async (args) => args,
                }),
                describeScene: tool({
                    description: "Generate a visual description of the current scene for image generation.",
                    inputSchema: z.object({
                        scenePrompt: z.string().describe("Detailed visual description: environment, lighting, mood, key elements. Max 100 words."),
                    }),
                    execute: async (args) => args,
                }),
            },
        });

        const text = await result.text;
        const toolResults = await result.toolResults;

        const suggestActionsResult = toolResults?.find(tc => tc.toolName === "suggestActions");
        const suggestedActions = (suggestActionsResult?.output as { actions: string[] } | undefined)?.actions || [];

        const scenePromptResult = toolResults?.find(tc => tc.toolName === "describeScene");
        const scenePrompt = (scenePromptResult?.output as { scenePrompt: string } | undefined)?.scenePrompt;

        // Save turn
        const newTurnNumber = this.state.currentTurn + 1;
        const [insertedTurn] = await this.db.insert(schema.turns).values({
            turnNumber: newTurnNumber,
            userMessage,
            assistantResponse: text,
            agentThought: agentThought,
            suggestedActions,
            characterState: { health: newHealth, skillModifiers: newModifiers },
            turnOutcome: { analysis },
        }).returning();

        this.setState({ ...this.state, currentTurn: newTurnNumber });

        // Generate scene image asynchronously
        let sceneImageKey: string | undefined;
        if (scenePrompt) {
            try {
                sceneImageKey = await this.generateSceneImage(this.state.sessionId, newTurnNumber, scenePrompt);
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
            agentThought,
        };
    }

    /**
     * Build system prompt with context (Unused in new flow but kept as helper if needed)
     */
    private buildSystemPrompt(
        gameConfig: FullGameConfig,
        charState: typeof schema.characterState.$inferSelect,
        summary: string | undefined,
        character: FullGameConfig["characters"][0] | undefined
    ) {
        // ... helper logic ...
        return "";
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

