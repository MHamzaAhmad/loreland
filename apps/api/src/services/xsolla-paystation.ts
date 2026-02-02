/**
 * Xsolla Pay Station Service
 * 
 * Handles payment token generation and dynamic package fetching for credit pack purchases.
 * Fetches available packages from Xsolla Store API with KV caching.
 */

interface XsollaTokenRequest {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  purchase: {
    virtual_items: Array<{
      sku: string;
      quantity: number;
    }>;
  };
  settings: {
    project_id: number;
    mode: "sandbox" | "production";
  };
}

interface XsollaTokenResponse {
  token: string;
  order_id?: string;
}

interface XsollaPackageResponse {
  has_more: boolean;
  items: XsollaPackageItem[];
}

interface XsollaPackageItem {
  sku: string;
  name: {
    [locale: string]: string;
  };
  type: "bundle";
  description?: {
    [locale: string]: string;
  };
  image_url?: string;
  is_free: boolean;
  price: {
    amount: string;
    amount_without_discount: string;
    currency: string;
  };
  bundle_type: "virtual_currency_package";
  content: Array<{
    sku: string;
    name: string;
    type: "virtual_currency";
    description?: string;
    image_url?: string;
    quantity: number;
  }>;
  can_be_bought: boolean;
}

export interface CreditPackage {
  sku: string;
  name: string;
  description?: string;
  credits: number;
  price: number;
  currency: string;
  discount: number;
  imageUrl?: string;
}

const CACHE_KEY_PREFIX = "xsolla_packages:";
const CACHE_TTL_SECONDS = 600; // 10 minutes

export class XsollaPayStationService {
  private merchantId: string;
  private projectId: number;
  private apiKey: string;
  private sandbox: boolean;
  private cache: KVNamespace | null;

  constructor(env: {
    XSOLLA_MERCHANT_ID: string;
    XSOLLA_PROJECT_ID: string;
    XSOLLA_API_KEY: string;
    XSOLLA_SANDBOX?: string;
    CACHE?: KVNamespace;
  }) {
    this.merchantId = env.XSOLLA_MERCHANT_ID;
    this.projectId = parseInt(env.XSOLLA_PROJECT_ID, 10);
    this.apiKey = env.XSOLLA_API_KEY;
    this.sandbox = env.XSOLLA_SANDBOX === "true";
    this.cache = env.CACHE || null;
  }

