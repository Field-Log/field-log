import { createNoopLogger } from "@package/logger";
import { describe, expect, it, vi } from "vitest";
import type { ScraperQueues } from "../queue/queues.js";
import { scraperSources } from "../scraper-types.js";
import type { ShopifyProduct } from "../shopify.js";
import { runGrimsmoProducer } from "./producer.js";

describe("runGrimsmoProducer", () => {
  it("fetches inventory and archive listings as variation jobs", async () => {
    const addBulk = vi.fn().mockResolvedValue([]);
    const queues = {
      close: vi.fn(),
      images: { addBulk: vi.fn() },
      items: {
        addBulk,
        getJob: vi.fn(async () => null),
      },
    } as unknown as ScraperQueues;
    const fetcher = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      const url = input instanceof URL ? input : new URL(String(input));
      const handle = url.pathname.split("/").at(-2);

      if (handle === "saga-inventory") {
        return jsonResponse([createProduct({ handle: "saga-1", id: 1 })]);
      }

      if (handle === "saga") {
        return jsonResponse([
          createProduct({ handle: "saga-1", id: 1 }),
          createProduct({ available: false, handle: "saga-2", id: 2 }),
        ]);
      }

      return jsonResponse([]);
    });

    const result = await runGrimsmoProducer({
      fetch: fetcher as typeof fetch,
      logger: createNoopLogger({ app: "scraper" }),
      pagePauseMs: 0,
      queues,
      source: scraperSources.grimsmoSaga,
    });

    expect(result.fetchedCount).toBe(2);
    expect(result.inventoryFetchedCount).toBe(1);
    expect(result.archivedFetchedCount).toBe(1);
    expect(addBulk).toHaveBeenCalledTimes(1);
    const [jobs] = addBulk.mock.calls[0] ?? [];
    expect(jobs).toHaveLength(3);
    expect(jobs[0]).toMatchObject({
      data: {
        item: {
          product: {
            productHandle: "saga",
          },
          sourceCollection: "inventory",
          sourceHandle: "saga-1",
        },
        source: "grimsmo-saga",
        type: "grimsmo.penVariation",
      },
      name: "grimsmo.penVariation",
    });
    expect(jobs[1]).toMatchObject({
      data: {
        item: {
          sourceCollection: "archive",
          sourceHandle: "saga-2",
        },
        source: "grimsmo-saga",
        type: "grimsmo.penVariation",
      },
    });
    expect(jobs[2]).toMatchObject({
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({ sourceHandle: "saga-1" }),
          expect.objectContaining({ sourceHandle: "saga-2" }),
        ]),
        source: "grimsmo-saga",
        type: "grimsmo.penVariationBatch",
      },
      name: "grimsmo.penVariationBatch",
    });
  });
});

function jsonResponse(products: ShopifyProduct[]) {
  return new Response(JSON.stringify({ products }));
}

function createProduct(overrides: Partial<ShopifyProduct>): ShopifyProduct {
  return {
    available: true,
    body_html: "<ul><li>Stonewashed Titanium Body</li></ul>",
    created_at: "2026-01-01T00:00:00Z",
    handle: "saga-1",
    id: 1,
    images: [],
    product_type: "Pens",
    published_at: "2026-01-02T00:00:00Z",
    tags: ["grimsmo"],
    title: "Saga #1",
    updated_at: "2026-01-03T00:00:00Z",
    variants: [
      {
        available: true,
        id: 1,
        price: "975.00",
        title: "Default Title",
      },
    ],
    vendor: "Grimsmo",
    ...overrides,
  };
}
