/**
 * Webhooks Route
 * 
 * Handles incoming webhooks from Polar.sh for payment processing.
 */

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import type { AppEnv } from "../lib/context";
import { CreditsService } from "../services/credits";
import { polarWebhooks, users } from "@packages/db/schema/d1";

export const webhooksRouter = new Hono<AppEnv>();

/**
 * Convert Headers to Record<string, string> for Polar SDK
 */
function headersToRecord(headers: Headers): Record<string, string> {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
        record[key] = value;
    });
    return record;
}

/**
 * POST /api/webhooks/polar
 * 
 * Handles Polar.sh webhook events:
 * - order.paid: Credit purchase completed
 * - benefit_grant.created: Subscription benefit granted
 * - subscription.canceled: Handle subscription end
 */
webhooksRouter.post("/polar", async (c) => {
    const body = await c.req.text();

    // Validate webhook signature
    let event: { type: string; data: Record<string, unknown> };
    try {
        const validated = validateEvent(
            body,
            headersToRecord(c.req.raw.headers),
            c.env.POLAR_WEBHOOK_SECRET
        );
        // Cast to simpler type for our usage
        event = {
            type: validated.type,
            data: validated.data as Record<string, unknown>,
        };
    } catch (error) {
        if (error instanceof WebhookVerificationError) {
            console.error("Webhook signature verification failed:", error.message);
            return c.json({ error: "Invalid signature" }, 403);
        }
        throw error;
    }

    const db = c.get("db");

    // Extract event ID from data (Polar includes this in the payload)
    const eventId = (event.data.id as string) || crypto.randomUUID();

    // Idempotency check - prevent double-processing
    const existing = await db
        .select()
        .from(polarWebhooks)
        .where(eq(polarWebhooks.eventId, eventId))
        .get();

    if (existing) {
        console.log(`Webhook ${eventId} already processed, skipping`);
        return c.json({ status: "already_processed" }, 200);
    }

    // Process based on event type
    try {
        switch (event.type) {
            case "order.paid":
            case "benefit_grant.created": {
                // Extract credits from product metadata
                const product = event.data.product as { metadata?: { credits?: number } } | undefined;
                const creditsAmount = product?.metadata?.credits;

                if (!creditsAmount || typeof creditsAmount !== "number") {
                    console.warn(`Webhook ${eventId}: No credits in product metadata`);
                    break;
                }

                // Get user by Polar customer email
                const customer = event.data.customer as { email?: string } | undefined;
                const customerEmail = customer?.email;
                if (!customerEmail) {
                    console.error(`Webhook ${eventId}: No customer email in event`);
                    break;
                }

                // Look up user by email
                const user = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, customerEmail))
                    .get();

                if (!user) {
                    console.error(`Webhook ${eventId}: No user found for email ${customerEmail}`);
                    // Still mark as processed to prevent retries
                    break;
                }

                // Add credits to user account
                const creditsService = new CreditsService(db, c.env);
                await creditsService.addCredits(user.id, creditsAmount, {
                    type: "purchase",
                    polarEventId: eventId,
                    description: `Purchased ${creditsAmount} credits via Polar`,
                });

                console.log(`Webhook ${eventId}: Added ${creditsAmount} credits to user ${user.id}`);
                break;
            }

            case "subscription.canceled": {
                // For now, just log. Credits already purchased remain.
                // Could implement grace period or credit expiration here.
                console.log(`Webhook ${eventId}: Subscription canceled`);

                // If this was a usage billing subscription, revert to prepaid
                const customer = event.data.customer as { email?: string } | undefined;
                if (customer?.email) {
                    const user = await db
                        .select()
                        .from(users)
                        .where(eq(users.email, customer.email))
                        .get();

                    if (user) {
                        const creditsService = new CreditsService(db, c.env);
                        await creditsService.setBillingMode(user.id, "prepaid", null);
                        console.log(`Webhook ${eventId}: Reverted user ${user.id} to prepaid billing`);
                    }
                }
                break;
            }

            case "subscription.active": {
                // User subscribed - check if it's a usage billing plan
                const product = event.data.product as { metadata?: { billingMode?: string } } | undefined;
                const customer = event.data.customer as { email?: string } | undefined;
                const subscriptionId = event.data.id as string;

                if (product?.metadata?.billingMode === "usage" && customer?.email) {
                    const user = await db
                        .select()
                        .from(users)
                        .where(eq(users.email, customer.email))
                        .get();

                    if (user) {
                        const creditsService = new CreditsService(db, c.env);
                        await creditsService.setBillingMode(user.id, "usage", subscriptionId);
                        console.log(`Webhook ${eventId}: Set user ${user.id} to usage billing`);
                    }
                }
                break;
            }

            default:
                console.log(`Webhook ${eventId}: Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error(`Webhook ${eventId} processing error:`, error);
        // Return 500 to trigger retry
        return c.json({ error: "Processing failed" }, 500);
    }

    // Mark webhook as processed
    await db.insert(polarWebhooks).values({
        eventId,
        eventType: event.type,
    });

    return c.json({ status: "processed" }, 200);
});
