import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins"
import { eq } from "drizzle-orm";
import { games } from "@packages/db/schema/d1";
import * as schema from "@packages/db/schema/d1";

/**
 * Configuration for creating auth options
 */
export type AuthDatabaseConfig = {
    db: any; // drizzle instance
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
        database: drizzleAdapter(config.db, {
            provider: "sqlite",
            usePlural: true,
            schema
        }),

        // Origins
        trustedOrigins: [
            "http://localhost:3000",
            "https://loreland.vercel.app",
        ],

        // Email + Password authentication
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false, // Set to true in production
        },

        // Social authentication (optional)
        socialProviders,

        // plugins
        plugins: [
            anonymous({
                /**
                 * Migrate games when anonymous user links to a real account
                 */
                onLinkAccount: async ({ anonymousUser, newUser }) => {
                    // Migrate all games from anonymous user to new user
                    const anonId = anonymousUser.user.id;
                    const newId = newUser.user.id;

                    await config.db
                        .update(games)
                        .set({ userId: newId })
                        .where(eq(games.userId, anonId));

                    console.log(
                        `Migrated games from anonymous user ${anonId} to ${newId}`
                    );
                },
            }),
        ],

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
