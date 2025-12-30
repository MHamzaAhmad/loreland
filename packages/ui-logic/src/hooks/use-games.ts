import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { CreateGameInput, UpdateGameInput } from "../types";

/**
 * Query key factory for games
 */
export const gameKeys = {
    all: ["games"] as const,
    lists: () => [...gameKeys.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...gameKeys.lists(), filters] as const,
    details: () => [...gameKeys.all, "detail"] as const,
    detail: (id: string) => [...gameKeys.details(), id] as const,
    search: (query: string) => [...gameKeys.all, "search", query] as const,
};

/**
 * Hook to list games with advanced filtering
 */
export function useGames(options?: {
    limit?: number;
    offset?: number;
    favorite?: boolean;
    search?: string;
    public?: boolean;
    ids?: string[];
    enabled?: boolean;
}) {
    const api = useApiClient();
    const { enabled = true, ...params } = options ?? {};

    return useQuery({
        queryKey: gameKeys.list(params),
        queryFn: () => api.games.list(params),
        enabled,
    });
}

/**
 * Hook to get a single game with full details
 */
export function useGame(id: string, options?: { enabled?: boolean }) {
    const api = useApiClient();

    return useQuery({
        queryKey: gameKeys.detail(id),
        queryFn: () => api.games.get(id),
        enabled: options?.enabled ?? !!id,
    });
}

/**
 * Hook to create a new game
 */
export function useCreateGame() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateGameInput) => api.games.create(data),
        onSuccess: () => {
            // Invalidate games lists
            queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
        },
    });
}

/**
 * Hook to fork an existing game
 */
export function useForkGame() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.games.fork(id),
        onSuccess: () => {
            // Invalidate games lists to show new forked game
            queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
        }
    });
}

/**
 * Hook to update a game
 */
export function useUpdateGame() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateGameInput }) =>
            api.games.update(id, data),
        onSuccess: (_, { id }) => {
            // Invalidate specific game and lists
            queryClient.invalidateQueries({ queryKey: gameKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
        },
    });
}

/**
 * Hook to delete a game
 */
export function useDeleteGame() {
    const api = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.games.delete(id),
        onSuccess: (_, id) => {
            // Remove from cache and invalidate lists
            queryClient.removeQueries({ queryKey: gameKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
        },
    });
}

/**
 * Hook to search games semantically
 * @deprecated Use useGames with search param instead
 */
export function useSearchGames(query: string, options?: {
    limit?: number;
    enabled?: boolean;
}) {
    const api = useApiClient();

    return useQuery({
        queryKey: gameKeys.search(query),
        queryFn: () => api.games.search(query, options?.limit),
        enabled: (options?.enabled ?? true) && query.length > 0,
        staleTime: 1000 * 30, // 30 seconds
    });
}
