import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../lib/context";
import { CreditsService } from "../services/credits";
import { polarWebhooks, users } from "@packages/db/schema/d1";
import { PolarService } from "../services/polar";

export const webhooksRouter = new Hono<AppEnv>();

webhooksRouter.post("/polar", async (c) => {
    const payload = await c.req.text();
    const signature = c.req.header("Webhook-Signature") || "";

    const secret = c.env.POLAR_WEBHOOK_SECRET;

    let body: {
        type: string;
        data: {
            id: string;
            customer?: {
                id: string;
                external_id?: string;
                email?: string;
            };
            product?: {
                id: string;
                name: string;
            };
            items?: Array<{
                product?: {
                    id: string;
                };
            }>;
            amount?: number;
            currency?: string;
        };
    };

    try {
        body = JSON.parse(payload);
    } catch {
        console.error("Failed to parse webhook payload");
        return c.json({ error: "Invalid JSON" }, 400);
    }

    const eventId = body.data.id;
    const eventType = body.type;

    const existing = await c
        .get("db")
        .select()
        .from(polarWebhooks)
        .where(eq(polarWebhooks.eventId, eventId))
        .get();

    if (existing) {
        console.log(`Polar webhook ${eventId} already processed, skipping`);
        return c.json({ status: "already_processed" }, 200);
    }

    try {
        switch (eventType) {
            case "order.paid": {
                const customerId = body.data.customer?.external_id;
                const productId = body.data.product?.id || body.data.items?.[0]?.product?.id;

                if (!customerId || !productId) {
                    console.error(`Polar webhook ${eventId}: Missing customer or product`);
                    return c.json({ error: "Invalid payload" }, 400);
                }

                const polar = new PolarService({
                    POLAR_ACCESS_TOKEN: c.env.POLAR_ACCESS_TOKEN,
                    POLAR_ORGANIZATION_ID: c.env.POLAR_ORGANIZATION_ID,
                    POLAR_SANDBOX: c.env.POLAR_SANDBOX,
                    CACHE: c.env.CACHE,
                });

                const product = await polar.getProduct(productId);
                if (!product) {
                    console.error(`Polar webhook ${eventId}: Product ${productId} not found`);
                    return c.json({ error: "Product not found" }, 400);
                }

                const creditsAmount = product.credits;

                if (creditsAmount === 0) {
                    console.error(`Polar webhook ${eventId}: Could not determine credits for product ${productId}`);
                    return c.json({ error: "Invalid product configuration" }, 400);
                }

                const creditsService = new CreditsService(c.get("db"), c.env);
                await creditsService.addCredits(customerId, creditsAmount, {
                    type: "purchase",
                    polarEventId: eventId,
                    description: `Purchased ${creditsAmount} credits via Polar (${product.name})`,
                });

                console.log(`Polar webhook ${eventId}: Added ${creditsAmount} credits to user ${customerId}`);
                break;
            }

            case "order.created": {
                console.log(`Polar webhook ${eventId}: Order created for customer ${body.data.customer?.external_id}`);
                break;
            }

            case "order.refunded": {
                console.log(`Polar webhook ${eventId}: Order refunded - no action taken (credits retained)`);
                break;
            }

            case "subscription.created":
            case "subscription.active":
            case "subscription.updated":
            case "subscription.canceled":
            case "subscription.revoked": {
                console.log(`Polar webhook ${eventId}: Subscription event received`);
                break;
            }

            default:
                console.log(`Polar webhook ${eventId}: Unhandled event type ${eventType}`);
        }

        await c.get("db").insert(polarWebhooks).values({
            eventId,
            eventType,
            customerId: body.data.customer?.external_id,
            productId: body.data.product?.id,
            amount: body.data.amount,
            currency: body.data.currency,
        });

        return c.json({ status: "processed" }, 200);
    } catch (error) {
        console.error(`Polar webhook ${eventId} processing error:`, error);
        return c.json({ error: "Processing failed" }, 500);
    }
});

webhooksRouter.get("/health", async (c) => {
    return c.json({ status: "ok", provider: "polar" });
});
