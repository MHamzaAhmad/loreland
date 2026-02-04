import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";

/**
 * Query key factory for settings
 */
export const settingsKeys = {
	all: ["settings"] as const,
	user: () => [...settingsKeys.all, "user"] as const,
	models: () => [...settingsKeys.all, "models"] as const,
};

/**
 * Hook to fetch current user settings
 */
export function useUserSettings() {
	const api = useApiClient();

	return useQuery({
		queryKey: settingsKeys.user(),
		queryFn: () => api.settings.get(),
	});
}

/**
 * Hook to update user settings (auto-save)
 */
export function useUpdateUserSettings() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { modelPreference?: string; storytellingMode?: boolean }) => api.settings.update(data),
		onSuccess: () => {
			// Invalidate and refetch user settings after update
			queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
		},
	});
}

/**
 * Hook to fetch available AI models
 */
export function useAvailableModels() {
	const api = useApiClient();

	return useQuery({
		queryKey: settingsKeys.models(),
		queryFn: () => api.settings.getModels(),
		staleTime: Infinity, // Models rarely change, cache indefinitely
	});
}
