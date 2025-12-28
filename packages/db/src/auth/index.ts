import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";

/**
 * Create Better Auth instance with Drizzle adapter for D1
 * 
 * @param d1 - D1 database binding
 * @param options - Auth configuration options
 */
export function createAuth(d1: D1Database, options?: {
    baseURL?: string;
    googleClientId?: string;
    googleClientSecret?: string;
}) {
    const db = drizzle(d1);

    return betterAuth({
        database: drizzleAdapter(db, {
            provider: "sqlite",
        }),

        // Email + Password authentication
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false, // Set to true in production
        },

        // Social authentication
        socialProviders: options?.googleClientId ? {
            google: {
                clientId: options.googleClientId,
                clientSecret: options.googleClientSecret!,
            },
        } : undefined,

        // Session configuration
        session: {
            expiresIn: 60 * 60 * 24 * 7, // 7 days
            updateAge: 60 * 60 * 24, // 1 day
        },

        // Base URL for callbacks
        baseURL: options?.baseURL,

        // Advanced options
        advanced: {
            generateId: () => crypto.randomUUID(),
        },
    });
}

export type Auth = ReturnType<typeof createAuth>;
