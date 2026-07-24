import {
  fetchShopifyCollectionProducts,
  type ShopifyProduct,
} from "../shopify.js";

export const autmogProductsUrl =
  "https://www.autmog.com/collections/currently-available/products.json";

export type { ShopifyProduct };

export type FetchAutmogProductsOptions = {
  fetch?: typeof fetch;
  limit?: number;
  pageLimit?: number;
  signal?: AbortSignal;
};

export async function fetchAutmogProducts({
  fetch: fetcher,
  limit,
  pageLimit,
  signal,
}: FetchAutmogProductsOptions = {}): Promise<ShopifyProduct[]> {
  return fetchShopifyCollectionProducts({
    collectionUrl: autmogProductsUrl,
    fetch: fetcher,
    limit,
    pageLimit,
    signal,
  });
}
