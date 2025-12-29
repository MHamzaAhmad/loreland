/**
 * Game caching service using Workers KV
 * Provides read-through caching for games with automatic invalidation
 */

// Cache TTLs in seconds
const GAME_TTL = 300; // 5 minutes for single game
const LIST_TTL = 60; // 1 minute for game lists

// Cache key prefixes
const GAME_PREFIX = "game:";
const LIST_PREFIX = "games:";

export class GameCacheService {
    constructor(private kv: KVNamespace) { }

    /**
     * Generate cache key for a single game
     */
    private gameKey(gameId: string): string {
        return `${GAME_PREFIX}${gameId}`;
    }

    /**
     * Generate cache key for a user's game list
     */
    private listKey(userId: string, params?: { limit?: number; offset?: number; favorite?: boolean }): string {
        const suffix = params
            ? `:${params.limit ?? 20}:${params.offset ?? 0}:${params.favorite ?? "all"}`
            : ":default";
        return `${LIST_PREFIX}${userId}${suffix}`;
    }

    /**
     * Get a cached game by ID
     */
    async getGame<T>(gameId: string): Promise<T | null> {
        const cached = await this.kv.get(this.gameKey(gameId), "json");
        return cached as T | null;
    }

    /**
     * Cache a single game
     */
    async setGame<T>(game: T & { id: string }): Promise<void> {
        await this.kv.put(
            this.gameKey(game.id),
            JSON.stringify(game),
            { expirationTtl: GAME_TTL }
        );
    }

    /**
     * Get cached game list for a user
     */
    async getGamesList<T>(
        userId: string,
        params?: { limit?: number; offset?: number; favorite?: boolean }
    ): Promise<T[] | null> {
        const cached = await this.kv.get(this.listKey(userId, params), "json");
        return cached as T[] | null;
    }

    /**
     * Cache a game list for a user
     */
    async setGamesList<T>(
        userId: string,
        games: T[],
        params?: { limit?: number; offset?: number; favorite?: boolean }
    ): Promise<void> {
        await this.kv.put(
            this.listKey(userId, params),
            JSON.stringify(games),
            { expirationTtl: LIST_TTL }
        );
    }

    /**
     * Invalidate a single game's cache
     * Called on update or delete
     */
    async invalidateGame(gameId: string): Promise<void> {
        await this.kv.delete(this.gameKey(gameId));
    }

    /**
     * Invalidate all cached lists for a user
     * Called when games are created, updated, or deleted
     * 
     * Note: KV doesn't have pattern delete, so we use list + delete
     * For production, consider using a prefix-based approach or cache tags
     */
    async invalidateUserGamesLists(userId: string): Promise<void> {
        const prefix = `${LIST_PREFIX}${userId}`;
        const list = await this.kv.list({ prefix, limit: 100 });

        await Promise.all(
            list.keys.map((key) => this.kv.delete(key.name))
        );
    }

    /**
     * Convenience method to invalidate both game and user's lists
     */
    async invalidateOnMutation(gameId: string, userId: string): Promise<void> {
        await Promise.all([
            this.invalidateGame(gameId),
            this.invalidateUserGamesLists(userId),
        ]);
    }
}
