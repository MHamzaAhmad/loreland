import { Agent } from "agents";
import { drizzle } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { eq, desc, sql } from "drizzle-orm";
import { ToolLoopAgent, Output, stepCountIs } from "ai";

// Import schemas and migrations from db package
import * as schema from "@packages/db/schema/agent";
import migrations from "@packages/db/migrations/agent";
import type { CharacterStateSnapshot } from "@packages/db/schema/agent";

// Local imports
import { loadPrompt } from "./prompt-loader";
import { turnOutputSchema, openingOutputSchema } from "./schemas";
import { getLanguageModel } from "../lib/ai-config";
import type { GameSessionState, FullGameConfig, AgentDB } from "./types";

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
        model: string = "nova-flash"
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

        // Build opening prompt with all game context
        const systemPrompt = loadPrompt("opening", {
            gameTitle: gameConfig.title,
            background: gameConfig.background,
            objective: gameConfig.objective,
            instructions: gameConfig.instructions,
            characterName: character?.name || "Unknown",
            characterDescription: character?.description || "No description",
        });

        // Single agent with structured output - pass model string directly
        const agent = new ToolLoopAgent({
            model: getLanguageModel(model),
            instructions: systemPrompt,
            output: Output.object({ schema: openingOutputSchema }),
            stopWhen: stepCountIs(3),
        });

        const result = await agent.generate({
            prompt: "Generate the opening scenario for this adventure.",
        });

        const output = result.output;
        if (!output) {
            throw new Error("Failed to generate opening scenario");
        }

        const agentThought = `Goal: ${output.immediateGoal}. Facts: ${output.startingFacts.join(", ")}`;

        // Save turn 0 (opening)
        const [insertedTurn] = await this.db.insert(schema.turns).values({
            turnNumber: 0,
            userMessage: "[GAME START]",
            assistantResponse: output.narrative,
            agentThought,
            suggestedActions: output.suggestedActions,
            characterState: { health: 100, skillModifiers: {} },
            turnOutcome: { startingFacts: output.startingFacts, immediateGoal: output.immediateGoal },
        }).returning();

        this.setState({ ...this.state, currentTurn: 0 });

        // Generate scene image asynchronously (non-blocking)
        this.ctx.waitUntil(
            this.generateAndBroadcastImage(insertedTurn.id, 0, output.scenePrompt, character?.description)
        );

        // Notify clients that image is being generated
        this.broadcastMessage({
            type: "turn_image_generating",
            turnNumber: 0,
        });

        return {
            text: output.narrative,
            suggestedActions: output.suggestedActions,
            characterState: { health: 100, skillModifiers: {} },
            turnNumber: 0,
            immediateGoal: output.immediateGoal,
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
        const character = gameConfig.characters.find(c => c.id === this.state.characterId);

        // Get context (previous turns)
        const recentTurns = await this.db.select()
            .from(schema.turns)
            .orderBy(desc(schema.turns.turnNumber))
            .limit(5);

        // Get summary if exists
        const summaryRows = await this.db.select().from(schema.summary).limit(1);
        const summary = summaryRows[0]?.content;

        // Build recent context string
        const recentContext = recentTurns.reverse().map(t =>
            `Turn ${t.turnNumber}:\nPlayer: ${t.userMessage}\nGame Master: ${t.assistantResponse}`
        ).join("\n\n");

        // Build current facts from last turn
        const lastTurn = recentTurns[0];
        const currentFacts = lastTurn?.turnOutcome
            ? JSON.stringify(lastTurn.turnOutcome)
            : "Starting conditions";

        // Build system prompt with full context
        const systemPrompt = loadPrompt("game-master", {
            gameTitle: gameConfig.title,
            background: gameConfig.background,
            objective: gameConfig.objective,
            instructions: gameConfig.instructions,
            characterName: character?.name || "Unknown",
            characterDescription: character?.description || "No description",
            health: String(charState.health),
            skills: JSON.stringify(charState.skillModifiers || {}),
            currentFacts,
            summary: summary || "",
            recentContext,
        });

        // Single agent with structured output
        const agent = new ToolLoopAgent({
            model: getLanguageModel(model),
            instructions: systemPrompt,
            output: Output.object({ schema: turnOutputSchema }),
            stopWhen: stepCountIs(3),
        });

        const result = await agent.generate({
            prompt: `The player's action: "${userMessage}"`,
        });

        const output = result.output;
        if (!output) {
            throw new Error("Failed to generate turn response");
        }

        // Apply state changes
        const newHealth = Math.max(0, Math.min(100, charState.health + output.outcome.healthChange));
        const newModifiers = { ...(charState.skillModifiers as Record<string, number> || {}), ...output.outcome.skillUpdates };

        await this.db.update(schema.characterState)
            .set({
                health: newHealth,
                skillModifiers: newModifiers,
                updatedAt: sql`(unixepoch())`,
            })
            .where(eq(schema.characterState.id, 1));

        // Save turn
        const newTurnNumber = this.state.currentTurn + 1;
        const [insertedTurn] = await this.db.insert(schema.turns).values({
            turnNumber: newTurnNumber,
            userMessage,
            assistantResponse: output.narrative,
            agentThought: `[${output.outcome.success.toUpperCase()}] ${output.outcome.reasoning}`,
            suggestedActions: output.suggestedActions,
            characterState: { health: newHealth, skillModifiers: newModifiers },
            turnOutcome: {
                outcome: output.outcome,
                worldUpdates: output.outcome.worldUpdates,
                gameStatus: output.gameStatus,
            },
        }).returning();

        this.setState({ ...this.state, currentTurn: newTurnNumber });

        // Generate scene image asynchronously (non-blocking)
        this.ctx.waitUntil(
            this.generateAndBroadcastImage(insertedTurn.id, newTurnNumber, output.scenePrompt, character?.description)
        );

        // Notify clients that image is being generated
        this.broadcastMessage({
            type: "turn_image_generating",
            turnNumber: newTurnNumber,
        });

        // Generate summary every 5 turns
        if (newTurnNumber % 5 === 0) {
            this.ctx.waitUntil(this.generateSummary(model));
        }

        return {
            text: output.narrative,
            suggestedActions: output.suggestedActions,
            characterState: { health: newHealth, skillModifiers: newModifiers },
            turnNumber: newTurnNumber,
            gameStatus: output.gameStatus,
            outcome: output.outcome.success,
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
            model: getLanguageModel(model),
            instructions: summaryPrompt,
            stopWhen: stepCountIs(1),
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
        const { gt } = await import("drizzle-orm");
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
     * Broadcast a message to all connected WebSocket clients
     */
    private broadcastMessage(message: Record<string, unknown>) {
        const connections = this.getConnections();
        const payload = JSON.stringify(message);
        for (const conn of connections) {
            try {
                conn.send(payload);
            } catch {
                // Connection might be closed
            }
        }
    }

    /**
     * Generate scene image and broadcast when complete
     */
    private async generateAndBroadcastImage(
        turnId: string,
        turnNumber: number,
        scenePrompt: string,
        characterDescription?: string | null
    ) {
        try {
            const sceneImageKey = await this.generateSceneImage(
                this.state.sessionId,
                turnNumber,
                scenePrompt,
                characterDescription
            );

            // Update turn with image key
            await this.db.update(schema.turns)
                .set({ sceneImageKey })
                .where(eq(schema.turns.id, turnId));

            // Broadcast to all clients
            this.broadcastMessage({
                type: "turn_image_ready",
                turnNumber,
                sceneImageKey,
            });
        } catch (error) {
            console.error("Failed to generate scene image:", error);
            // Optionally broadcast error
            this.broadcastMessage({
                type: "turn_image_error",
                turnNumber,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
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
        // Create immersive third-person scene with character visible
        const style = "cinematic fantasy illustration, third-person view, dramatic composition, detailed environment, atmospheric lighting, digital art masterpiece";

        let prompt = `${style}, ${scenePrompt}`;

        if (characterDescription) {
            // Include character in the scene from third-person perspective
            prompt += `. In the scene: a figure matching this description - ${characterDescription} - shown from behind or side angle, interacting with the environment`;
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
