import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchShopifyCollectionProducts } from "./shopify.js";

describe("fetchShopifyCollectionProducts", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("times out stalled requests", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_input, init) => {
      const signal = init?.signal;

      return new Promise<Response>((_, reject) => {
        signal?.addEventListener("abort", () => {
          reject(signal.reason);
        });
      });
    });
    const promise = fetchShopifyCollectionProducts({
      collectionUrl: "https://example.com/collections/products/products.json",
      fetch: fetcher as typeof fetch,
      requestTimeoutMs: 10,
      retries: 1,
    });
    const rejection = expect(promise).rejects.toThrow(
      "Shopify products fetch timed out after 10ms",
    );

    await vi.advanceTimersByTimeAsync(10);
    await rejection;
  });
});
