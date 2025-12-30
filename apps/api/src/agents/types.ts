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

/**
 * Drizzle database type for agent storage
 */
export type AgentDB = ReturnType<typeof drizzle<typeof schema>>;
