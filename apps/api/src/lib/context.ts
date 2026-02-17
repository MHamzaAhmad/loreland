import { createMiddleware } from "hono/factory";
import { createAuth, type Auth } from "../auth";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { PlayAgent } from "../agents/play-agent";
import * as schema from "@packages/db/schema/d1";
import type { GenerationStatusAgent } from "../agents/generation-status-agent";

/**
 * Application environment types for Hono
 */
export type AppEnv = {
    Bindings: {
        DB: D1Database;
        IMAGES: R2Bucket;
        AI: Ai;
        GAME_GENERATION_WORKFLOW: Workflow;
        VECTORIZE: VectorizeIndex;
        CACHE: KVNamespace;
        PLAY_AGENT: DurableObjectNamespace<PlayAgent>;
        GENERATION_STATUS: DurableObjectNamespace<GenerationStatusAgent>;
        GOOGLE_CLIENT_ID?: string;
        GOOGLE_CLIENT_SECRET?: string;
        BETTER_AUTH_SECRET: string;
        // OpenRouter API configuration
        OPENROUTER_API_KEY: string;
        // Polar.sh integration
        POLAR_ACCESS_TOKEN: string;
        POLAR_ORGANIZATION_ID?: string;
        POLAR_WEBHOOK_SECRET: string;
        POLAR_SANDBOX?: string;
        // Internal API auth
        INTERNAL_SECRET: string;
        // Billing config overrides
        CREDIT_RATE?: string;
        CREDIT_MARGIN?: string;
        MIN_CREDITS?: string;
        IMAGE_COST_PREVIEW?: string;
        IMAGE_COST_PORTRAIT?: string;
        IMAGE_COST_SCENE?: string;
        MIN_BALANCE_PLAY?: string;
        MIN_BALANCE_GENERATE?: string;
        CREATOR_REVENUE_SHARE?: string;
    };
    Variables: {
        auth: Auth;
        db: DrizzleD1Database<typeof schema>;
        user: Auth["$Infer"]["Session"]["user"] | null;
        session: Auth["$Infer"]["Session"]["session"] | null;
    };
};

/**
 * Inject core dependencies (auth, db) into every request context
 * 
 * Usage:
 *   app.use("*", injectDeps);
 *   // Then access via c.get("auth") and c.get("db")
 */
export const injectDeps = createMiddleware<AppEnv>(async (c, next) => {
    const db = drizzle(c.env.DB, { schema });
    const auth = createAuth(c.env);

    c.set("db", db);
    c.set("auth", auth);

    await next();
});

/**
 * Inject session/user into context for protected routes
 * 
 * Usage:
 *   app.use("/api/*", injectSession);
 *   // Then access via c.get("user") and c.get("session")
 */
export const injectSession = createMiddleware<AppEnv>(async (c, next) => {
    const auth = c.get("auth");
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    c.set("user", session?.user ?? null);
    c.set("session", session?.session ?? null);

    await next();
});
