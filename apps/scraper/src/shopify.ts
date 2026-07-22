import { setTimeout as sleep } from "node:timers/promises";
import { ProxyAgent } from "undici";
import { z } from "zod";

export const shopifyVariantSchema = z
  .object({
    available: z.boolean().optional(),
    id: z.union([z.number(), z.string()]),
    price: z.union([z.number(), z.string()]).nullable().optional(),
    title: z.string().nullable().optional(),
  })
  .passthrough();

export const shopifyImageSchema = z
  .object({
    alt: z.string().nullable().optional(),
    height: z.number().nullable().optional(),
    id: z.union([z.number(), z.string()]).nullable().optional(),
    position: z.number().nullable().optional(),
    src: z.string().url(),
    width: z.number().nullable().optional(),
  })
  .passthrough();

export const shopifyProductSchema = z
  .object({
    available: z.boolean().optional(),
    body_html: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    handle: z.string(),
    id: z.union([z.number(), z.string()]),
    images: z.array(shopifyImageSchema).default([]),
    product_type: z.string().nullable().optional(),
    published_at: z.string().nullable().optional(),
    tags: z.array(z.string()).default([]),
    title: z.string(),
    updated_at: z.string().nullable().optional(),
    variants: z.array(shopifyVariantSchema).default([]),
    vendor: z.string().nullable().optional(),
  })
  .passthrough();

const shopifyProductsResponseSchema = z.object({
  products: z.array(shopifyProductSchema),
});

export type ShopifyProduct = z.infer<typeof shopifyProductSchema>;

export type FetchShopifyCollectionProductsOptions = {
  collectionUrl: string;
  fetch?: typeof fetch;
  limit?: number;
  pageLimit?: number;
  pagePauseMs?: number;
  proxyUrl?: string;
  retries?: number;
  userAgent?: string;
};

export async function fetchShopifyCollectionProducts({
  collectionUrl,
  fetch: fetcher = fetch,
  limit = 250,
  pageLimit = 25,
  pagePauseMs = 0,
  proxyUrl,
  retries = 1,
  userAgent = "field-log-scraper/1.0",
}: FetchShopifyCollectionProductsOptions): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];

  for (let page = 1; page <= pageLimit; page += 1) {
    const url = new URL(collectionUrl);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", String(page));

    const response = await fetchWithRetry({
      fetcher,
      proxyUrl,
      retries,
      url,
      userAgent,
    });

    if (!response.ok) {
      throw new Error(
        `Shopify products fetch failed with ${response.status} for ${collectionUrl}.`,
      );
    }

    const payload = shopifyProductsResponseSchema.parse(await response.json());

    if (payload.products.length === 0) {
      break;
    }

    products.push(...payload.products);

    if (payload.products.length < limit) {
      break;
    }

    if (pagePauseMs > 0) {
      await sleep(pagePauseMs);
    }
  }

  return products;
}

async function fetchWithRetry({
  fetcher,
  proxyUrl,
  retries,
  url,
  userAgent,
}: {
  fetcher: typeof fetch;
  proxyUrl?: string;
  retries: number;
  url: URL;
  userAgent: string;
}) {
  let lastError: unknown;
  const attempts = Math.max(1, retries);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetcher(
        url,
        await getFetchInit({ proxyUrl, userAgent }),
      );

      if (response.ok || attempt === attempts) {
        return response;
      }

      lastError = new Error(
        `Shopify products fetch failed with ${response.status}.`,
      );
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        throw error;
      }
    }

    await sleep(1_000 * attempt);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Shopify products fetch failed.");
}

async function getFetchInit({
  proxyUrl,
  userAgent,
}: {
  proxyUrl?: string;
  userAgent: string;
}): Promise<RequestInit> {
  const headers = {
    accept: "application/json,image/*",
    "user-agent": userAgent,
  };

  if (!proxyUrl) {
    return { headers };
  }

  return {
    dispatcher: new ProxyAgent(proxyUrl),
    headers,
  } as RequestInit;
}
