import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import { gameKeys } from "./use-games";
import type { GenerateGameInput } from "../types";

/**
 * Query key factory for generation
 */
export const generationKeys = {
    all: ["generation"] as const,
    status: (instanceId: string) => [...generationKeys.all, "status", instanceId] as const,
};

/**
 * Hook to start game generation
 */
export function useGenerateGame() {
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: GenerateGameInput) => api.generation.start(data),
    });
}

/**
 * Hook to poll generation status
 * 
 * Automatically refetches while status is "running" or "queued"
 */
export function useGenerationStatus(
    instanceId: string | null,
    options?: {
        enabled?: boolean;
        refetchInterval?: number;
        onComplete?: (gameId: string) => void;
    }
) {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: instanceId ? generationKeys.status(instanceId) : ["disabled"],
        queryFn: () => api.generation.status(instanceId!),
        enabled: (options?.enabled ?? true) && !!instanceId,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return false;

            // Stop polling when complete or errored
            if (data.status === "complete" || data.status === "errored" || data.status === "terminated") {
                // Invalidate games list on completion
                if (data.status === "complete" && data.progress?.gameId) {
                    queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
                    options?.onComplete?.(data.progress.gameId);
                }
                return false;
            }

            // Continue polling
            return options?.refetchInterval ?? 1500;
        },
    });
}
