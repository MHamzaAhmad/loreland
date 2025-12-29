import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/d1";
import { getAuthOptions } from "./lib/auth.options";

/**
 * Env bindings required for auth
 */
type AuthEnv = {
    DB: D1Database;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
};

/**
 * Create Better Auth instance at runtime
 * 
 * Uses shared auth options from auth.options.ts
 */
export function createAuth(env: AuthEnv) {
    const db = drizzle(env.DB);

    return betterAuth(getAuthOptions({
        db,
        googleClientId: env.GOOGLE_CLIENT_ID,
        googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    }));
}

export type Auth = ReturnType<typeof createAuth>;
