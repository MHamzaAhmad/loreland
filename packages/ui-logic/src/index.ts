// API
export { createApiClient, ApiError } from "./api";
export type { ApiClient, ApiClientOptions } from "./api";
export * from "./utils/images";

// Hooks
export {
    ApiClientProvider,
    useApiClient,
    useGames,
    useGame,
    useCreateGame,
    useUpdateGame,
    useDeleteGame,
    useForkGame,
    useSearchGames,
    useGenerateGame,
    useGenerationStatus,
    useUser,
    useAuth,
    gameKeys,
    generationKeys,
    userKeys,
    useGameSession,
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
    SessionSummary,
} from "./types";

export * from "./game/types";
export * from "./game/GameClient";

