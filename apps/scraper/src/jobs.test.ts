import { createNoopLogger } from "@package/logger";
import { describe, expect, it, vi } from "vitest";
import {
  runSourceProducerJob,
  type ScraperJobContext,
  scraperSourceKeys,
} from "./jobs.js";
import { scraperSources } from "./scraper-types.js";

vi.mock("./autmog/producer.js", () => ({
  runAutmogProducer: vi.fn(async () => ({
    enqueuedCount: 0,
    fetchedCount: 0,
    items: [],
  })),
}));

vi.mock("./db/autmog.js", () => ({
  createScraperDb: vi.fn(),
  finishScraperRun: vi.fn(),
  startScraperRun: vi.fn(async () => ({
    id: 1000,
  })),
}));

describe("scraper jobs", () => {
  it("exposes supported source keys", () => {
    expect(scraperSourceKeys).toContain(scraperSources.autmog);
    expect(scraperSourceKeys).toContain(scraperSources.grimsmoSaga);
    expect(scraperSourceKeys).toContain(scraperSources.grimsmoFjell);
  });

  it("runs the Autmog source producer", async () => {
    await expect(
      runSourceProducerJob({
        context: createContext(),
        logger: createNoopLogger(),
        source: scraperSources.autmog,
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects source keys without implemented producers", async () => {
    await expect(
      runSourceProducerJob({
        context: createContext(),
        logger: createNoopLogger(),
        source: scraperSources.grimsmoSaga,
      }),
    ).rejects.toThrow('Scraper source "grimsmo-saga" is not implemented yet.');
  });
});

function createContext(): ScraperJobContext {
  return {
    close: vi.fn(),
    db: {} as ScraperJobContext["db"],
    imageStorage: {} as ScraperJobContext["imageStorage"],
    queues: {
      close: vi.fn(),
      images: {} as ScraperJobContext["queues"]["images"],
      items: {} as ScraperJobContext["queues"]["items"],
    },
    redis: {} as ScraperJobContext["redis"],
  };
}
