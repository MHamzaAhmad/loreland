import { Agent } from "agents";
import { drizzle } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { eq, gt, desc, sql } from "drizzle-orm";
import { ToolLoopAgent, stepCountIs } from "ai";

// Import schemas and migrations from db package
import * as schema from "@packages/db/schema/agent";
import migrations from "@packages/db/migrations/agent";
import type { CharacterStateSnapshot } from "@packages/db/schema/agent";

// Local imports
import { loadPrompt } from "./prompt-loader";
import type { GameSessionState, FullGameConfig, AgentDB } from "./types";
import {
    analyzeOpeningTool,
    analyzeTurnTool,
    suggestActionsTool,
    describeSceneTool,
} from "./tools";

// ============================================================================
// AGENT FACTORIES
// ============================================================================

/**
 * Create the Game Logic Agent for analyzing turns
 */
function createGameLogicAgent(model: string, instructions: string) {
    return new ToolLoopAgent({
        model: model,
        instructions,
        tools: {
            analyzeTurn: analyzeTurnTool,
            analyzeOpening: analyzeOpeningTool,
        },
        toolChoice: "required",
        stopWhen: stepCountIs(5),
    });
}

/**
 * Create the Narrator Agent for generating narratives
 */
function createNarratorAgent(model: string, instructions: string) {
    return new ToolLoopAgent({
        model: model,
        instructions,
        tools: {
            suggestActions: suggestActionsTool,
            describeScene: describeSceneTool,
        },
        stopWhen: stepCountIs(5),
    });
}

