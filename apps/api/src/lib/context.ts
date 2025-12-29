import { createMiddleware } from "hono/factory";
import { createAuth, type Auth } from "../auth";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";

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
        GOOGLE_CLIENT_ID?: string;
        GOOGLE_CLIENT_SECRET?: string;
    };
    Variables: {
        auth: Auth;
        db: DrizzleD1Database;
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
    const db = drizzle(c.env.DB);
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
