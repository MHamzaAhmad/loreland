import type {
    Game,
    GameFull,
    GamesListResponse,
    CreateGameInput,
    UpdateGameInput,
    GenerateGameInput,
    GenerationStatus,
    SearchResponse,
} from "../types";

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * Options for creating an API client
 */
export interface ApiClientOptions {
    baseUrl: string;
    getAuthHeaders?: () => Promise<Record<string, string>> | Record<string, string>;
}

/**
 * Create a type-safe API client
 * Platform-agnostic - just uses fetch
 */
export function createApiClient(options: ApiClientOptions) {
    const { baseUrl, getAuthHeaders } = options;

    async function request<T>(
        path: string,
        init?: RequestInit
    ): Promise<T> {
        const authHeaders = getAuthHeaders ? await getAuthHeaders() : {};

        const response = await fetch(`${baseUrl}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...authHeaders,
                ...init?.headers,
            },
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
            throw new ApiError(response.status, errorData.error || "Request failed");
        }

        return response.json();
    }

    return {
        games: {
            /**
             * List games for current user
             */
            list: (params?: { limit?: number; offset?: number; favorite?: boolean }) => {
                const searchParams = new URLSearchParams();
                if (params?.limit) searchParams.set("limit", String(params.limit));
                if (params?.offset) searchParams.set("offset", String(params.offset));
                if (params?.favorite !== undefined) searchParams.set("favorite", String(params.favorite));

                const query = searchParams.toString();
                return request<GamesListResponse>(`/api/games${query ? `?${query}` : ""}`);
            },

            /**
             * Get a single game with full details
             */
            get: (id: string) => {
                return request<{ game: GameFull; cached?: boolean }>(`/api/games/${id}`);
            },

            /**
             * Create a new game
             */
            create: (data: CreateGameInput) => {
                return request<{ game: Game }>("/api/games", {
                    method: "POST",
                    body: JSON.stringify(data),
                });
            },

            /**
             * Update an existing game
             */
            update: (id: string, data: UpdateGameInput) => {
                return request<{ game: Game }>(`/api/games/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                });
            },

            /**
             * Delete a game
             */
            delete: (id: string) => {
                return request<{ success: boolean }>(`/api/games/${id}`, {
                    method: "DELETE",
                });
            },

            /**
             * Search games semantically
             */
            search: (query: string, limit?: number) => {
                const params = new URLSearchParams({ q: query });
                if (limit) params.set("limit", String(limit));
                return request<SearchResponse>(`/api/games/search?${params}`);
            },
        },

        generation: {
            /**
             * Start game generation workflow
             */
            start: (data: GenerateGameInput) => {
                return request<{ instanceId: string; message: string }>("/api/games/generate", {
                    method: "POST",
                    body: JSON.stringify(data),
                });
            },

            /**
             * Get generation status
             */
            status: (instanceId: string) => {
                return request<GenerationStatus>(`/api/games/generate/${instanceId}/status`);
            },
        },

        play: {
            /**
             * List active sessions for a game
             */
            listSessions: (gameId: string) => {
                return request<{ sessions: { id: string; createdAt: number }[] }>(`/api/games/${gameId}/play/sessions`);
            },

            /**
             * Start or resume a game session
             */
            start: (gameId: string, sessionId?: string, characterId?: string, model?: string) => {
                return request<{ wsUrl: string; sessionId: string }>(`/api/games/${gameId}/play/start`, {
                    method: "POST",
                    body: JSON.stringify({ sessionId, characterId, model }),
                });
            },
        },


    };
}

export type ApiClient = ReturnType<typeof createApiClient>;
