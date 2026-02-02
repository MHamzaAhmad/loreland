/**
 * Webhooks Route
 * 
 * Handles incoming webhooks from Xsolla for payment processing.
 * Xsolla Pay Station sends webhooks when users complete credit purchases.
 */

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../lib/context";
import { CreditsService } from "../services/credits";
import { xsollaWebhooks, users } from "@packages/db/schema/d1";
import { XsollaPayStationService } from "../services/xsolla-paystation";

export const webhooksRouter = new Hono<AppEnv>();

/**
 * Xsolla Webhook Handler
 * POST /api/webhooks/xsolla
 * 
 * Handles:
 * - order_paid: Credit purchase completed - adds credits to user account
 * - payment: Payment confirmation
 * - user_validation: Validate user exists before payment
 * 
 * Xsolla webhook format:
 * {
 *   notification_type: "order_paid" | "payment" | "user_validation",
 *   order: { id, status, amount, currency },
 *   user: { id, email },
 *   items: [{ sku, quantity, amount }]
 * }
 */
webhooksRouter.post("/xsolla", async (c) => {
    const body = await c.req.json();
    const signature = c.req.header("Authorization");

    // Verify webhook signature
    // Xsolla sends: Authorization: Signature <secret_key>
    const expectedSignature = `Signature ${c.env.XSOLLA_WEBHOOK_SECRET}`;
    if (signature !== expectedSignature) {
        console.error("Xsolla webhook signature verification failed");
        return c.json({ error: "Invalid signature" }, 401);
    }

    const { notification_type, order, user, items } = body;

    // Idempotency check - prevent double-processing
    const eventId = order?.id || crypto.randomUUID();
    const existing = await c
        .get("db")
        .select()
        .from(xsollaWebhooks)
        .where(eq(xsollaWebhooks.eventId, eventId))
        .get();

    if (existing) {
        console.log(`Xsolla webhook ${eventId} already processed, skipping`);
        return c.json({ status: "already_processed" }, 200);
    }

    try {
        switch (notification_type) {
            case "order_paid": {
                const userId = user?.id;
                const item = items?.[0];
                
                if (!userId || !item) {
                    console.error(`Xsolla webhook ${eventId}: Missing user or items`);
                    return c.json({ error: "Invalid payload" }, 400);
                }

                // Validate SKU
                const sku = item.sku;
                const xsolla = new XsollaPayStationService({
                    XSOLLA_MERCHANT_ID: c.env.XSOLLA_MERCHANT_ID,
                    XSOLLA_PROJECT_ID: c.env.XSOLLA_PROJECT_ID,
                    XSOLLA_API_KEY: c.env.XSOLLA_API_KEY,
                    XSOLLA_SANDBOX: c.env.XSOLLA_SANDBOX,
                    CACHE: c.env.CACHE,
                });

                const isValid = await xsolla.isValidPackage(sku);
                if (!isValid) {
                    console.error(`Xsolla webhook ${eventId}: Invalid SKU ${sku}`);
                    return c.json({ error: "Invalid SKU" }, 400);
                }

                // Get credits from Xsolla or calculate from SKU
                let creditsAmount = await xsolla.getCreditsFromSku(sku);
                
                // If Xsolla API is down, try to extract from webhook payload directly
                if (creditsAmount === 0 && item.content) {
                    // Xsolla sends content array with virtual currency details
                    const vcContent = item.content.find((c: { type: string; quantity?: number }) => c.type === "virtual_currency");
                    if (vcContent?.quantity) {
                        creditsAmount = vcContent.quantity * (item.quantity || 1);
                    }
                }

                if (creditsAmount === 0) {
                    console.error(`Xsolla webhook ${eventId}: Could not determine credits for SKU ${sku}`);
                    return c.json({ error: "Invalid package configuration" }, 400);
                }

                // Add credits to user account
                const creditsService = new CreditsService(c.get("db"), c.env);
                await creditsService.addCredits(userId, creditsAmount, {
                    type: "purchase",
                    xsollaEventId: eventId,
                    description: `Purchased ${creditsAmount} credits via Xsolla (${sku})`,
                });

                console.log(`Xsolla webhook ${eventId}: Added ${creditsAmount} credits to user ${userId}`);
                break;
            }

            case "user_validation": {
                // Validate that user exists before allowing purchase
                const userId = user?.id;
                if (!userId) {
                    return c.json({ error: "Missing user ID" }, 400);
                }

                const userExists = await c
                    .get("db")
                    .select()
                    .from(users)
                    .where(eq(users.id, userId))
                    .get();

                if (!userExists) {
                    console.error(`Xsolla webhook ${eventId}: User ${userId} not found`);
                    return c.json({ error: "User not found" }, 404);
                }

                // User exists, validation successful
                console.log(`Xsolla webhook ${eventId}: User ${userId} validated`);
                break;
            }

            case "payment": {
                // Payment confirmation - already handled by order_paid
                // Log for analytics but no action needed
                console.log(`Xsolla webhook ${eventId}: Payment event received for order ${order?.id}`);
                break;
            }

            default:
                console.log(`Xsolla webhook ${eventId}: Unhandled notification type ${notification_type}`);
        }

        // Mark webhook as processed
        await c.get("db").insert(xsollaWebhooks).values({
            eventId,
            eventType: notification_type,
            userId: user?.id,
            sku: items?.[0]?.sku,
            quantity: items?.[0]?.quantity,
            amount: order?.amount,
            currency: order?.currency,
        });

        return c.json({ status: "processed" }, 200);
    } catch (error) {
        console.error(`Xsolla webhook ${eventId} processing error:`, error);
        // Return 500 to trigger retry
        return c.json({ error: "Processing failed" }, 500);
    }
});

/**
 * GET /api/webhooks/health
 * Health check endpoint for webhook status
 */
webhooksRouter.get("/health", async (c) => {
    return c.json({ status: "ok", provider: "xsolla" });
});
