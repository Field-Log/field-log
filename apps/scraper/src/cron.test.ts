import { createNoopLogger } from "@package/logger";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getRecurringTaskDueState, runRailwayCronJob } from "./cron.js";
import {
  runQueueProcessorJob,
  runSourceProducerJob,
  type ScraperJobContext,
  type ScraperJobEnv,
} from "./jobs.js";

vi.mock("./jobs.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./jobs.js")>();

  return {
    ...actual,
    runQueueProcessorJob: vi.fn(),
    runSourceProducerJob: vi.fn(),
  };
});

describe("Railway scraper cron", () => {
  afterEach(() => {
    vi.mocked(runQueueProcessorJob).mockReset();
    vi.mocked(runSourceProducerJob).mockReset();
  });

  it("runs a recurring task that has never completed", () => {
    expect(
      getRecurringTaskDueState({
        intervalMinutes: 60,
        lastRunAt: null,
        now: new Date("2026-07-16T12:00:00.000Z"),
      }),
    ).toEqual({
      due: true,
      reason: "never-run",
    });
  });

  it("skips a recurring task before the interval has elapsed", () => {
    expect(
      getRecurringTaskDueState({
        intervalMinutes: 60,
        lastRunAt: "2026-07-16T11:15:00.000Z",
        now: new Date("2026-07-16T12:00:00.000Z"),
      }),
    ).toEqual({
      due: false,
      lastRunAt: "2026-07-16T11:15:00.000Z",
      minutesSinceLastRun: 45,
      nextRunAt: "2026-07-16T12:15:00.000Z",
      reason: "interval-not-elapsed",
    });
  });

  it("runs a recurring task after the interval has elapsed", () => {
    expect(
      getRecurringTaskDueState({
        intervalMinutes: 60,
        lastRunAt: "2026-07-16T11:00:00.000Z",
        now: new Date("2026-07-16T12:02:00.000Z"),
      }),
    ).toEqual({
      due: true,
      lastRunAt: "2026-07-16T11:00:00.000Z",
      minutesSinceLastRun: 62,
      nextRunAt: "2026-07-16T12:00:00.000Z",
      reason: "interval-elapsed",
    });
  });

  it("logs task failures without rejecting the cron run", async () => {
    vi.mocked(runSourceProducerJob).mockRejectedValueOnce(
      new Error("producer failed"),
    );
    vi.mocked(runQueueProcessorJob).mockResolvedValueOnce(undefined);

    await expect(
      runRailwayCronJob({
        context: createContext(),
        env: createEnv(),
        logger: createNoopLogger(),
        now: new Date("2026-07-16T12:00:00.000Z"),
      }),
    ).resolves.toBeUndefined();
    expect(runSourceProducerJob).toHaveBeenCalledTimes(2);
    expect(
      vi.mocked(runSourceProducerJob).mock.calls.map(([input]) => input.source),
    ).toEqual(["autmog", "grimsmo-saga"]);
    expect(runQueueProcessorJob).toHaveBeenCalledOnce();
  });

  it("waits for Grimsmo stagger offsets on first run", async () => {
    vi.mocked(runSourceProducerJob).mockResolvedValue(undefined);
    vi.mocked(runQueueProcessorJob).mockResolvedValue(undefined);

    await runRailwayCronJob({
      context: createContext(),
      env: createEnv(),
      logger: createNoopLogger(),
      now: new Date("2026-07-16T12:14:00.000Z"),
    });

    expect(
      vi.mocked(runSourceProducerJob).mock.calls.map(([input]) => input.source),
    ).toEqual(["autmog", "grimsmo-saga"]);
  });

  it("runs a staggered Grimsmo knife source once its offset is reached", async () => {
    vi.mocked(runSourceProducerJob).mockResolvedValue(undefined);
    vi.mocked(runQueueProcessorJob).mockResolvedValue(undefined);

    await runRailwayCronJob({
      context: createContext(),
      env: createEnv(),
      logger: createNoopLogger(),
      now: new Date("2026-07-16T12:15:00.000Z"),
    });

    expect(
      vi.mocked(runSourceProducerJob).mock.calls.map(([input]) => input.source),
    ).toEqual(["autmog", "grimsmo-saga", "grimsmo-rask"]);
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
    redis: {
      get: vi.fn(async () => null),
      set: vi.fn(async () => "OK"),
    } as unknown as ScraperJobContext["redis"],
  };
}

function createEnv(): ScraperJobEnv {
  return {
    SCRAPER_AUTMOG_INTERVAL_MINUTES: 60,
    SCRAPER_GRIMSMO_FJELL_START_DELAY_SECONDS: 30 * 60,
    SCRAPER_GRIMSMO_INTERVAL_MINUTES: 60,
    SCRAPER_GRIMSMO_NORSEMAN_START_DELAY_SECONDS: 45 * 60,
    SCRAPER_GRIMSMO_RASK_START_DELAY_SECONDS: 15 * 60,
    SCRAPER_GRIMSMO_SAGA_START_DELAY_SECONDS: 0,
    SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES: 15,
  } as ScraperJobEnv;
}
