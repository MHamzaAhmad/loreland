/**
 * Shared types for API responses
 * These mirror the backend schemas
 */

export interface Game {
    id: string;
    userId: string;
    title: string;
    description: string;
    background: string;
    instructions: string;
    objective: string;
    previewImage: string | null;
    fullSizePreviewImage: string | null;
    imageStyle: string | null;
    nsfw: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GameFull extends Game {
    characters: Character[];
    npcs: Npc[];
}

export interface Character {
    id: number;
    gameId: string;
    characterId: string;
    name: string;
    description: string;
    portrait: string | null;
    fullSizePortrait: string | null;
    position: number;
}

export interface Npc {
    id: number;
    gameId: string;
    name: string;
    detail: string | null;
    oneLiner: string | null;
    appearance: string | null;
    location: string | null;
    position: number | null;
}

export interface CreateGameInput {
    title: string;
    description: string;
    background: string;
    instructions: string;
    objective: string;
}

export interface UpdateGameInput {
    title?: string;
    description?: string;
    background?: string;
    instructions?: string;
    objective?: string;
}

export interface GenerateGameInput {
    prompt: string;
    characterCount?: number;
    npcCount?: number;
    generatePreviewImage?: boolean;
    generateCharacterPortraits?: boolean;
    imageStyle?: string;
}

export interface GenerationStatus {
    instanceId: string;
    status: "queued" | "running" | "complete" | "errored" | "terminated" | "waiting";
    currentStep?: string;
    stepsCompleted?: number;
    totalSteps?: number;
    progress?: {
        percentage: number;
        message: string;
        gameId?: string;
    };
    error?: string;
}

export interface GamesListResponse {
    games: Game[];
    pagination: {
        limit: number;
        offset: number;
        count: number;
    };
    cached?: boolean;
}

export interface SearchResult extends Game {
    score: number;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    count: number;
}

export interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isAnonymous: boolean;
}

export interface AuthState {
    authenticated: boolean;
    user: User | null;
}
