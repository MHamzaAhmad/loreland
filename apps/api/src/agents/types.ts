/**
 * Type definitions for Play Agent
 */
import type { drizzle } from "drizzle-orm/durable-sqlite";
import type * as schema from "@packages/db/schema/agent";

/**
 * Game session state stored in Durable Object
 */
export interface GameSessionState {
    sessionId: string;
    gameId: string;
    characterId: string;
    currentTurn: number;
}

/**
 * Full game configuration with all related data
 */
export interface FullGameConfig {
    id: string;
    title: string;
    description: string;
    worldDescription: string;
    objective: string;
    firstPrompt: string;

    // Narrative control
    authorStyle?: string | null;
    turnInstructions?: string | null;
    summarizationInstructions?: string | null;

    // Image generation
    imageInstructions?: string | null;
    imageStyle?: string | null;

    // End conditions
    victoryCondition?: string | null;
    defeatCondition?: string | null;

    // Related data
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
    states: Array<{
        id: string;
        name: string;
        description?: string | null;
        dataType?: string | null;
        visibility?: string | null;
        displayCondition?: string | null;
        initialValue?: string | null;
    }>;
    triggers: Array<{
        id: string;
        name: string;
        condition: string;
        effect: string;
        triggerOnTurn?: number | null;
        oneShot?: boolean | null;
    }>;
}

/**
 * Drizzle database type for agent storage
 */
export type AgentDB = ReturnType<typeof drizzle<typeof schema>>;
