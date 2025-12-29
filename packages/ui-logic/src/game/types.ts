import type { CharacterStateSnapshot } from "@packages/db/schema/agent";
export type { CharacterStateSnapshot };

export interface GameState {
    currentTurn: number;
    characterState: CharacterStateSnapshot | null;
    recentTurns: Turn[];
    model?: string;
}

export interface Turn {
    turnNumber: number;
    userMessage: string;
    assistantResponse: string;
    suggestedActions: string[];
    characterState: CharacterStateSnapshot;
    sceneImageKey?: string;
    createdAt: number;
}

export type WebSocketMessage =
    | { type: "turn"; message: string }
    | { type: "get_state" }
    | { type: "get_turns" };

export type WebSocketResponse =
    | { type: "response"; text: string; suggestedActions: string[]; characterState: CharacterStateSnapshot; turnNumber: number; sceneImageKey?: string }
    | { type: "state"; currentTurn: number; characterState: CharacterStateSnapshot | null; recentTurns: Turn[]; model?: string }
    | { type: "turns"; turns: Turn[] }
    | { type: "error"; message: string };

export type GameClientConfig = {
    url: string;
    onMessage?: (message: WebSocketResponse) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
    onOpen?: () => void;
};
