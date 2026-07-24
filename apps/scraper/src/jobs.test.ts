import { createNoopLogger } from "@package/logger";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAutmogProducer } from "./autmog/producer.js";
import { finishScraperRun, startScraperRun } from "./db/autmog.js";
import { runGrimsmoProducer } from "./grimsmo/producer.js";
import {
  runSourceProducerJob,
  ScraperCommandInterruptedError,
  type ScraperJobContext,
  scraperSourceKeys,
} from "./jobs.js";
import { scraperSources } from "./scraper-types.js";

vi.mock("./autmog/producer.js", () => ({
  runAutmogProducer: vi.fn(async () => ({
    enqueuedCount: 0,
    fetchedCount: 0,
    items: [],
    removedCompletedItemJobs: 0,
  })),
}));

vi.mock("./grimsmo/producer.js", () => ({
  runGrimsmoProducer: vi.fn(async () => ({
    archivedFetchedCount: 0,
    enqueuedCount: 0,
    fetchedCount: 0,
    inventoryFetchedCount: 0,
    items: [],
    removedCompletedItemJobs: 0,
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
  beforeEach(() => {
    vi.mocked(runAutmogProducer).mockResolvedValue({
      enqueuedCount: 0,
      fetchedCount: 0,
      items: [],
      removedCompletedItemJobs: 0,
    });
    vi.mocked(runGrimsmoProducer).mockResolvedValue({
      archivedFetchedCount: 0,
      enqueuedCount: 0,
      fetchedCount: 0,
      inventoryFetchedCount: 0,
      items: [],
      removedCompletedItemJobs: 0,
    });
    vi.mocked(startScraperRun).mockResolvedValue({
      id: 1000,
    } as Awaited<ReturnType<typeof startScraperRun>>);
    vi.mocked(finishScraperRun).mockResolvedValue({
      id: 1000,
    } as Awaited<ReturnType<typeof finishScraperRun>>);
  });

  afterEach(() => {
    vi.mocked(finishScraperRun).mockReset();
    vi.mocked(startScraperRun).mockReset();
    vi.mocked(runAutmogProducer).mockReset();
    vi.mocked(runGrimsmoProducer).mockReset();
  });

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

  it("runs Grimsmo source producers", async () => {
    await expect(
      runSourceProducerJob({
        context: createContext(),
        env: {
          GRIMSMO_PROXY_URL: "https://proxy.example.com",
        } as Parameters<typeof runSourceProducerJob>[0]["env"],
        logger: createNoopLogger(),
        source: scraperSources.grimsmoSaga,
      }),
    ).resolves.toBeUndefined();
  });

  it("marks active producer runs failed when interrupted", async () => {
    vi.mocked(runGrimsmoProducer).mockImplementationOnce(
      ({ signal }) =>
        new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            reject(signal.reason);
          });
        }),
    );

    const promise = runSourceProducerJob({
      context: createContext(),
      logger: createNoopLogger(),
      source: scraperSources.grimsmoSaga,
    });

    await vi.waitFor(() => {
      expect(runGrimsmoProducer).toHaveBeenCalledOnce();
    });
    process.emit("SIGINT", "SIGINT");

    await expect(promise).rejects.toBeInstanceOf(
      ScraperCommandInterruptedError,
    );
    expect(finishScraperRun).toHaveBeenCalledWith(
      expect.anything(),
      1000,
      expect.objectContaining({
        errorMessage: "Scraper command interrupted by SIGINT.",
        status: "failed",
      }),
    );
  });
});

function createContext(): ScraperJobContext {
  return {
    close: vi.fn(),
    db: {} as ScraperJobContext["db"],
    imageFolderPrefix: undefined,
    imageStorage: {} as ScraperJobContext["imageStorage"],
    queues: {
      close: vi.fn(),
      images: {} as ScraperJobContext["queues"]["images"],
      items: {} as ScraperJobContext["queues"]["items"],
    },
    redis: {} as ScraperJobContext["redis"],
  };
}
