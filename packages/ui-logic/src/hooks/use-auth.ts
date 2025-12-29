import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import type { AuthState } from "../types";

/**
 * Query key for user/auth
 */
export const userKeys = {
    user: ["user", "me"] as const,
};

/**
 * Hook to get current user state
 * 
 * Returns authenticated status and user info including isAnonymous
 */
export function useUser() {
    const api = useApiClient();

    return useQuery({
        queryKey: userKeys.user,
        queryFn: async (): Promise<AuthState> => {
            try {
                const result = await api.user.me();
                return result;
            } catch {
                return { authenticated: false, user: null };
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    });
}

/**
 * Hook for auth actions
 */
export function useAuth() {
    const queryClient = useQueryClient();

    const invalidateUser = () => {
        queryClient.invalidateQueries({ queryKey: userKeys.user });
    };

    return {
        invalidateUser,
    };
}
