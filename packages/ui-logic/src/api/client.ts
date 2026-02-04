import type {
    Game,
    GameFull,
    GamesListResponse,
    CreateGameInput,
    UpdateGameInput,
    GenerateGameInput,
    GenerationStatus,
    SearchResponse,
    SessionSummary,
    CreditBalance,
    CreditPackage,
    CreditTransaction,
    PurchaseResponse,
    BillingConfig,
    UserSettings,
    AIModel,
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
        baseUrl,

        user: {
            /**
             * Get current user info
             */
            me: () => {
                return request<{ authenticated: boolean; user: { id: string; email: string; name: string | null; image: string | null; isAnonymous: boolean } | null }>("/api/user/me");
            },
        },

        games: {
            /**
             * List games for current user
             */
            /**
             * List games
             */
            list: (params?: {
                limit?: number;
                offset?: number;
                favorite?: boolean;
                search?: string;
                public?: boolean;
                ids?: string[];
            }) => {
                const searchParams = new URLSearchParams();
                if (params?.limit) searchParams.set("limit", String(params.limit));
                if (params?.offset) searchParams.set("offset", String(params.offset));
                if (params?.favorite !== undefined) searchParams.set("favorite", String(params.favorite));
                if (params?.search) searchParams.set("search", params.search);
                if (params?.public !== undefined) searchParams.set("public", String(params.public));
                if (params?.ids) searchParams.set("ids", params.ids.join(","));

                const query = searchParams.toString();
                return request<GamesListResponse>(`/api/games${query ? `?${query}` : ""}`);
            },

            /**
             * Fork a game
             */
            fork: (id: string) => {
                return request<{ game: Game }>(`/api/games/${id}/fork`, {
                    method: "POST"
                });
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
            listSessions: (gameId: string, params?: { limit?: number; offset?: number }) => {
                const searchParams = new URLSearchParams();
                if (params?.limit) searchParams.set("limit", String(params.limit));
                if (params?.offset) searchParams.set("offset", String(params.offset));

                const query = searchParams.toString();
                return request<{ sessions: SessionSummary[]; pagination?: { limit: number; offset: number; count: number } }>(`/api/games/${gameId}/sessions${query ? `?${query}` : ""}`);
            },

            /**
             * Start or resume a game session
             */
            start: (gameId: string, sessionId?: string, characterId?: string, model?: string) => {
                return request<{
                    wsUrl: string;
                    sessionId: string;
                    currentTurn: number;
                    characterId: string;
                    characterName: string | null;
                    model: string;
                }>(`/api/games/${gameId}/play/start`, {
                    method: "POST",
                    body: JSON.stringify({ sessionId, characterId, model }),
                });
            },
        },

        credits: {
            /**
             * Get current credit balance and summary
             */
            getBalance: () => request<CreditBalance>("/api/credits"),

            /**
             * Get available credit packages from Xsolla
             */
            getPackages: (locale?: string) => {
                const params = locale ? `?locale=${locale}` : "";
                return request<{ packages: CreditPackage[] }>(`/api/credits/packages${params}`);
            },

            /**
             * Initiate purchase - returns Xsolla payment URL
             */
            purchase: (sku: string) => {
                return request<PurchaseResponse>("/api/credits/purchase", {
                    method: "POST",
                    body: JSON.stringify({ package: sku }),
                });
            },

            /**
             * Get transaction history
             */
            getTransactions: (limit?: number) => {
                const params = limit ? `?limit=${limit}` : "";
                return request<{ transactions: CreditTransaction[] }>(`/api/credits/transactions${params}`);
            },

            /**
             * Get billing config
             */
            getConfig: () => request<BillingConfig>("/api/credits/config"),
        },

        settings: {
            /**
             * Get current user settings
             */
            get: () => request<UserSettings>("/api/settings"),

            /**
             * Update user settings (auto-save model preference)
             */
            update: (data: { modelPreference?: string; storytellingMode?: boolean }) => {
                return request<{ success: boolean }>("/api/settings", {
                    method: "PUT",
                    body: JSON.stringify(data),
                });
            },

            /**
             * Get all available AI models with detailed info
             */
            getModels: () => request<{ models: AIModel[] }>("/api/settings/models"),
        },

    };
}

export type ApiClient = ReturnType<typeof createApiClient>;
