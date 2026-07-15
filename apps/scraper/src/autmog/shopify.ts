import { z } from "zod";

export const autmogProductsUrl =
  "https://www.autmog.com/collections/currently-available/products.json";

const shopifyVariantSchema = z
  .object({
    available: z.boolean().optional(),
    id: z.union([z.number(), z.string()]),
    price: z.union([z.number(), z.string()]).nullable().optional(),
    title: z.string().nullable().optional(),
  })
  .passthrough();

const shopifyImageSchema = z
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

export type FetchAutmogProductsOptions = {
  fetch?: typeof fetch;
  limit?: number;
  pageLimit?: number;
};

export async function fetchAutmogProducts({
  fetch: fetcher = fetch,
  limit = 250,
  pageLimit = 25,
}: FetchAutmogProductsOptions = {}): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];

  for (let page = 1; page <= pageLimit; page += 1) {
    const url = new URL(autmogProductsUrl);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", String(page));

    const response = await fetcher(url);

    if (!response.ok) {
      throw new Error(`Autmog products fetch failed with ${response.status}.`);
    }

    const payload = shopifyProductsResponseSchema.parse(await response.json());

    if (payload.products.length === 0) {
      break;
    }

    products.push(...payload.products);

    if (payload.products.length < limit) {
      break;
    }
  }

  return products;
}
