import { Hono } from "hono";
import type { AppEnv } from "../lib/context";

const userRouter = new Hono<AppEnv>();

/**
 * GET /api/user/me - Get current user with auth state
 * 
 * Returns user info including isAnonymous flag
 */
userRouter.get("/me", async (c) => {
    const user = c.get("user");
    const session = c.get("session");

    if (!user || !session) {
        return c.json({
            authenticated: false,
            user: null
        });
    }

    return c.json({
        authenticated: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            isAnonymous: (user as unknown as { isAnonymous?: boolean }).isAnonymous ?? false,
        },
    });
});

export { userRouter };