// ============================================================================
// PLAY AGENT (Durable Object)
// ============================================================================

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
        model: string = "google/gemini-2.5-flash"
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
            currentTurn: -1,
        });

        // Generate opening scenario
        return this.generateOpeningTurn(gameConfig, model);
    }

    /**
     * Generate the opening turn with scenario and objective
     */
    private async generateOpeningTurn(gameConfig: FullGameConfig, model: string) {
        const character = gameConfig.characters.find(c => c.id === this.state.characterId);

        // STEP 1: Analyze the opening with Game Logic Agent
        const analysisPrompt = loadPrompt("opening-analysis", {
            gameTitle: gameConfig.title,
            background: gameConfig.background,
            objective: gameConfig.objective,
            characterName: character?.name || "Unknown",
            characterDescription: character?.description || "No description",
        });

        const logicAgent = createGameLogicAgent(model, analysisPrompt);
        const analysisResult = await logicAgent.generate({
            prompt: "Analyze the opening situation. What is the immediate goal? What are the starting conditions?",
        });

        // Extract analysis from tool calls
        const analysisToolCall = analysisResult.steps
            .flatMap(s => s.toolResults)
            .find(t => t.toolName === "analyzeOpening");

        const analysis = analysisToolCall?.output as {
            immediateGoal: string;
            startingSituation: string;
            keyFacts: string[];
        } | undefined;

        const agentThought = analysis
            ? `Goal: ${analysis.immediateGoal}. Situation: ${analysis.startingSituation}. Facts: ${analysis.keyFacts.join(", ")}`
            : "Opening sequence initialization.";

        // STEP 2: Generate Narrative with Narrator Agent
        const narrativePrompt = loadPrompt("opening-narrative", {
            gameTitle: gameConfig.title,
            background: gameConfig.background,
            characterName: character?.name || "Unknown",
            analysis: agentThought,
        });

        const narratorAgent = createNarratorAgent(model, narrativePrompt);
        const narrativeResult = await narratorAgent.generate({
            prompt: "Begin the adventure. WRITE THE NARRATIVE FIRST.",
        });

        const text = narrativeResult.text || "The simulation is online. Systems nominal.";

        // Extract tool results
        const allToolResults = narrativeResult.steps.flatMap(s => s.toolResults);

        const suggestActionsResult = allToolResults.find(t => t.toolName === "suggestActions");
        let suggestedActions = (suggestActionsResult?.output as { actions: string[] } | undefined)?.actions || [
            "Look around",
            "Check inventory",
            "Move forward",
        ];

        const scenePromptResult = allToolResults.find(t => t.toolName === "describeScene");
        const scenePrompt = (scenePromptResult?.output as { scenePrompt: string } | undefined)?.scenePrompt;

        // Save turn 0 (opening)
        const [insertedTurn] = await this.db.insert(schema.turns).values({
            turnNumber: 0,
            userMessage: "[GAME START]",
            assistantResponse: text,
            agentThought: agentThought,
            suggestedActions,
            characterState: { health: 100, skillModifiers: {} },
            turnOutcome: { analysis },
        }).returning();

        this.setState({ ...this.state, currentTurn: 0 });

        // Generate scene image
        let sceneImageKey: string | undefined;
        if (scenePrompt) {
            try {
                sceneImageKey = await this.generateSceneImage(this.state.sessionId, 0, scenePrompt, character?.description);
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
            .limit(5);

        const lastTurn = recentTurns[0];

        // STEP 1: Analyze Turn with Game Logic Agent
        const analysisPrompt = loadPrompt("turn-analysis", {
            gameTitle: gameConfig.title,
            health: String(charState.health),
            skills: JSON.stringify(charState.skillModifiers),
            context: lastTurn?.agentThought || "Unknown",
            userAction: userMessage,
        });

        const logicAgent = createGameLogicAgent(model, analysisPrompt);
        const analysisResult = await logicAgent.generate({
            prompt: `Analyze the user's action: "${userMessage}"`,
        });

        // Extract analysis from tool results
        const analysisToolCall = analysisResult.steps
            .flatMap(s => s.toolResults)
            .find(t => t.toolName === "analyzeTurn");

        const analysis = analysisToolCall?.output as {
            feasibility: string;
            outcome: string;
            reasoning: string;
            worldUpdates: string[];
            healthChange: number;
            skillUpdates: Record<string, number>;
        } | undefined;

        const agentThought = analysis
            ? `[${analysis.outcome.toUpperCase()}] ${analysis.reasoning}. Facts: ${analysis.worldUpdates.join(", ")}`
            : "Processing user action...";

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

        // STEP 2: Generate Narrative with Narrator Agent
        const narrativePrompt = loadPrompt("turn-narrative", {
            gameTitle: gameConfig.title,
            userAction: userMessage,
            analysis: agentThought,
            outcome: analysis?.outcome || "standard",
            worldUpdates: analysis?.worldUpdates.join(", ") || "None",
        });

        const narratorAgent = createNarratorAgent(model, narrativePrompt);
        const narrativeResult = await narratorAgent.generate({
            prompt: `Narrate the outcome of: "${userMessage}"`,
        });

        const text = narrativeResult.text || "The action was processed.";

        // Extract tool results
        const allToolResults = narrativeResult.steps.flatMap(s => s.toolResults);

        const suggestActionsResult = allToolResults.find(t => t.toolName === "suggestActions");
        let suggestedActions = (suggestActionsResult?.output as { actions: string[] } | undefined)?.actions || [
            "Continue",
            "Look closer",
            "Assess situation",
        ];

        const scenePromptResult = allToolResults.find(t => t.toolName === "describeScene");
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
                const character = gameConfig.characters.find(c => c.id === this.state.characterId);
                sceneImageKey = await this.generateSceneImage(this.state.sessionId, newTurnNumber, scenePrompt, character?.description);
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
     * Generate a rolling summary of the story
     */
    private async generateSummary(model: string) {
        const allTurns = await this.db.select()
            .from(schema.turns)
            .orderBy(schema.turns.turnNumber);

        const existingSummary = await this.db.select().from(schema.summary).limit(1);

        const recentEvents = allTurns.slice(-5).map(t =>
            `Player: ${t.userMessage}\nGame Master: ${t.assistantResponse}`
        ).join("\n\n");

        const summaryPrompt = loadPrompt("summary", {
            previousSummary: existingSummary.length ? existingSummary[0].content : undefined,
            recentEvents,
        });

        const summaryAgent = new ToolLoopAgent({
            model,
            instructions: summaryPrompt,
            stopWhen: stepCountIs(1), // Summary is a single-shot
        });

        const result = await summaryAgent.generate({
            prompt: "Provide an updated summary of the entire story so far (max 500 words).",
        });

        const summaryText = result.text;

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
        await this.db.delete(schema.turns).where(gt(schema.turns.turnNumber, turnNumber));

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
            currentTurn: this.state?.currentTurn ?? -1,
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
        scenePrompt: string,
        characterDescription?: string | null
    ): Promise<string> {
        const style = "cinematic fantasy illustration, dramatic lighting, detailed environment, digital art";
        let prompt = `${style}, ${scenePrompt}`;

        if (characterDescription) {
            prompt += `, Character appearance: ${characterDescription}`;
        }

        const response = await this.env.AI.run(
            "@cf/black-forest-labs/flux-1-schnell",
            {
                prompt,
                width: 1024,
                height: 576,
                steps: 4,
            }
        );

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

        const key = `sessions/${sessionId}/turns/${turnNumber}/scene.png`;
        await this.env.IMAGES.put(key, imageData, {
            httpMetadata: { contentType: "image/png" },
        });

        return key;
    }
}
