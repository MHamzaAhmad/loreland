import { Hono } from "hono";
import { cors } from "hono/cors";
import { injectDeps, injectSession, type AppEnv } from "./lib/context";
import { gamesRouter } from "./routes/games";
import { generateRouter } from "./routes/generate";

// Re-export workflow for Cloudflare
export { GameGenerationWorkflow } from "./workflows/game-generation";

const app = new Hono<AppEnv>();

// Inject dependencies (auth, db) on every request
app.use("*", injectDeps);

// CORS middleware - must be registered before routes
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "https://loreland.pages.dev"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// Auth handler - uses injected auth from context
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return c.get("auth").handler(c.req.raw);
});

// Inject session/user for protected API routes
app.use("/api/*", injectSession);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Example protected route
app.get("/api/me", (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json({ user });
});

// Game CRUD routes
app.route("/api/games", gamesRouter);

// Generation routes (nested under games for clarity)
app.route("/api/games/generate", generateRouter);

export default app;
