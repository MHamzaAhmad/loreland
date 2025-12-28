import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/schema/d1/*.ts",
    out: "./migrations/d1",
    dialect: "sqlite",
    driver: "d1-http",
});
