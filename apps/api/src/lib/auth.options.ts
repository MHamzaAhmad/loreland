import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins"
import { eq } from "drizzle-orm";
import { games, userCredits, deviceFingerprints } from "@packages/db/schema/d1";
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
    /**
     * Function to get the device fingerprint from the current request.
     * Used to prevent welcome credit abuse.
     */
    getFingerprint?: () => string | undefined;
};

// Store fingerprint context for the current request
let currentFingerprint: string | undefined;

/**
 * Set fingerprint for current request (call from auth handler middleware)
 */
export function setRequestFingerprint(fingerprint: string | undefined): void {
    currentFingerprint = fingerprint;
}

/**
 * Get fingerprint for current request
 */
export function getRequestFingerprint(): string | undefined {
    return currentFingerprint;
}

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

    // Create credits service for hooks
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
                 * Migrate games and credits when anonymous user links to a real account
                 */
                onLinkAccount: async ({ anonymousUser, newUser }) => {
                    const anonId = anonymousUser.user.id;
                    const newId = newUser.user.id;

                    // 1. Migrate all games from anonymous user to new user
                    await config.db
                        .update(games)
                        .set({ userId: newId })
                        .where(eq(games.userId, anonId));

                    console.log(
                        `Migrated games from anonymous user ${anonId} to ${newId}`
                    );

                    // 2. Merge credits from anonymous to linked account
                    const anonCredits = await config.db
                        .select()
                        .from(userCredits)
                        .where(eq(userCredits.userId, anonId))
                        .get();

                    if (anonCredits && anonCredits.balance > 0) {
                        await creditsService.addCredits(newId, anonCredits.balance, {
                            type: "bonus",
                            description: "Merged credits from guest account",
                        });
                        console.log(
                            `Merged ${anonCredits.balance} credits from anonymous user ${anonId} to ${newId}`
                        );
                    }

                    // 3. Transfer device fingerprint ownership
                    await config.db
                        .update(deviceFingerprints)
                        .set({ userId: newId })
                        .where(eq(deviceFingerprints.userId, anonId));
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
                        // Check fingerprint to prevent credit abuse
                        const fingerprint = config.getFingerprint?.() ?? getRequestFingerprint();

                        let shouldGrantCredits = true;

                        if (fingerprint) {
                            // Check if this device already claimed credits
                            const existing = await config.db
                                .select()
                                .from(deviceFingerprints)
                                .where(eq(deviceFingerprints.fingerprint, fingerprint))
                                .get();

                            if (existing?.claimedCredits) {
                                shouldGrantCredits = false;
                                console.log(`Device ${fingerprint} already claimed credits - skipping for user ${user.id}`);
                            }
                        }

                        if (shouldGrantCredits) {
                            // Give 1000 free credits to new users
                            await creditsService.addCredits(user.id, 1000, {
                                type: "bonus",
                                description: "Welcome bonus - 1,000 free credits",
                            });
                            console.log(`Added 1000 welcome credits to new user ${user.id}`);

                            // Record fingerprint if available
                            if (fingerprint) {
                                await config.db.insert(deviceFingerprints).values({
                                    fingerprint,
                                    userId: user.id,
                                    claimedCredits: true,
                                });
                            }
                        }
                    },
                },
            },
        },
    };
}
