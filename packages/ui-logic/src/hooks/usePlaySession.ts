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
 * Session summary for listing
 */
export interface SessionSummary {
    id: string;
    gameId: string;
    userId: string;
    characterId: string;
    characterName: string | null;
    currentTurn: number;
    lastPlayedAt: string | Date | number | null;
    model: string;
    createdAt: string | Date | number;
}

/**
 * Play session initialization state
 */
export type PlaySessionState =
    | { status: "loading" }
    | { status: "error"; error: Error }
    | { status: "session_list"; sessions: SessionSummary[] }
    | { status: "select_character" }
    | { status: "ready"; config: PlaySessionConfig };

/**
 * State returned by usePlaySession hook
 */
export interface UsePlaySessionReturn {
    state: PlaySessionState;
    selectCharacter: (characterId: string) => void;
    resumeSession: (sessionId: string) => void;
    createNewSession: () => void;
    backToSessions: () => void;
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

    // UI Local State
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [resumingSessionId, setResumingSessionId] = useState<string | null>(null);

    // Step 1: Query existing sessions
    const sessionsQuery = useQuery({
        queryKey: playKeys.sessions(gameId),
        queryFn: () => api.play.listSessions(gameId),
        staleTime: 30000,
        retry: 2,
    });

    // Step 2: Resume session logic
    const resumeQuery = useQuery({
        queryKey: playKeys.session(gameId, resumingSessionId || "none"),
        queryFn: async (): Promise<PlaySessionConfig> => {
            if (!resumingSessionId) throw new Error("No session to resume");
            const res = await api.play.start(gameId, resumingSessionId);
            return {
                wsUrl: buildWsUrl(res.wsUrl),
                sessionId: res.sessionId,
                characterId: res.characterId,
                characterName: res.characterName,
            };
        },
        enabled: !!resumingSessionId,
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
            // Invalidate session list to show the new one later
            queryClient.invalidateQueries({ queryKey: playKeys.sessions(gameId) });
        },
    });

    // Handlers
    const selectCharacter = useCallback((characterId: string) => {
        startMutation.mutate(characterId);
    }, [startMutation]);

    const resumeSession = useCallback((sessionId: string) => {
        setResumingSessionId(sessionId);
    }, []);

    const createNewSession = useCallback(() => {
        setIsCreatingNew(true);
    }, []);

    const backToSessions = useCallback(() => {
        setIsCreatingNew(false);
        setResumingSessionId(null);
        startMutation.reset();
    }, [startMutation]);

    const reset = useCallback(() => {
        setIsCreatingNew(false);
        setResumingSessionId(null);
        startMutation.reset();
        queryClient.invalidateQueries({ queryKey: playKeys.sessions(gameId) });
    }, [gameId, queryClient, startMutation]);

    // Derive state machine
    const deriveState = (): PlaySessionState => {
        // Errors
        if (sessionsQuery.error) {
            return { status: "error", error: sessionsQuery.error as Error };
        }
        if (resumeQuery.error && resumingSessionId) {
            return { status: "error", error: resumeQuery.error as Error };
        }
        if (startMutation.error) {
            return { status: "error", error: startMutation.error as Error };
        }

        // Ready (Active Session)
        if (startMutation.data) {
            return { status: "ready", config: startMutation.data };
        }
        if (resumeQuery.data) {
            return { status: "ready", config: resumeQuery.data };
        }

        // Loading
        if (sessionsQuery.isLoading) {
            return { status: "loading" };
        }
        if (resumingSessionId && resumeQuery.isLoading) {
            return { status: "loading" };
        }
        if (startMutation.isPending) {
            return { status: "loading" };
        }

        // States
        if (isCreatingNew) {
            return { status: "select_character" };
        }

        // Default: Session List (even if empty)
        return {
            status: "session_list",
            sessions: (sessionsQuery.data?.sessions as unknown as SessionSummary[]) || []
        };
    };

    return {
        state: deriveState(),
        selectCharacter,
        resumeSession,
        createNewSession,
        backToSessions,
        reset,
    };
}
