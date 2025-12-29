// API
export { createApiClient, ApiError } from "./api";
export type { ApiClient, ApiClientOptions } from "./api";

// Hooks
export {
    ApiClientProvider,
    useApiClient,
    useGames,
    useGame,
    useCreateGame,
    useUpdateGame,
    useDeleteGame,
    useSearchGames,
    useGenerateGame,
    useGenerationStatus,
    useUser,
    useAuth,
    gameKeys,
    generationKeys,
    userKeys,
} from "./hooks";

// Types
export type {
    Game,
    GameFull,
    Character,
    Npc,
    CreateGameInput,
    UpdateGameInput,
    GenerateGameInput,
    GenerationStatus,
    GamesListResponse,
    SearchResult,
    SearchResponse,
    User,
    AuthState,
} from "./types";
