import { Agent } from "agents";
import { drizzle as drizzleSqlite } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, sql } from "drizzle-orm";
import { ToolLoopAgent, Output, stepCountIs } from "ai";

// Import schemas and migrations from db package
import * as schema from "@packages/db/schema/agent";
import * as d1Schema from "@packages/db/schema/d1";
import migrations from "@packages/db/migrations/agent";

// Local imports
import { loadPrompt } from "./prompt-loader";
import { turnOutputSchema } from "./schemas";
import { createOpenRouterClient, getOpenRouterModel } from "../lib/openrouter";
import { getImageModelConfig, getDefaultImageModel } from "../lib/image-models";
import { CreditsService } from "../services/credits";
import { buildTurnCost } from "../lib/turn-cost";
import type { GameSessionState, FullGameConfig, AgentDB } from "./types";

// ============================================================================
// PLAY AGENT (Durable Object)
// ============================================================================

export class PlayAgent extends Agent<Cloudflare.Env, GameSessionState> {
    private db!: AgentDB;

    constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
        super(ctx, env);

        // Initialize Drizzle with durable-sqlite driver
        this.db = drizzleSqlite(ctx.storage, { schema });

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
        model: string = "nova-flash",
        imageModel: string = "prism-flash",
        playerId: string,
        creatorId: string
    ) {
        await this.db.insert(schema.gameSession).values({
            sessionId,
            gameId: gameConfig.id,
            characterId,
            model,
            imageModel,
            config: gameConfig as unknown as string,
        });

        // Initialize session states from game config
        if (gameConfig.states && gameConfig.states.length > 0) {
            for (const state of gameConfig.states) {
                await this.db.insert(schema.sessionStates).values({
                    stateId: state.id,
                    name: state.name,
                    value: state.initialValue || "",
                    dataType: (state.dataType as "text" | "number" | "boolean") || "text",
                    visibility: (state.visibility as "visible" | "hidden" | "conditional") || "visible",
                    displayCondition: state.displayCondition || null,
                    description: state.description || null,
                });
            }
        }

        // Initialize session triggers from game config
        if (gameConfig.triggers && gameConfig.triggers.length > 0) {
            for (const trigger of gameConfig.triggers) {
                await this.db.insert(schema.sessionTriggers).values({
                    triggerId: trigger.id,
                    name: trigger.name,
                    condition: trigger.condition,
                    effect: trigger.effect,
                    triggerOnTurn: trigger.triggerOnTurn || null,
                    oneShot: trigger.oneShot || false,
                    fired: false,
                });
            }
        }

        // Set initial state (currentTurn 0 so first processUserTurn increments to 1)
        this.setState({
            sessionId,
            gameId: gameConfig.id,
            characterId,
            currentTurn: 0,
            playerId,
            creatorId,
        });

        // Use firstPrompt as the opening action and process like any other turn
        return this.processUserTurn(gameConfig.firstPrompt || "Begin the adventure.");
    }

    /**
     * Get D1 database connection for credits service
     */
    private getD1DB() {
        return drizzle(this.env.DB, { schema: d1Schema });
    }

    /**
     * Check if player has enough credits to play
     */
    private async checkCredits(): Promise<{
        hasEnough: boolean;
        balance: number;
        required: number;
    }> {
        const d1Db = this.getD1DB();
        const creditsService = new CreditsService(d1Db, this.env);
        const balance = await creditsService.getBalance(this.state.playerId);
        const config = creditsService.getConfig();

        return {
            hasEnough: balance >= config.minBalance.toPlay,
            balance,
            required: config.minBalance.toPlay,
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
                    // Check credits before processing
                    const creditsCheck = await this.checkCredits();
                    if (!creditsCheck.hasEnough) {
                        connection.send(JSON.stringify({
                            type: "error",
                            message: `Insufficient credits. You have ${creditsCheck.balance} credits. Need ${creditsCheck.required}.`,
                            code: "INSUFFICIENT_CREDITS",
                            currentBalance: creditsCheck.balance,
                            required: creditsCheck.required,
                        }));
                        break;
                    }

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
     * Get states formatted for prompt
     */
    private async getStatesForPrompt(): Promise<Record<string, string>> {
        const stateRows = await this.db.select().from(schema.sessionStates);
        const result: Record<string, string> = {};
        for (const s of stateRows) {
            if (s.visibility === "visible") {
                result[s.name] = s.value;
            }
        }
        return result;
    }

    /**
     * Get all states with full metadata for storytelling mode
     */
    private async getAllStatesForStorytelling(): Promise<Array<{
        id: string;
        name: string;
        value: string;
        dataType: "text" | "number" | "boolean";
        visibility: "visible" | "hidden" | "conditional";
        description?: string | null;
    }>> {
        const stateRows = await this.db.select().from(schema.sessionStates);
        return stateRows.map(s => ({
            id: s.id,
            name: s.name,
            value: s.value,
            dataType: s.dataType || "text",
            visibility: s.visibility || "visible",
            description: s.description || null,
        }));
    }

    /**
     * Get all states including hidden ones (for trigger evaluation)
     */
    private async getAllStates(): Promise<Record<string, { value: string; dataType: string }>> {
        const stateRows = await this.db.select().from(schema.sessionStates);
        const result: Record<string, { value: string; dataType: string }> = {};
        for (const s of stateRows) {
            result[s.name] = { value: s.value, dataType: s.dataType || "text" };
        }
        return result;
    }

    /**
     * Format NPCs for prompt inclusion
     */
    private formatNpcsForPrompt(npcs: FullGameConfig["npcs"]): string {
        if (!npcs || npcs.length === 0) return "";
        return npcs.map(npc => {
            let line = `- **${npc.name}**`;
            if (npc.detail) line += `: ${npc.detail}`;
            return line;
        }).join("\n");
    }

    /**
     * Format lorebook entries for prompt inclusion
     */
    private formatLoreForPrompt(lore: FullGameConfig["lorebookEntries"]): string {
        if (!lore || lore.length === 0) return "";
        return lore.map(entry => `### ${entry.name}\n${entry.content}`).join("\n\n");
    }

    /**
     * Get pending (unfired) triggers for prompt
     */
    private async getPendingTriggersForPrompt(): Promise<string> {
        const triggers = await this.db.select()
            .from(schema.sessionTriggers)
            .where(eq(schema.sessionTriggers.fired, false));

        if (triggers.length === 0) return "";

        return triggers.map(t => `- **${t.name}**: When "${t.condition}" → ${t.effect}`).join("\n");
    }

    /**
     * Get active (fired) triggers for prompt
     */
    private async getActiveTriggersForPrompt(): Promise<string> {
        const triggers = await this.db.select()
            .from(schema.sessionTriggers)
            .where(eq(schema.sessionTriggers.fired, true));

        return triggers.map(t => `${t.name}: ${t.effect}`).join("\n");
    }

    /**
     * Evaluate trigger conditions against current state
     * Simple parser that handles: "Health < 20", "Gold >= 100", "Status = 'Poisoned'"
     */
    private evaluateTriggerCondition(condition: string, states: Record<string, { value: string; dataType: string }>): boolean {
        // Parse simple conditions like "Health < 20" or "Gold >= 100"
        const match = condition.match(/^(\w+)\s*(<=?|>=?|==?|!=)\s*(.+)$/);
        if (!match) return false;

        const [, stateName, operator, targetRaw] = match;
        const stateData = states[stateName];
        if (!stateData) return false;

        const target = targetRaw.trim().replace(/^['"]|['"]$/g, ""); // Remove quotes
        const currentValue = stateData.value;

        if (stateData.dataType === "number") {
            const numCurrent = parseFloat(currentValue);
            const numTarget = parseFloat(target);
            if (isNaN(numCurrent) || isNaN(numTarget)) return false;

            switch (operator) {
                case "<": return numCurrent < numTarget;
                case "<=": return numCurrent <= numTarget;
                case ">": return numCurrent > numTarget;
                case ">=": return numCurrent >= numTarget;
                case "=":
                case "==": return numCurrent === numTarget;
                case "!=": return numCurrent !== numTarget;
            }
        } else if (stateData.dataType === "boolean") {
            const boolCurrent = currentValue.toLowerCase() === "true";
            const boolTarget = target.toLowerCase() === "true";
            switch (operator) {
                case "=":
                case "==": return boolCurrent === boolTarget;
                case "!=": return boolCurrent !== boolTarget;
            }
        } else {
            // Text comparison
            switch (operator) {
                case "=":
                case "==": return currentValue === target;
                case "!=": return currentValue !== target;
            }
        }

        return false;
    }

    /**
     * Process a user turn and generate AI response
     */
    async processUserTurn(userMessage: string) {
        const session = await this.db.select().from(schema.gameSession).limit(1);
        if (!session.length) throw new Error("No game session found");

        const gameConfig = session[0].config as unknown as FullGameConfig;
        const model = session[0].model;
        const character = gameConfig.characters.find(c => c.id === this.state.characterId);

        // Get current states
        const statesForPrompt = await this.getStatesForPrompt();
        const activeTriggersText = await this.getActiveTriggersForPrompt();
        const pendingTriggersText = await this.getPendingTriggersForPrompt();

        // Format NPCs and lore
        const npcsText = this.formatNpcsForPrompt(gameConfig.npcs);
        const loreText = this.formatLoreForPrompt(gameConfig.lorebookEntries);

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

        // Format states for prompt
        const statesText = Object.entries(statesForPrompt)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join("\n");

        // Build system prompt with full context
        const systemPrompt = loadPrompt("game-master", {
            gameTitle: gameConfig.title,
            worldDescription: gameConfig.worldDescription,
            objective: gameConfig.objective,
            authorStyle: gameConfig.authorStyle || "",
            turnInstructions: gameConfig.turnInstructions || "",
            victoryCondition: gameConfig.victoryCondition || "",
            defeatCondition: gameConfig.defeatCondition || "",
            characterName: character?.name || "Unknown",
            characterDescription: character?.description || "No description",
            npcs: npcsText,
            lore: loreText,
            states: statesText,
            pendingTriggers: pendingTriggersText,
            activeTriggers: activeTriggersText,
            summary: summary || "",
            recentContext,
            imageInstructions: gameConfig.imageInstructions || "",
        });

        // Single agent with structured output using OpenRouter
        const openrouter = createOpenRouterClient(this.env.OPENROUTER_API_KEY);
        const agent = new ToolLoopAgent({
            model: getOpenRouterModel(openrouter, model),
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

        // Extract cost from OpenRouter via providerMetadata
        // Cost is in costDetails.upstream_inference_cost when usage.cost is 0
        const providerMetadata = (result as any).providerMetadata?.openrouter;

        // Try multiple possible paths for cost data
        // Note: AI SDK converts snake_case to camelCase in providerMetadata
        const aiCostUSD = providerMetadata?.usage?.cost
            || providerMetadata?.usage?.costDetails?.upstreamInferenceCost  // camelCase from AI SDK
            || providerMetadata?.usage?.costDetails?.upstream_inference_cost  // snake_case fallback
            || (result as any).totalUsage?.raw?.cost_details?.upstream_inference_cost
            || 0;

        // Apply state changes from AI response
        const triggersActivated: string[] = [];
        if (output.stateChanges) {
            for (const [stateName, newValue] of Object.entries(output.stateChanges)) {
                await this.db.update(schema.sessionStates)
                    .set({ value: String(newValue), updatedAt: sql`(unixepoch())` })
                    .where(eq(schema.sessionStates.name, stateName));
            }
        }

        // Get updated states for trigger evaluation
        const allStates = await this.getAllStates();

        // Check and fire triggers
        const newTurnNumber = this.state.currentTurn + 1;
        const unfiredTriggers = await this.db.select()
            .from(schema.sessionTriggers)
            .where(eq(schema.sessionTriggers.fired, false));

        for (const trigger of unfiredTriggers) {
            let shouldFire = false;

            // Check turn-based triggers
            if (trigger.triggerOnTurn === newTurnNumber) {
                shouldFire = true;
            }

            // Check condition-based triggers
            if (!shouldFire && trigger.condition) {
                shouldFire = this.evaluateTriggerCondition(trigger.condition, allStates);
            }

            if (shouldFire) {
                await this.db.update(schema.sessionTriggers)
                    .set({ fired: true, firedOnTurn: newTurnNumber, updatedAt: sql`(unixepoch())` })
                    .where(eq(schema.sessionTriggers.id, trigger.id));
                triggersActivated.push(trigger.name);

                // If oneShot is false or trigger should persist, we might want different behavior
                // For now, once fired, it stays in "fired" state
            }
        }

        // Get updated states for snapshot
        const updatedStates = await this.getStatesForPrompt();
        const allStatesForStorytelling = await this.getAllStatesForStorytelling();

        // Save turn
        const [insertedTurn] = await this.db.insert(schema.turns).values({
            turnNumber: newTurnNumber,
            turnTitle: output.turnTitle,
            userMessage,
            assistantResponse: output.narrative,
            agentThought: output.outcome ? `[${output.outcome.success.toUpperCase()}] ${output.outcome.reasoning}` : null,
            suggestedActions: output.suggestedActions,
            statesSnapshot: updatedStates,
            triggersActivated,
            turnOutcome: {
                outcome: output.outcome,
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
            this.ctx.waitUntil(this.generateSummary(model, gameConfig));
        }

        // Calculate turn cost and deduct credits
        const d1Db = this.getD1DB();
        const creditsService = new CreditsService(d1Db, this.env);
        const config = creditsService.getConfig();
        const turnCost = buildTurnCost(aiCostUSD, true, config); // true = image generated

        // Deduct credits with creator revenue share
        const deductResult = await creditsService.deductWithCreatorShare(
            this.state.playerId,
            this.state.creatorId,
            this.state.gameId,
            turnCost,
            {
                sessionId: this.state.sessionId,
                turnNumber: newTurnNumber,
            }
        );

        // Get updated balance
        const newBalance = await creditsService.getBalance(this.state.playerId);

        return {
            text: output.narrative,
            turnTitle: output.turnTitle,
            suggestedActions: output.suggestedActions,
            states: updatedStates,
            turnNumber: newTurnNumber,
            gameStatus: output.gameStatus,
            outcome: output.outcome?.success,
            triggersActivated,
            turnCost: turnCost.totalCredits,
            newBalance,
            creatorEarnings: deductResult.creatorEarnings,
            allStates: allStatesForStorytelling,
        };
    }

    /**
     * Generate a rolling summary of the story
     */
    private async generateSummary(model: string, gameConfig?: FullGameConfig) {
        const allTurns = await this.db.select()
            .from(schema.turns)
            .orderBy(schema.turns.turnNumber);

        const existingSummary = await this.db.select().from(schema.summary).limit(1);

        // Get game config if not provided
        if (!gameConfig) {
            const session = await this.db.select().from(schema.gameSession).limit(1);
            gameConfig = session[0]?.config as unknown as FullGameConfig;
        }

        const recentEvents = allTurns.slice(-5).map(t =>
            `Player: ${t.userMessage}\nGame Master: ${t.assistantResponse}`
        ).join("\n\n");

        const summaryPrompt = loadPrompt("summary", {
            previousSummary: existingSummary.length ? existingSummary[0].content : undefined,
            recentEvents,
            summarizationInstructions: gameConfig?.summarizationInstructions || "",
        });

        // Create OpenRouter client for summary generation (reuse if possible, but creating new is safe)
        const openrouter = createOpenRouterClient(this.env.OPENROUTER_API_KEY);
        const summaryAgent = new ToolLoopAgent({
            model: getOpenRouterModel(openrouter, model),
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

        if (turnRows.length && turnRows[0].statesSnapshot) {
            // Restore states from snapshot
            const snapshot = turnRows[0].statesSnapshot as Record<string, string>;
            for (const [name, value] of Object.entries(snapshot)) {
                await this.db.update(schema.sessionStates)
                    .set({ value, updatedAt: sql`(unixepoch())` })
                    .where(eq(schema.sessionStates.name, name));
            }
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

    async updateImageModel(imageModel: string) {
        await this.db.update(schema.gameSession)
            .set({ imageModel })
            .where(eq(schema.gameSession.id, 1));

        return { success: true, imageModel };
    }

    /**
     * Get current game state
     */
    async getGameState() {
        const session = await this.db.select().from(schema.gameSession).limit(1);
        const states = await this.getStatesForPrompt();
        const allStatesForStorytelling = await this.getAllStatesForStorytelling();
        const recentTurns = await this.db.select()
            .from(schema.turns)
            .orderBy(desc(schema.turns.turnNumber))
            .limit(5);

        return {
            currentTurn: this.state?.currentTurn ?? -1,
            states,
            recentTurns: recentTurns.reverse(),
            model: session[0]?.model,
            imageModel: session[0]?.imageModel,
            allStates: allStatesForStorytelling,
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
        const session = await this.db.select().from(schema.gameSession).limit(1);
        const gameConfig = session[0]?.config as unknown as FullGameConfig;
        const imageModelId = session[0]?.imageModel || "prism-flash";

        const baseStyle = gameConfig?.imageInstructions ||
            "cinematic fantasy illustration, third-person view, dramatic composition, detailed environment, atmospheric lighting";

        let prompt = `${baseStyle}, ${scenePrompt}`;

        if (characterDescription) {
            prompt += `. In the scene: a figure matching this description - ${characterDescription} - shown from behind or side angle, interacting with the environment`;
        }

        const imageConfig = getImageModelConfig(imageModelId);

        const response = await this.env.AI.run(
            imageConfig.actualModel as "@cf/black-forest-labs/flux-1-schnell",
            {
                prompt,
                width: imageConfig.width,
                height: imageConfig.height,
                steps: imageConfig.steps,
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
