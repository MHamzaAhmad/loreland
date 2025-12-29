import { Hono } from "hono";
import { cors } from "hono/cors";
import { injectDeps, injectSession, type AppEnv } from "./lib/context";
import { gamesRouter } from "./routes/games";
import { generateRouter } from "./routes/generate";
import { searchRouter } from "./routes/search";

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

// Search route (must be before games to avoid conflict with :id param)
app.route("/api/games/search", searchRouter);

// Generation routes
app.route("/api/games/generate", generateRouter);

// Game CRUD routes
app.route("/api/games", gamesRouter);

export default app;

