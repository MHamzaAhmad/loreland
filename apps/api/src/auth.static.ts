import { betterAuth } from "better-auth";
import { getAuthOptions } from "./lib/auth.options";

/**
 * Static auth instance for @better-auth/cli schema generation
 * 
 * Uses the same shared options as runtime, with placeholder database.
 * The CLI only needs the config structure to generate schema.
 * 
 * Usage: bunx @better-auth/cli generate --config ./src/auth.static.ts
 */
export const auth = betterAuth(getAuthOptions({
    db: undefined as any, // CLI only needs config structure
}));
