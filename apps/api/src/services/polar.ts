import { Polar } from "@polar-sh/sdk";

export interface CreditPackage {
    id: string;
    name: string;
    description?: string;
    credits: number;
    price: number;
    currency: string;
    discount: number;
    imageUrl?: string;
}

const CACHE_KEY_PREFIX = "polar_products:";
const CACHE_TTL_SECONDS = 600;

type PolarProduct = {
    id: string;
    name: string;
    description: string | null;
    benefits: Array<{ type: string; properties?: { units?: number } }>;
    prices: Array<{ amountType: string; priceAmount?: number; priceCurrency?: string }>;
    medias?: Array<{ publicUrl: string }>;
};

type PolarCheckout = {
    id: string;
    url: string;
};

type PolarEventsIngestResponse = {
    inserted: number;
    duplicates?: number;
};

function isMeterCreditBenefit(benefit: PolarProduct["benefits"][number]): boolean {
    return benefit.type === "meter_credit";
}

function isFixedPrice(price: PolarProduct["prices"][number]): boolean {
    return price.amountType === "fixed" && price.priceAmount !== undefined;
}

export class PolarService {
    private polar: Polar;
    private organizationId?: string;
    private cache: KVNamespace | null;
    private sandbox: boolean;

    constructor(env: {
        POLAR_ACCESS_TOKEN: string;
        POLAR_ORGANIZATION_ID?: string;
        POLAR_SANDBOX?: string;
        CACHE?: KVNamespace;
    }) {
        this.sandbox = env.POLAR_SANDBOX === "true";
        this.polar = new Polar({
            accessToken: env.POLAR_ACCESS_TOKEN,
            server: this.sandbox ? "sandbox" : "production",
        });
        this.organizationId = env.POLAR_ORGANIZATION_ID;
        this.cache = env.CACHE || null;
    }

    async getProducts(): Promise<CreditPackage[]> {
        const cacheKey = `${CACHE_KEY_PREFIX}${this.organizationId}`;

        if (this.cache) {
            try {
                const cached = await this.cache.get(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_SECONDS * 1000) {
                        return parsed.products;
                    }
                }
            } catch (error) {
                console.warn("Failed to read from cache:", error);
            }
        }

        try {
            const pageIterator = await this.polar.products.list({
                organizationId: this.organizationId,
                isArchived: false,
            });

            const products: CreditPackage[] = [];

            for await (const page of pageIterator) {
              for (const product of page.result.items as PolarProduct[]) {
                    const meterCreditBenefit = product.benefits.find(isMeterCreditBenefit);
                    if (!meterCreditBenefit?.properties?.units) continue;

                    const fixedPrice = product.prices.find(isFixedPrice);
                    if (!fixedPrice?.priceAmount) continue;

                    const priceAmount = fixedPrice.priceAmount / 100;
                    const credits = meterCreditBenefit.properties.units;

                    products.push({
                        id: product.id,
                        name: product.name,
                        description: product.description || undefined,
                        credits,
                        price: priceAmount,
                        currency: fixedPrice.priceCurrency || "usd",
                        discount: 0,
                        imageUrl: product.medias?.[0]?.publicUrl || undefined,
                    });
                }
            }

            products.sort((a, b) => a.price - b.price);

            if (this.cache) {
                try {
                    await this.cache.put(
                        cacheKey,
                        JSON.stringify({
                            products,
                            timestamp: Date.now(),
                        }),
                        { expirationTtl: CACHE_TTL_SECONDS }
                    );
                } catch (error) {
                    console.warn("Failed to cache products:", error);
                }
            }

            return products;
        } catch (error) {
            console.error("Failed to fetch products from Polar:", error);

            if (this.cache) {
                try {
                    const cached = await this.cache.get(cacheKey);
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        console.warn("Returning stale cached products due to Polar API error");
                        return parsed.products;
                    }
                } catch {
                    // Ignore cache read errors
                }
            }

            return [];
        }
    }

    async getProduct(productId: string): Promise<CreditPackage | null> {
        const products = await this.getProducts();
        return products.find(p => p.id === productId) || null;
    }

    async createCheckout(
        productId: string,
        options?: {
            customerId?: string;
            customerEmail?: string;
            customerName?: string;
            externalCustomerId?: string;
            successUrl?: string;
        }
    ): Promise<{ checkoutUrl: string; checkoutId: string }> {
        const checkout = (await this.polar.checkouts.create({
            products: [productId],
            customerId: options?.customerId,
            customerEmail: options?.customerEmail,
            customerName: options?.customerName,
            externalCustomerId: options?.externalCustomerId,
            successUrl: options?.successUrl,
        })) as PolarCheckout;

        return {
            checkoutUrl: checkout.url,
            checkoutId: checkout.id,
        };
    }

    async ingestEvent(event: {
        name: string;
        externalCustomerId: string;
        metadata: Record<string, string | number | boolean>;
    }): Promise<{ inserted: number; duplicates: number }> {
        const response = (await this.polar.events.ingest({
            events: [
                {
                    name: event.name,
                    externalCustomerId: event.externalCustomerId,
                    metadata: event.metadata,
                },
            ],
        })) as PolarEventsIngestResponse;

        return {
            inserted: response.inserted,
            duplicates: response.duplicates ?? 0,
        };
    }

    async ingestCreditUsage(
        userId: string,
        credits: number,
        metadata?: {
            type?: string;
            gameId?: string;
            sessionId?: string;
        }
    ): Promise<void> {
        await this.ingestEvent({
            name: "credit_usage",
            externalCustomerId: userId,
            metadata: {
                credits,
                ...metadata,
            },
        });
    }

    async clearCache(): Promise<void> {
        if (this.cache) {
            const cacheKey = `${CACHE_KEY_PREFIX}${this.organizationId}`;
            await this.cache.delete(cacheKey);
        }
    }
}
