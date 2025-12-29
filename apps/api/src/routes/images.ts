import { Hono } from "hono";
import type { AppEnv } from "../lib/context";

const imagesRouter = new Hono<AppEnv>();

/**
 * GET /api/images/* - Serve images from R2
 * The wildcard captures the full key including slashes
 */
imagesRouter.get("/*", async (c) => {
    const key = c.req.path.replace("/api/images/", "");

    if (!key) {
        return c.json({ error: "Image key required" }, 400);
    }

    const object = await c.env.IMAGES.get(key);

    if (!object) {
        return c.json({ error: "Image not found" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

    return new Response(object.body, {
        headers,
    });
});

export { imagesRouter };
