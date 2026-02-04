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
    | { type: "response"; text: string; suggestedActions: string[]; characterState: CharacterStateSnapshot; turnNumber: number; sceneImageKey?: string; gameStatus?: "continue" | "victory" | "defeat"; outcome?: string; turnCost: number; newBalance: number; creatorEarnings?: number }
    | { type: "state"; currentTurn: number; characterState: CharacterStateSnapshot | null; recentTurns: Turn[]; model?: string }
    | { type: "turns"; turns: Turn[] }
    | { type: "error"; message: string; code?: "INSUFFICIENT_CREDITS"; currentBalance?: number; required?: number }
    | { type: "turn_image_generating"; turnNumber: number }
    | { type: "turn_image_ready"; turnNumber: number; sceneImageKey: string }
    | { type: "turn_image_error"; turnNumber: number; error: string };

export type GameClientConfig = {
    url: string;
    onMessage?: (message: WebSocketResponse) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
    onOpen?: () => void;
};
