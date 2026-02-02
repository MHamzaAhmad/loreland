import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins"
import { eq } from "drizzle-orm";
import { games } from "@packages/db/schema/d1";
import * as schema from "@packages/db/schema/d1";
import { CreditsService } from "../services/credits";

/**
 * Configuration for creating auth options
 */
export type AuthDatabaseConfig = {
    db: any; // drizzle instance
    googleClientId?: string;
    googleClientSecret?: string;
    secret?: string;
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
        secret: config.secret || "",

        // Origins
        trustedOrigins: [
            "http://localhost:3000",
            "https://web.hamzabuzz88.workers.dev",
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

        // Database hooks
        databaseHooks: {
            user: {
                create: {
                    after: async (user) => {
                        // Give 1000 free credits to new users
                        const creditsService = new CreditsService(config.db, {
                            CREDIT_RATE: "0.001",
                            CREDIT_MARGIN: "1.5",
                            MIN_CREDITS: "1",
                            IMAGE_COST_PREVIEW: "5",
                            IMAGE_COST_PORTRAIT: "3",
                            IMAGE_COST_SCENE: "4",
                            MIN_BALANCE_PLAY: "10",
                            MIN_BALANCE_GENERATE: "50",
                            CREATOR_REVENUE_SHARE: "0.20",
                        });
                        
                        await creditsService.addCredits(user.id, 1000, {
                            type: "bonus",
                            description: "Welcome bonus - 1,000 free credits",
                        });
                        
                        console.log(`Added 1000 welcome credits to new user ${user.id}`);
                    },
                },
            },
        },
    };
}