  /**
   * Fetch packages from Xsolla Store API with caching
   * Uses client-side catalog API (no admin credentials needed)
   */
  async fetchPackagesFromXsolla(locale: string = "en"): Promise<CreditPackage[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}${this.projectId}:${locale}`;
    
    // Try to get from cache first
    if (this.cache) {
      try {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Check if cache is still valid (not expired)
          if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_SECONDS * 1000) {
            console.log("Returning cached Xsolla packages");
            return parsed.packages;
          }
        }
      } catch (error) {
        console.warn("Failed to read from cache:", error);
      }
    }

    // Fetch from Xsolla API
    const baseUrl = this.sandbox 
      ? "https://store.xsolla.com/api/v2/project"
      : "https://store.xsolla.com/api/v2/project";
    
    const url = new URL(`${baseUrl}/${this.projectId}/items/virtual_currency/package`);
    url.searchParams.append("limit", "50");
    url.searchParams.append("locale", locale);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch packages from Xsolla: ${response.status} ${response.statusText}`);
    }

    const data: XsollaPackageResponse = await response.json();
    
    // Transform to our format
    const packages: CreditPackage[] = data.items
      .filter(item => item.bundle_type === "virtual_currency_package" && item.can_be_bought && !item.is_free)
      .map(item => {
        const content = item.content?.[0];
        const amount = parseFloat(item.price.amount);
        const amountWithoutDiscount = parseFloat(item.price.amount_without_discount);
        const discount = amountWithoutDiscount > amount 
          ? Math.round(((amountWithoutDiscount - amount) / amountWithoutDiscount) * 100)
          : 0;

        return {
          sku: item.sku,
          name: item.name[locale] || item.name["en"] || item.sku,
          description: item.description?.[locale] || item.description?.["en"],
          credits: content?.quantity || 0,
          price: amount,
          currency: item.price.currency,
          discount,
          imageUrl: item.image_url,
        };
      })
      .filter(pkg => pkg.credits > 0); // Only include packages that give credits

    // Cache the result
    if (this.cache) {
      try {
        await this.cache.put(
          cacheKey,
          JSON.stringify({
            packages,
            timestamp: Date.now(),
          }),
          { expirationTtl: CACHE_TTL_SECONDS }
        );
      } catch (error) {
        console.warn("Failed to cache packages:", error);
      }
    }

    return packages;
  }

  /**
   * Get available credit packages (uses cache if available)
   */
  async getPackages(locale: string = "en"): Promise<CreditPackage[]> {
    try {
      return await this.fetchPackagesFromXsolla(locale);
    } catch (error) {
      console.error("Failed to fetch packages from Xsolla:", error);
      
      // Try to return stale cache as fallback
      if (this.cache) {
        try {
          const cacheKey = `${CACHE_KEY_PREFIX}${this.projectId}:${locale}`;
          const cached = await this.cache.get(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            console.warn("Returning stale cached packages due to Xsolla API error");
            return parsed.packages;
          }
        } catch {
          // Ignore cache read errors
        }
      }
      
      // Return empty array if all else fails
      return [];
    }
  }

  /**
   * Validate if a SKU is a valid credit package
   */
  async isValidPackage(sku: string, locale: string = "en"): Promise<boolean> {
    const packages = await this.getPackages(locale);
    return packages.some(pkg => pkg.sku === sku);
  }

  /**
   * Get credit amount for a specific SKU
   */
  async getCreditsFromSku(sku: string, locale: string = "en"): Promise<number> {
    const packages = await this.getPackages(locale);
    const pkg = packages.find(p => p.sku === sku);
    return pkg?.credits || 0;
  }

  /**
   * Generate payment token for credit pack purchase
   * 
   * @param userId - Internal user ID
   * @param email - User email
   * @param sku - Credit package SKU
   * @param quantity - Quantity (default 1)
   * @returns Payment token and URL
   */
  async generateToken(
    userId: string,
    email: string,
    sku: string,
    quantity: number = 1
  ): Promise<{ token: string; payment_url: string }> {
    // Validate SKU first
    const isValid = await this.isValidPackage(sku);
    if (!isValid) {
      throw new Error(`Invalid credit package SKU: ${sku}`);
    }

    const request: XsollaTokenRequest = {
      user: {
        id: userId,
        email: email,
      },
      purchase: {
        virtual_items: [{ sku, quantity }],
      },
      settings: {
        project_id: this.projectId,
        mode: this.sandbox ? "sandbox" : "production",
      },
    };

    const response = await fetch(
      `https://api.xsolla.com/merchant/v2/merchants/${this.merchantId}/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${this.merchantId}:${this.apiKey}`)}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xsolla token generation failed: ${response.status} - ${error}`);
    }

    const data: XsollaTokenResponse = await response.json();
    
    return {
      token: data.token,
      payment_url: `https://secure.xsolla.com/paystation4/?access_token=${data.token}`,
    };
  }

  /**
   * Clear the package cache (useful for testing or force refresh)
   */
  async clearCache(locale: string = "en"): Promise<void> {
    if (this.cache) {
      const cacheKey = `${CACHE_KEY_PREFIX}${this.projectId}:${locale}`;
      await this.cache.delete(cacheKey);
    }
  }
}

// Backwards compatibility functions
export async function isValidCreditPackage(
  sku: string, 
  env: ConstructorParameters<typeof XsollaPayStationService>[0]
): Promise<boolean> {
  const service = new XsollaPayStationService(env);
  return service.isValidPackage(sku);
}

export async function getCreditsFromSku(
  sku: string,
  env: ConstructorParameters<typeof XsollaPayStationService>[0]
): Promise<number> {
  const service = new XsollaPayStationService(env);
  return service.getCreditsFromSku(sku);
}
