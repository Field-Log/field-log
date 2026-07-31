import { loggerMessages } from "@package/logger";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createScraperLogger } from "./logger.js";

describe("createScraperLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses AXIOM_DATASET for the logged environment instead of APP_ENV", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetch);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    const logger = createScraperLogger({
      appEnv: "development",
      axiomDataset: "production",
      axiomToken: "token",
    });

    logger.info(loggerMessages.scraper.run.started);
    await logger.flush();

    expect(fetch).toHaveBeenCalledWith(
      "https://api.axiom.co/v1/datasets/production/ingest",
      expect.objectContaining({
        body: expect.any(String),
      }),
    );
    const call = fetch.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) {
      throw new Error("Expected Axiom fetch to be called.");
    }
    const [, init] = call;
    const body = JSON.parse(String(init?.body));

    expect(body).toEqual([
      expect.objectContaining({
        app: "scraper",
        environment: "production",
        message: loggerMessages.scraper.run.started,
      }),
    ]);
  });
});
