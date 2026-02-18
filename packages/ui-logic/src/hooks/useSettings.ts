import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import { useUser } from "./use-auth";

export const settingsKeys = {
	all: ["settings"] as const,
	user: () => [...settingsKeys.all, "user"] as const,
	models: () => [...settingsKeys.all, "models"] as const,
	imageModels: () => [...settingsKeys.all, "image-models"] as const,
};

export function useUserSettings() {
	const { data: authData } = useUser();
	const api = useApiClient();

	return useQuery({
		queryKey: settingsKeys.user(),
		queryFn: () => api.settings.get(),
		enabled: authData?.authenticated === true,
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
		staleTime: Infinity,
	});
}

export function useImageModels() {
	const api = useApiClient();

	return useQuery({
		queryKey: settingsKeys.imageModels(),
		queryFn: () => api.settings.getImageModels(),
		staleTime: Infinity,
	});
}
