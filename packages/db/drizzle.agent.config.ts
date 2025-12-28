import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/schema/agent/*.ts",
    out: "./migrations/agent",
    dialect: "sqlite",
    driver: "durable-sqlite",
});
