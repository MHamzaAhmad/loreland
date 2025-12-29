import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins"

/**
 * Configuration for creating auth options
 */
export type AuthDatabaseConfig = {
    db: unknown; // drizzle instance (typed as unknown for CLI compatibility)
    googleClientId?: string;
    googleClientSecret?: string;
};

/**
 * Get auth options configuration - shared between runtime and CLI
 * 
 * This is the single source of truth for all auth configuration.
 * Update plugins, session config, and auth methods here.
 */
export function getAuthOptions(config: AuthDatabaseConfig): BetterAuthOptions {
    const socialProviders = config.googleClientId
        ? {
            google: {
                clientId: config.googleClientId,
                clientSecret: config.googleClientSecret || "",
            },
        }
        : undefined;

    return {
        database: drizzleAdapter(config.db as any, {
            provider: "sqlite",
            usePlural: false,
        }),

        // Email + Password authentication
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false, // Set to true in production
        },

        // Social authentication (optional)
        socialProviders,

        // plugins
        plugins: [anonymous()],

        // Session configuration
        session: {
            expiresIn: 60 * 60 * 24 * 7, // 7 days
            updateAge: 60 * 60 * 24, // 1 day
            cookieCache: {
                enabled: true,
                maxAge: 60 * 5, // 5 minutes
            },
        },
    };
}
