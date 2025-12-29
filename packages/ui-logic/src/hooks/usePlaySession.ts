import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";

/**
 * Configuration for an active game session
 */
export interface PlaySessionConfig {
    wsUrl: string;
    sessionId: string;
    characterId: string;
    characterName: string | null;
}

/**
 * Play session initialization state
 */
export type PlaySessionState =
    | { status: "loading" }
    | { status: "error"; error: Error }
    | { status: "select_character" }
    | { status: "ready"; config: PlaySessionConfig };

/**
 * State returned by usePlaySession hook
 */
export interface UsePlaySessionReturn {
    state: PlaySessionState;
    selectCharacter: (characterId: string) => void;
    reset: () => void;
}

/**
 * Query keys for play-related queries
 */
export const playKeys = {
    sessions: (gameId: string) => ["play", "sessions", gameId] as const,
    session: (gameId: string, sessionId: string) => ["play", "session", gameId, sessionId] as const,
};

/**
 * Hook for managing play session initialization
 * Handles session listing, resuming, and starting new sessions
 * 
 * @param gameId - The game ID to play
 * @param buildWsUrl - Function to build full WebSocket URL from relative path
 */
export function usePlaySession(
    gameId: string,
    buildWsUrl: (relativePath: string) => string
): UsePlaySessionReturn {
    const api = useApiClient();
    const queryClient = useQueryClient();
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

    // Step 1: Query existing sessions
    const sessionsQuery = useQuery({
        queryKey: playKeys.sessions(gameId),
        queryFn: () => api.play.listSessions(gameId),
        staleTime: 30000, // 30 seconds
        retry: 2,
    });

    const existingSessionId = sessionsQuery.data?.sessions?.[0]?.id;

    // Step 2: Auto-resume if we have an existing session
    const resumeQuery = useQuery({
        queryKey: playKeys.session(gameId, existingSessionId || "none"),
        queryFn: async (): Promise<PlaySessionConfig> => {
            if (!existingSessionId) throw new Error("No session to resume");
            const res = await api.play.start(gameId, existingSessionId);
            return {
                wsUrl: buildWsUrl(res.wsUrl),
                sessionId: res.sessionId,
                characterId: res.characterId,
                characterName: res.characterName,
            };
        },
        enabled: !!existingSessionId,
        staleTime: Infinity,
        retry: 1,
    });

    // Step 3: Start new session (triggered by character selection)
    const startMutation = useMutation({
        mutationFn: async (characterId: string): Promise<PlaySessionConfig> => {
            const res = await api.play.start(gameId, undefined, characterId);
            return {
                wsUrl: buildWsUrl(res.wsUrl),
                sessionId: res.sessionId,
                characterId: res.characterId,
                characterName: res.characterName,
            };
        },
        onSuccess: (data) => {
            // Cache the session config
            queryClient.setQueryData(playKeys.session(gameId, data.sessionId), data);
        },
    });

    // Character selection handler
    const selectCharacter = useCallback((characterId: string) => {
        setSelectedCharacterId(characterId);
        startMutation.mutate(characterId);
    }, [startMutation]);

    // Reset handler (for retrying)
    const reset = useCallback(() => {
        setSelectedCharacterId(null);
        startMutation.reset();
        queryClient.invalidateQueries({ queryKey: playKeys.sessions(gameId) });
    }, [gameId, queryClient, startMutation]);

    // Derive state machine
    const deriveState = (): PlaySessionState => {
        // Check for errors first
        if (sessionsQuery.error) {
            return { status: "error", error: sessionsQuery.error as Error };
        }
        if (resumeQuery.error && existingSessionId) {
            return { status: "error", error: resumeQuery.error as Error };
        }
        if (startMutation.error) {
            return { status: "error", error: startMutation.error as Error };
        }

        // Check for ready state (session config available)
        if (startMutation.data) {
            return { status: "ready", config: startMutation.data };
        }
        if (resumeQuery.data) {
            return { status: "ready", config: resumeQuery.data };
        }

        // Check for loading states
        if (sessionsQuery.isLoading) {
            return { status: "loading" };
        }
        if (existingSessionId && resumeQuery.isLoading) {
            return { status: "loading" };
        }
        if (startMutation.isPending) {
            return { status: "loading" };
        }

        // No existing session, need character selection
        if (!existingSessionId && !selectedCharacterId) {
            return { status: "select_character" };
        }

        // Fallback to loading (shouldn't happen)
        return { status: "loading" };
    };

    return {
        state: deriveState(),
        selectCharacter,
        reset,
    };
}
